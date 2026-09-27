import 'server-only'

import { getCurrentProfile, getCurrentUser } from '@/lib/auth'
import { cancelPendingOrder } from '@/lib/checkout/orders'
import { errorMessage, prepareOrder, reservePendingOrder } from '@/lib/checkout/order-steps'
import type { ParsedCheckoutRequest } from '@/lib/checkout/schemas'
import { resolveStripeCustomerId } from '@/lib/checkout/stripe-customer'
import { createStripeCheckoutSession, expireStripeSession } from '@/lib/checkout/stripe-session'
import type { CheckoutResult } from '@/lib/checkout/types'
import { getStoreSettings } from '@/lib/data/settings'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Stripe Checkout, step by step:
 *   1-3. price the bag, validate the discount and reserve stock in a pending
 *        order (shared with manual orders, see order-steps.ts),
 *   4.   open a Stripe Checkout Session for exactly those amounts.
 * If step 4 fails, the order is cancelled, and the database trigger returns the stock.
 * The Stripe webhook later marks the order as paid (see webhook-handlers.ts).
 */

const GENERIC_ERROR = 'We couldn’t start checkout. Please try again in a moment.'

/** Signed-in shoppers get their profile email and a Stripe customer; guests type their email on Stripe. */
async function resolveBuyer() {
  const user = await getCurrentUser()
  if (!user) return { userId: null, email: null, customerId: null }

  const profile = await getCurrentProfile()
  const email = profile?.email || user.email || null
  const customerId = await resolveStripeCustomerId({
    userId: user.id,
    email,
    name: profile?.full_name ?? null,
    stripeCustomerId: profile?.stripe_customer_id ?? null,
  })
  return { userId: user.id, email, customerId }
}

async function saveCheckoutSessionId(orderId: string, sessionId: string) {
  const { error } = await createAdminClient()
    .from('orders')
    .update({ stripe_checkout_session_id: sessionId })
    .eq('id', orderId)
  if (error) throw new Error(`saving the session id failed: ${error.message}`)
}

/** Undo a reservation when Stripe could not be reached: nobody can pay, stock goes back. */
async function abandonOrder(orderId: string, sessionId: string | null) {
  if (sessionId) await expireStripeSession(sessionId)
  try {
    await cancelPendingOrder(orderId, 'Checkout could not start')
  } catch (error) {
    console.error('[checkout] could not release reserved stock', orderId, errorMessage(error))
  }
}

export async function createCheckout(request: ParsedCheckoutRequest): Promise<CheckoutResult> {
  const settings = await getStoreSettings()
  const preparedStep = await prepareOrder(request, settings)
  if (!preparedStep.ok) return preparedStep
  const prepared = preparedStep.value

  const buyer = await resolveBuyer()

  const orderStep = await reservePendingOrder(
    { order: prepared, currency: settings.currency, note: request.note, buyer },
    GENERIC_ERROR,
  )
  if (!orderStep.ok) return orderStep
  const order = orderStep.value

  // From here on stock is reserved: any failure must cancel the order to release it.
  let sessionId: string | null = null
  try {
    const session = await createStripeCheckoutSession({
      order,
      lines: prepared.lines,
      totals: prepared.totals,
      shippingMethod: prepared.shippingMethod,
      discountCode: prepared.discountCode,
      settings,
      customerId: buyer.customerId,
      customerEmail: buyer.email,
    })
    sessionId = session.id
    if (!session.url) throw new Error('Stripe returned a session without a URL')

    await saveCheckoutSessionId(order.id, session.id)
    return { ok: true, url: session.url }
  } catch (error) {
    console.error('[checkout] could not start stripe checkout', errorMessage(error))
    await abandonOrder(order.id, sessionId)
    return { ok: false, message: GENERIC_ERROR }
  }
}
