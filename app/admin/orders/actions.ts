'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import {
  allowedStatusTargets,
  canMarkAsPaid,
  SHIPPABLE_STATUSES,
  statusChangeBlockedReason,
} from '@/components/admin/orders/status-rules'
import { actionError, actionSuccess, actionValidationError, formDataToObject, type ActionState } from '@/lib/actions'
import { requireAdmin } from '@/lib/auth'
import { ADMIN_ORDER_STATUSES, ORDER_STATUS } from '@/lib/constants'
import { getStoreSettings } from '@/lib/data/settings'
import { sendEmail } from '@/lib/email'
import { orderConfirmationEmail } from '@/lib/emails/order-emails'
import { orderShippedEmail } from '@/lib/emails/shipping-emails'
import { isEmailConfigured, isSupabaseAdminConfigured } from '@/lib/env.server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Order, OrderItem, OrderStatus, OrderWithItems } from '@/lib/types'
import { checkboxField, optionalText, uuidField } from '@/lib/validation'

const LOAD_FAILED = 'Could not load the order. Please try again.'
const SAVE_FAILED = 'Could not save the order. Please try again.'
const ORDER_CHANGED = 'The order changed while you were editing it. Refresh the page and try again.'
const ORDER_MISSING = 'This order no longer exists.'

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && Boolean(url.hostname)
  } catch {
    return false
  }
}

/** The order pages that show status, tracking or notes. */
function revalidateOrderPages(orderId: string) {
  revalidatePath('/admin')
  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/account/orders')
  revalidatePath(`/account/orders/${orderId}`)
}

type OrderState = Pick<Order, 'id' | 'status' | 'paid_at' | 'stripe_payment_intent_id'>

async function loadOrderState(orderId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, paid_at, stripe_payment_intent_id')
    .eq('id', orderId)
    .maybeSingle<OrderState>()
  if (error) console.error('[admin/orders] load failed', error.message)
  return { order: data, failed: Boolean(error) }
}

type OrderRow = Omit<OrderWithItems, 'items'> & { items: OrderItem[] | null }

