import 'server-only'

import type Stripe from 'stripe'

import { fulfillCheckoutSession, isSessionPaid, orderIdFromSession } from '@/lib/checkout/fulfillment'
import { getOrderWithItemsBySessionId } from '@/lib/checkout/orders'
import { isStripeConfigured, isSupabaseAdminConfigured } from '@/lib/env.server'
import { getStripe } from '@/lib/stripe'
import type { OrderWithItems } from '@/lib/types'

/**
 * What the /checkout/success page should show for a Stripe session id.
 * Only plain data leaves this module: no Stripe objects reach the page.
 */
export type CheckoutOutcome =
  | { state: 'not-configured' }
  | { state: 'not-found' }
  /** The shopper has not paid yet (for example they opened the link by hand). */
  | { state: 'open' }
  | { state: 'expired' }
  | {
      state: 'complete'
      /** "processing" = a delayed payment method (bank debit) that has not cleared yet. */
      payment: 'paid' | 'processing'
      order: OrderWithItems | null
      email: string | null
    }

async function retrieveSession(sessionId: string) {
  try {
    return await getStripe().checkout.sessions.retrieve(sessionId)
  } catch (error) {
    console.warn('[checkout] success page could not load session', error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * Normally the webhook has already marked the order as paid. Doing it here as
 * well means a slow or misconfigured webhook never leaves a paid order looking
 * unpaid. Only a still-pending order is touched, so revisiting this page can
 * never revive an order the owner cancelled later.
 */
async function confirmIfStillPending(session: Stripe.Checkout.Session, order: OrderWithItems | null) {
  if (!order || order.status !== 'pending' || orderIdFromSession(session) !== order.id) return order
  try {
    const marked = await fulfillCheckoutSession(session)
    return marked ? await getOrderWithItemsBySessionId(session.id) : order
  } catch (error) {
    console.error('[checkout] success page confirmation failed', error instanceof Error ? error.message : error)
    return order
  }
}

export async function getCheckoutOutcome(sessionId: string): Promise<CheckoutOutcome> {
  if (!isStripeConfigured || !isSupabaseAdminConfigured) return { state: 'not-configured' }

  const session = await retrieveSession(sessionId)
  if (!session) return { state: 'not-found' }
  if (session.status === 'open') return { state: 'open' }
  if (session.status === 'expired') return { state: 'expired' }

  const paid = isSessionPaid(session)
  const storedOrder = await getOrderWithItemsBySessionId(session.id)
  const order = paid ? await confirmIfStillPending(session, storedOrder) : storedOrder

  return {
    state: 'complete',
    payment: paid ? 'paid' : 'processing',
    order,
    email: order?.email ?? session.customer_details?.email ?? null,
  }
}
