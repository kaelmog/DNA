import 'server-only'

import { cache } from 'react'

import { ADMIN_PAGE_SIZE, ORDER_STATUS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import type { Order, OrderStatus, OrderWithItems } from '@/lib/types'

/**
 * Order queries for the admin area. They run as the signed-in admin, so Row
 * Level Security returns every order. Callers must run requireAdmin() first.
 */

const ALL_STATUSES = Object.keys(ORDER_STATUS) as OrderStatus[]

/**
 * Tabs on /admin/orders. "paid" is the fulfilment queue (paid + processing):
 * the dashboard links to ?status=paid. "Awaiting payment" comes right after
 * it because manual-payment orders wait there until the owner confirms the
 * money arrived. "all" hides unpaid orders, which have that tab of their own.
 */
export const ORDER_TABS = [
  { value: 'paid', label: 'Needs fulfilment', statuses: ['paid', 'processing'] },
  { value: 'pending', label: 'Awaiting payment', statuses: ['pending'] },
  { value: 'all', label: 'All', statuses: ['paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] },
  { value: 'shipped', label: 'Shipped', statuses: ['shipped'] },
  { value: 'delivered', label: 'Delivered', statuses: ['delivered'] },
  { value: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] },
  { value: 'refunded', label: 'Refunded', statuses: ['refunded'] },
] as const satisfies readonly { value: string; label: string; statuses: readonly OrderStatus[] }[]

export type OrderTab = (typeof ORDER_TABS)[number]['value']

/** Maps ?status= to a tab. "processing" belongs to the fulfilment queue; anything unknown shows All. */
export function parseOrderTab(value: string | undefined): OrderTab {
  if (value === 'processing') return 'paid'
  return ORDER_TABS.find((tab) => tab.value === value)?.value ?? 'all'
}

function statusesForTab(tab: OrderTab): OrderStatus[] {
  const match = ORDER_TABS.find((item) => item.value === tab)
  return match ? [...match.statuses] : ALL_STATUSES
}

/** Escapes LIKE wildcards so a search for "a_b" matches literally. */
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`)
}

export interface AdminOrderRow
  extends Pick<
    Order,
    | 'id'
    | 'order_number'
    | 'created_at'
    | 'customer_name'
    | 'email'
    | 'status'
    | 'total_cents'
    | 'currency'
    | 'stripe_checkout_session_id'
    | 'stripe_payment_intent_id'
  > {
  /** Total quantity of all line items. */
  item_count: number
}

type OrderListRow = Omit<AdminOrderRow, 'item_count'> & { order_items: { quantity: number }[] | null }

/**
 * One page of orders for a tab, newest first. The search matches an order
 * number ("1042" or "#1042") exactly, otherwise the email address (contains).
 */
export async function getAdminOrders({
  tab,
  search,
  page,
}: {
  tab: OrderTab
  search?: string
  page: number
}): Promise<{ items: AdminOrderRow[]; total: number; pageCount: number }> {
  const supabase = await createClient()
  const from = (page - 1) * ADMIN_PAGE_SIZE

  let query = supabase
    .from('orders')
    .select(
      'id, order_number, created_at, customer_name, email, status, total_cents, currency, stripe_checkout_session_id, stripe_payment_intent_id, order_items(quantity)',
      { count: 'exact' },
    )
    .in('status', statusesForTab(tab))

  const term = search?.trim()
  if (term) {
    const orderNumber = term.replace(/^#/, '')
    query = /^\d{1,15}$/.test(orderNumber)
      ? query.eq('order_number', Number(orderNumber))
      : query.ilike('email', `%${escapeLike(term)}%`)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1)
    .overrideTypes<OrderListRow[], { merge: false }>()

  if (error) {
    console.error('[admin/orders] list failed', error.message)
    return { items: [], total: 0, pageCount: 1 }
  }

  const items = data.map(({ order_items, ...order }) => ({
    ...order,
    order_number: Number(order.order_number),
    item_count: (order_items ?? []).reduce((sum, item) => sum + item.quantity, 0),
  }))
  const total = count ?? items.length
  return { items, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) }
}

/** Number of orders in each tab (one light "count only" query per status). */
export async function getOrderTabCounts(): Promise<Record<OrderTab, number>> {
  const supabase = await createClient()
  const results = await Promise.all(
    ALL_STATUSES.map((status) =>
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', status),
    ),
  )

  const byStatus = new Map<OrderStatus, number>()
  results.forEach(({ count, error }, index) => {
    if (error) console.error('[admin/orders] count failed', error.message)
    byStatus.set(ALL_STATUSES[index], count ?? 0)
  })

  return Object.fromEntries(
    ORDER_TABS.map((tab) => [tab.value, tab.statuses.reduce((sum, status) => sum + (byStatus.get(status) ?? 0), 0)]),
  ) as Record<OrderTab, number>
}

/** One order with its line items, or null. Cached so generateMetadata and the page share one query. */
export const getAdminOrder = cache(async (id: string): Promise<OrderWithItems | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', id)
    .maybeSingle<OrderWithItems>()

  if (error) console.error('[admin/orders] load failed', error.message)
  if (!data) return null

  return {
    ...data,
    order_number: Number(data.order_number),
    items: [...(data.items ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }
})
