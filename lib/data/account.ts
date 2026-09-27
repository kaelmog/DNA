import 'server-only'

import { cache } from 'react'

import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { OrderItem, OrderWithItems } from '@/lib/types'
import { uuidField } from '@/lib/validation'

/**
 * The signed-in customer's own orders. Queries run as the customer (RLS on),
 * and also filter by user_id explicitly: RLS lets admins read every order, and
 * an admin's personal account page should still only list their own.
 * Everything returns empty results in demo mode or when signed out.
 */

export const ACCOUNT_ORDERS_PAGE_SIZE = 10

const ORDER_WITH_ITEMS = '*, items:order_items(*)'

type OrderRow = Omit<OrderWithItems, 'items'> & { items: OrderItem[] | null }

export interface AccountOrdersPage {
  orders: OrderWithItems[]
  total: number
  page: number
  pageCount: number
}

function normalizeOrder(row: OrderRow): OrderWithItems {
  return {
    ...row,
    order_number: Number(row.order_number), // bigint column
    items: [...(row.items ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }
}

/**
 * A page of the customer's orders, newest first. Pending orders with a Stripe
 * session are abandoned or unfinished card checkouts, so they are left out.
 * Pending orders without one were placed in manual-payment mode and are real
 * orders awaiting payment, so the customer must see them.
 */
export async function getMyOrders({
  page = 1,
  pageSize = ACCOUNT_ORDERS_PAGE_SIZE,
}: { page?: number; pageSize?: number } = {}): Promise<AccountOrdersPage> {
  const empty: AccountOrdersPage = { orders: [], total: 0, page, pageCount: 1 }
  const user = await getCurrentUser()
  if (!user) return empty

  const from = (Math.max(1, page) - 1) * pageSize
  const supabase = await createClient()
  const { data, count, error } = await supabase
    .from('orders')
    .select(ORDER_WITH_ITEMS, { count: 'exact' })
    .eq('user_id', user.id)
    .or('status.neq.pending,stripe_checkout_session_id.is.null')
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)
    .overrideTypes<OrderRow[], { merge: false }>()

  if (error) {
    // PGRST103: the requested page is past the end (e.g. a hand-edited ?page=). Not worth logging.
    if (error.code !== 'PGRST103') console.error('[account] could not load orders', error.message)
    return empty
  }

  const total = count ?? data.length
  return {
    orders: data.map(normalizeOrder),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  }
}

/** One of the customer's orders with its line items, or null. Cached per request. */
export const getMyOrder = cache(async (id: string): Promise<OrderWithItems | null> => {
  if (!uuidField.safeParse(id).success) return null
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_WITH_ITEMS)
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle<OrderRow>()

  if (error) {
    console.error('[account] could not load order', error.message)
    return null
  }
  return data ? normalizeOrder(data) : null
})
