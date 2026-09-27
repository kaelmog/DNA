import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { OrderItem, OrderWithItems } from '@/lib/types'

/**
 * Order reads and writes used by checkout, the Stripe webhook and the success
 * page. They run with the secret key (no signed-in admin behind them), so
 * callers must only pass ids they got from a trusted source (our database or
 * a verified Stripe object).
 */

type OrderRow = Omit<OrderWithItems, 'items'> & { items: OrderItem[] | null }

const ORDER_WITH_ITEMS = '*, items:order_items(*)'

function withSortedItems(row: OrderRow): OrderWithItems {
  const items = [...(row.items ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at))
  return { ...row, items }
}

export async function getOrderWithItems(orderId: string): Promise<OrderWithItems | null> {
  const { data, error } = await createAdminClient()
    .from('orders')
    .select(ORDER_WITH_ITEMS)
    .eq('id', orderId)
    .maybeSingle<OrderRow>()

  if (error) console.error('[orders] load by id failed', error.message)
  return data ? withSortedItems(data) : null
}

/** Looks an order up by its Stripe Checkout Session id (unguessable, so safe for the success page). */
export async function getOrderWithItemsBySessionId(sessionId: string): Promise<OrderWithItems | null> {
  const { data, error } = await createAdminClient()
    .from('orders')
    .select(ORDER_WITH_ITEMS)
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle<OrderRow>()

  if (error) console.error('[orders] load by session failed', error.message)
  return data ? withSortedItems(data) : null
}

/**
 * Cancels an order that is still waiting for payment. The database trigger
 * returns its reserved stock. Orders that were paid in the meantime are left alone.
 * Returns true when an order was cancelled.
 */
export async function cancelPendingOrder(orderId: string, reason: string) {
  const { data, error } = await createAdminClient()
    .from('orders')
    .update({ status: 'cancelled', cancel_reason: reason })
    .eq('id', orderId)
    .eq('status', 'pending')
    .select('id')

  if (error) {
    console.error('[orders] cancel failed', error.message)
    throw new Error('Could not cancel the pending order.')
  }
  return data.length > 0
}
