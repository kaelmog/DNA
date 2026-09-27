import 'server-only'

import type Stripe from 'stripe'

import { fulfillCheckoutSession, isSessionPaid, orderIdFromSession } from '@/lib/checkout/fulfillment'
import { cancelPendingOrder } from '@/lib/checkout/orders'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Order } from '@/lib/types'

/**
 * Stripe webhook event handlers. Each one is idempotent, because Stripe may
 * deliver an event more than once. Database errors are thrown so the route
 * answers 500 and Stripe retries later.
 *
 * Events to enable on the Stripe webhook endpoint:
 *   checkout.session.completed, checkout.session.async_payment_succeeded,
 *   checkout.session.async_payment_failed, checkout.session.expired, charge.refunded
 */

export type HandleResult = 'handled' | 'ignored'

/** True when this event id was already processed successfully. */
export async function isEventProcessed(eventId: string) {
  const { data, error } = await createAdminClient()
    .from('stripe_events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle<{ id: string }>()
  if (error) throw new Error(`stripe_events lookup failed: ${error.message}`)
  return Boolean(data)
}

/** Remembers a processed event. A duplicate insert (two deliveries at once) is fine. */
export async function recordEvent(event: Stripe.Event) {
  const { error } = await createAdminClient().from('stripe_events').insert({ id: event.id, type: event.type })
  if (error && error.code !== '23505') console.error('[webhook] could not record event', event.id, error.message)
}

/** Card payments arrive "paid"; delayed methods (bank debits) arrive "unpaid" and finish later. */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<HandleResult> {
  if (!isSessionPaid(session)) return 'ignored'
  await fulfillCheckoutSession(session)
  return 'handled'
}

/** Payment failed or the session expired: cancel the pending order so its stock is returned. */
async function cancelSessionOrder(session: Stripe.Checkout.Session, reason: string): Promise<HandleResult> {
  const orderId = orderIdFromSession(session)
  if (!orderId) return 'ignored'
  await cancelPendingOrder(orderId, reason)
  return 'handled'
}

/** Refunds are issued from the Stripe dashboard; mirror the refunded amount on the order. */
async function handleChargeRefunded(charge: Stripe.Charge): Promise<HandleResult> {
  const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
  if (!paymentIntentId) return 'ignored'

  const admin = createAdminClient()
  const { data: order, error } = await admin
    .from('orders')
    .select('id, status')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .limit(1)
    .maybeSingle<Pick<Order, 'id' | 'status'>>()
  if (error) throw new Error(`refund order lookup failed: ${error.message}`)
  if (!order) {
    console.warn('[webhook] refund for a payment without an order', paymentIntentId)
    return 'ignored'
  }

  const update: Partial<Pick<Order, 'refunded_cents' | 'status'>> = { refunded_cents: charge.amount_refunded }
  // A cancelled order already had its stock returned. Moving it to "refunded" would make the
  // status trigger take that stock again, so it keeps its "cancelled" status.
  if (charge.amount_refunded >= charge.amount && order.status !== 'cancelled') update.status = 'refunded'

  const { error: updateError } = await admin.from('orders').update(update).eq('id', order.id)
  if (updateError) throw new Error(`refund update failed: ${updateError.message}`)
  return 'handled'
}

export async function handleStripeEvent(event: Stripe.Event): Promise<HandleResult> {
  switch (event.type) {
    case 'checkout.session.completed':
      return handleCheckoutCompleted(event.data.object)
    case 'checkout.session.async_payment_succeeded':
      await fulfillCheckoutSession(event.data.object)
      return 'handled'
    case 'checkout.session.async_payment_failed':
      return cancelSessionOrder(event.data.object, 'Payment failed')
    case 'checkout.session.expired':
      return cancelSessionOrder(event.data.object, 'Checkout expired')
    case 'charge.refunded':
      return handleChargeRefunded(event.data.object)
    default:
      return 'ignored'
  }
}
