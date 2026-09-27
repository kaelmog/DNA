import 'server-only'

import { getOrderWithItems } from '@/lib/checkout/orders'
import { isSupabaseAdminConfigured } from '@/lib/env.server'
import type { OrderWithItems } from '@/lib/types'

/** How long /checkout/success?order=<id> shows the order after it was placed. */
export const CONFIRMATION_LINK_DAYS = 7

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * The manual-payment order behind a confirmation link, or null.
 *
 * The random order id works as the link's secret, so the page is limited on
 * purpose: only orders placed without Stripe (Stripe orders use their session
 * id), only for a few days, and the page never shows the full address.
 * `orderId` must already be a valid uuid.
 */
export async function getManualOrderConfirmation(orderId: string): Promise<OrderWithItems | null> {
  if (!isSupabaseAdminConfigured) return null

  const order = await getOrderWithItems(orderId)
  if (!order || order.stripe_checkout_session_id !== null) return null

  // No lower bound: the database clock may run slightly ahead of this server's.
  const ageMs = Date.now() - new Date(order.created_at).getTime()
  return ageMs <= CONFIRMATION_LINK_DAYS * DAY_MS ? order : null
}
