import 'server-only'

import { cache } from 'react'

import { ADMIN_PAGE_SIZE } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import type { CustomerSummary, CustomRequest, Order } from '@/lib/types'

/**
 * Customer queries for the admin area, built on the `customer_summaries` view
 * (profiles + lifetime order stats). Callers must run requireAdmin() first.
 */

export type CustomerSort = 'newest' | 'top'

export type CustomerOrder = Pick<Order, 'id' | 'order_number' | 'created_at' | 'status' | 'total_cents' | 'currency'>

export type CustomerRequest = Pick<
  CustomRequest,
  'id' | 'request_type' | 'status' | 'created_at' | 'quoted_price_cents' | 'budget_cents'
>

/**
 * Builds a PostgREST `or` filter value for a "contains" search. The pattern is
 * LIKE-escaped, then double-quoted so commas, dots and brackets typed by the
 * admin cannot break the filter syntax.
 */
function containsFilter(term: string) {
  const likePattern = `%${term.replace(/[\\%_]/g, (match) => `\\${match}`)}%`
  return `"${likePattern.replace(/["\\]/g, (match) => `\\${match}`)}"`
}

/** PostgREST returns counts and sums (bigint) as numbers or strings depending on size. */
function normalizeCustomer(row: CustomerSummary): CustomerSummary {
  return {
    ...row,
    order_count: Number(row.order_count ?? 0),
    total_spent_cents: Number(row.total_spent_cents ?? 0),
  }
}

/** One page of customers. Search matches email or name (contains, case-insensitive). */
export async function getCustomers({
  search,
  sort,
  page,
}: {
  search?: string
  sort: CustomerSort
  page: number
}): Promise<{ items: CustomerSummary[]; total: number; pageCount: number }> {
  const supabase = await createClient()
  const from = (page - 1) * ADMIN_PAGE_SIZE

  let query = supabase.from('customer_summaries').select('*', { count: 'exact' })

  const term = search?.trim()
  if (term) {
    const pattern = containsFilter(term)
    query = query.or(`email.ilike.${pattern},full_name.ilike.${pattern}`)
  }

  query =
    sort === 'top'
      ? query.order('total_spent_cents', { ascending: false }).order('created_at', { ascending: false })
      : query.order('created_at', { ascending: false })

  const { data, count, error } = await query
    .range(from, from + ADMIN_PAGE_SIZE - 1)
    .overrideTypes<CustomerSummary[], { merge: false }>()

  if (error) {
    console.error('[admin/customers] list failed', error.message)
    return { items: [], total: 0, pageCount: 1 }
  }

  const total = count ?? data.length
  return {
    items: data.map(normalizeCustomer),
    total,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  }
}

/** One customer with lifetime stats, or null. Cached so generateMetadata and the page share one query. */
export const getCustomer = cache(async (id: string): Promise<CustomerSummary | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customer_summaries')
    .select('*')
    .eq('id', id)
    .maybeSingle<CustomerSummary>()

  if (error) console.error('[admin/customers] load failed', error.message)
  return data ? normalizeCustomer(data) : null
})

/** The customer's orders, newest first (including unpaid and cancelled ones). */
export async function getCustomerOrders(userId: string): Promise<CustomerOrder[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, created_at, status, total_cents, currency')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
    .overrideTypes<CustomerOrder[], { merge: false }>()

  if (error) {
    console.error('[admin/customers] orders failed', error.message)
    return []
  }
  return data.map((order) => ({ ...order, order_number: Number(order.order_number) }))
}

/** Custom requests the customer sent while signed in, newest first. */
export async function getCustomerRequests(userId: string): Promise<CustomerRequest[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('custom_requests')
    .select('id, request_type, status, created_at, quoted_price_cents, budget_cents')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
    .overrideTypes<CustomerRequest[], { merge: false }>()

  if (error) {
    console.error('[admin/customers] requests failed', error.message)
    return []
  }
  return data
}
