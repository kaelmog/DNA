import 'server-only'

import { cancelPendingOrder } from '@/lib/checkout/orders'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Order } from '@/lib/types'

type ReleasableOrder = Pick<Order, 'id' | 'user_id' | 'status' | 'stripe_checkout_session_id'>

/**
 * Called when a shopper clicks "back" on Stripe's page. Stock was reserved when
 * checkout started; without this it would stay reserved until the session
 * expires (about 30 minutes), and a one-of-a-kind piece would show as sold out
 * in the shopper's own bag.
 *
 * Safe by construction: the order is only cancelled after Stripe confirms the
 * session is expired, so it can no longer be paid. Returns true when stock was released.
 */
export async function releaseAbandonedCheckout(orderId: string, currentUserId: string | null) {
  const { data: order, error } = await createAdminClient()
    .from('orders')
    .select('id, user_id, status, stripe_checkout_session_id')
    .eq('id', orderId)
    .maybeSingle<ReleasableOrder>()

  if (error) console.error('[checkout] release lookup failed', error.message)
  if (!order || order.status !== 'pending' || !order.stripe_checkout_session_id) return false
  // An order placed by a signed-in account can only be released by that account.
  if (order.user_id && order.user_id !== currentUserId) return false

  try {
    const stripe = getStripe()
    let session = await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id)
    if (session.status === 'open') session = await stripe.checkout.sessions.expire(session.id)
    // "complete" means the shopper paid (or a delayed payment is on its way): keep the order.
    if (session.status !== 'expired') return false

    return await cancelPendingOrder(order.id, 'Checkout cancelled by customer')
  } catch (error) {
    console.error('[checkout] could not release checkout', error instanceof Error ? error.message : error)
    return false
  }
}