/** The order with its line items (sorted as they were added), for emails. */
async function loadOrderWithItems(orderId: string): Promise<OrderWithItems | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', orderId)
    .maybeSingle<OrderRow>()
  if (error) console.error('[admin/orders] load with items failed', error.message)
  if (!data) return null
  return {
    ...data,
    order_number: Number(data.order_number),
    items: [...(data.items ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

const statusSchema = z
  .object({
    orderId: uuidField,
    status: z.enum(ADMIN_ORDER_STATUSES as [OrderStatus, ...OrderStatus[]], { error: 'Choose a status.' }),
    cancelReason: optionalText(500),
  })
  .refine((data) => data.status !== 'cancelled' || data.cancelReason, {
    path: ['cancelReason'],
    message: 'Add a short reason for cancelling.',
  })

export async function updateOrderStatus(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const parsed = statusSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionValidationError(parsed.error)
  const { orderId, status, cancelReason } = parsed.data

  const { order, failed } = await loadOrderState(orderId)
  if (failed) return actionError(LOAD_FAILED)
  if (!order) return actionError(ORDER_MISSING)
  if (order.status === status) return actionSuccess('The order already has that status.')

  const wasPaid = Boolean(order.paid_at)
  if (!allowedStatusTargets(order.status, wasPaid).includes(status)) {
    return actionError(statusChangeBlockedReason(order.status, wasPaid))
  }

  // Cancelling returns reserved stock and reopening takes it again: both happen
  // in a database trigger. The status condition makes sure nobody (for example
  // the Stripe webhook) changed the order since it was loaded.
  const supabase = await createClient()
  const { data: updated, error } = await supabase
    .from('orders')
    .update({ status, cancel_reason: status === 'cancelled' ? cancelReason : null })
    .eq('id', orderId)
    .eq('status', order.status)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[admin/orders] status update failed', error.message)
    return actionError(SAVE_FAILED)
  }
  if (!updated) return actionError(ORDER_CHANGED)

  revalidateOrderPages(orderId)

  if (status === 'cancelled') {
    if (!wasPaid) return actionSuccess('Order cancelled and its reserved stock returned.')
    return actionSuccess(
      order.stripe_payment_intent_id
        ? 'Order cancelled and its stock returned. Remember to refund the payment in Stripe.'
        : 'Order cancelled and its stock returned. Remember to refund the customer the way they paid you.',
    )
  }
  return actionSuccess(`Order status changed to “${ORDER_STATUS[status].label}”.`)
}

// ---------------------------------------------------------------------------
// Manual payments ("Mark as paid")
// ---------------------------------------------------------------------------

/** Emails the order confirmation after a manual payment. Returns the sentence to show the admin. Never throws. */
async function sendPaymentConfirmation(orderId: string) {
  try {
    const [order, settings] = await Promise.all([loadOrderWithItems(orderId), getStoreSettings()])
    if (!order?.email) return 'It has no email address, so no confirmation was sent.'
    if (!isEmailConfigured) return 'Email is not set up yet (see the /todo page), so the customer was not emailed.'

    const email = orderConfirmationEmail(order, settings)
    const sent = await sendEmail({
      to: order.email,
      subject: email.subject,
      html: email.html,
      replyTo: settings.support_email ?? undefined,
    })
    return sent
      ? `A confirmation was emailed to ${order.email}.`
      : 'The confirmation email could not be sent. Check the email setup on the /todo page.'
  } catch (error) {
    console.error('[admin/orders] payment confirmation email failed', error instanceof Error ? error.message : error)
    return 'The confirmation email could not be sent.'
  }
}

/**
 * Confirms a manual payment (bank transfer, cash, PayPal...) for an order that
 * is awaiting payment. `mark_order_paid` is the same database function the
 * Stripe webhook uses: it sets the status and paid date and counts the
 * discount redemption exactly once. It only runs with the secret key, so the
 * admin client is used here, after requireAdmin().
 */
export async function markOrderPaid(orderId: string): Promise<ActionState> {
  await requireAdmin()

  const parsedId = uuidField.safeParse(orderId)
  if (!parsedId.success) return actionError(ORDER_MISSING)
  const id = parsedId.data

  if (!isSupabaseAdminConfigured) {
    return actionError('Add SUPABASE_SECRET_KEY to your environment variables to confirm payments (see the /todo page).')
  }

  const { order, failed } = await loadOrderState(id)
  if (failed) return actionError(LOAD_FAILED)
  if (!order) return actionError(ORDER_MISSING)
  if (!canMarkAsPaid(order.status)) {
    return order.status === 'cancelled' || order.status === 'refunded'
      ? actionError(`This order is ${ORDER_STATUS[order.status].label.toLowerCase()}, so it cannot be marked as paid.`)
      : actionSuccess('This order is already paid.')
  }

  const { data: newlyPaid, error } = await createAdminClient().rpc('mark_order_paid', {
    p_order_id: id,
    p_payment: {},
  })
  if (error) {
    console.error('[admin/orders] mark paid failed', error.message)
    return actionError(SAVE_FAILED)
  }

  revalidateOrderPages(id)
  // false means someone else (for example the Stripe webhook) confirmed it a moment ago.
  if (newlyPaid !== true) return actionSuccess('This order is already paid.')

  const emailOutcome = await sendPaymentConfirmation(id)
  return actionSuccess(`Order marked as paid. ${emailOutcome}`)
}

// ---------------------------------------------------------------------------
// Fulfilment (tracking + optional "mark as shipped" email)
// ---------------------------------------------------------------------------

const fulfillmentSchema = z.object({
  orderId: uuidField,
  carrier: optionalText(60),
  trackingNumber: optionalText(100),
  trackingUrl: optionalText(500).refine(
    (value) => value === null || isHttpsUrl(value),
    'Enter a full link that starts with https://',
  ),
  markShipped: checkboxField,
})

export async function updateFulfillment(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const parsed = fulfillmentSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionValidationError(parsed.error)
  const { orderId, carrier, trackingNumber, trackingUrl, markShipped } = parsed.data

  const { order, failed } = await loadOrderState(orderId)
  if (failed) return actionError(LOAD_FAILED)
  if (!order) return actionError(ORDER_MISSING)
  if (markShipped && !SHIPPABLE_STATUSES.includes(order.status)) {
    return actionError('Only paid orders can be marked as shipped. Your tracking details were not saved.')
  }

  const supabase = await createClient()
  let query = supabase
    .from('orders')
    .update({
      carrier,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      ...(markShipped ? { status: 'shipped' satisfies OrderStatus } : {}),
    })
    .eq('id', orderId)
  // When changing the status, make sure it did not change since it was loaded.
  if (markShipped) query = query.eq('status', order.status)

  const { data: updated, error } = await query
    .select('*, items:order_items(*)')
    .maybeSingle<OrderWithItems>()

  if (error) {
    console.error('[admin/orders] fulfilment update failed', error.message)
    return actionError(SAVE_FAILED)
  }
  if (!updated) return actionError(ORDER_CHANGED)

  revalidateOrderPages(orderId)

  if (!markShipped) return actionSuccess('Tracking details saved.')
  if (!updated.email) {
    return actionSuccess('Order marked as shipped. It has no email address, so no email was sent.')
  }

  // The save already succeeded: an email problem is reported, not treated as a failure.
  const settings = await getStoreSettings()
  const email = orderShippedEmail(
    {
      ...updated,
      order_number: Number(updated.order_number),
      items: [...(updated.items ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    },
    settings,
  )
  const sent = await sendEmail({
    to: updated.email,
    subject: email.subject,
    html: email.html,
    replyTo: settings.support_email ?? undefined,
  })

  return actionSuccess(
    sent
      ? `Order marked as shipped and the customer was emailed at ${updated.email}.`
      : 'Order marked as shipped, but the shipping email could not be sent. Check the email setup on the /todo page.',
  )
}

// ---------------------------------------------------------------------------
// Private admin note
// ---------------------------------------------------------------------------

const noteSchema = z.object({
  orderId: uuidField,
  adminNote: optionalText(4000),
})

export async function updateAdminNote(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const parsed = noteSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionValidationError(parsed.error)
  const { orderId, adminNote } = parsed.data

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .update({ admin_note: adminNote })
    .eq('id', orderId)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[admin/orders] note update failed', error.message)
    return actionError(SAVE_FAILED)
  }
  if (!data) return actionError(ORDER_MISSING)

  revalidatePath(`/admin/orders/${orderId}`)
  return actionSuccess('Note saved.')
}
