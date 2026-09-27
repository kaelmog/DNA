import 'server-only'

import { after } from 'next/server'
import type Stripe from 'stripe'

import { getOrderWithItems } from '@/lib/checkout/orders'
import { getStoreSettings } from '@/lib/data/settings'
import { notifyAdmin, sendEmail } from '@/lib/email'
import { adminNewOrderEmail, orderConfirmationEmail } from '@/lib/emails/order-emails'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ShippingAddress } from '@/lib/types'
import { uuidField } from '@/lib/validation'

/**
 * Marks an order as paid from a completed Stripe Checkout Session.
 * Used by the webhook (source of truth) and by the success page (so a
 * delayed webhook never leaves a paid order looking unpaid).
 *
 * Safe to call any number of times: `mark_order_paid` only updates a
 * pending/cancelled order and returns true the first time, so confirmation
 * emails go out exactly once. Only pass sessions retrieved from Stripe or
 * taken from a signature-verified webhook event.
 */

/** The order id we attached when creating the session. */
export function orderIdFromSession(session: Stripe.Checkout.Session) {
  const candidate = session.metadata?.order_id ?? session.client_reference_id
  return uuidField.safeParse(candidate).success ? (candidate as string) : null
}

export function isSessionPaid(session: Stripe.Checkout.Session) {
  return session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
}

function toShippingAddress(session: Stripe.Checkout.Session): ShippingAddress | null {
  const details = session.collected_information?.shipping_details
  if (!details?.address) return null
  const { address } = details
  return {
    name: details.name ?? null,
    line1: address.line1 ?? '',
    line2: address.line2 ?? null,
    city: address.city ?? '',
    state: address.state ?? null,
    postal_code: address.postal_code ?? '',
    country: address.country ?? '',
  }
}

/** What Stripe actually charged. Missing values are sent as null so the database keeps what it has. */
function toPaymentPayload(session: Stripe.Checkout.Session) {
  const paymentIntent = session.payment_intent
  const shippingAddress = toShippingAddress(session)
  return {
    payment_intent_id: typeof paymentIntent === 'string' ? paymentIntent : (paymentIntent?.id ?? null),
    email: session.customer_details?.email ?? session.customer_email ?? null,
    customer_name: session.customer_details?.name ?? session.collected_information?.shipping_details?.name ?? null,
    phone: session.customer_details?.phone ?? null,
    // Omitted rather than null: the SQL keeps the old value only when the key is absent.
    ...(shippingAddress ? { shipping_address: shippingAddress } : {}),
    // The shipping method was stored when the order was created, so it is not repeated here.
    subtotal_cents: session.amount_subtotal,
    discount_cents: session.total_details?.amount_discount ?? null,
    shipping_cents: session.total_details?.amount_shipping ?? null,
    tax_cents: session.total_details?.amount_tax ?? null,
    total_cents: session.amount_total,
  }
}

/** Order confirmation to the customer and a heads-up to the owner. Never throws. */
export async function sendOrderEmails(orderId: string) {
  try {
    const [order, settings] = await Promise.all([getOrderWithItems(orderId), getStoreSettings()])
    if (!order) return

    if (order.email) {
      const confirmation = orderConfirmationEmail(order, settings)
      await sendEmail({ to: order.email, ...confirmation, replyTo: settings.support_email ?? undefined })
    }
    const notification = adminNewOrderEmail(order, settings)
    await notifyAdmin(notification.subject, notification.html, order.email ?? undefined)
  } catch (error) {
    console.error('[checkout] order emails failed', orderId, error instanceof Error ? error.message : error)
  }
}

/**
 * Returns true when this call marked the order as paid. Throws on database
 * errors so the webhook answers 500 and Stripe retries.
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  const orderId = orderIdFromSession(session)
  if (!orderId) {
    console.warn('[checkout] session without an order id', session.id)
    return false
  }

  const { data, error } = await createAdminClient().rpc('mark_order_paid', {
    p_order_id: orderId,
    p_payment: toPaymentPayload(session),
  })
  if (error) throw new Error(`mark_order_paid failed: ${error.message}`)

  const newlyPaid = data === true
  // Emails run after the response is sent, so Stripe gets a fast answer and email problems cannot fail it.
  if (newlyPaid) after(() => sendOrderEmails(orderId))
  return newlyPaid
}
