import 'server-only'

import { getStoreSettings } from '@/lib/data/settings'
import { isSupabaseConfigured } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import type { DashboardData, Order, ProductVariant } from '@/lib/types'

/**
 * Numbers for the admin dashboard. They run as the signed-in admin; callers
 * must call requireAdmin() first.
 */

export type RecentOrder = Pick<
  Order,
  'id' | 'order_number' | 'email' | 'customer_name' | 'status' | 'currency' | 'total_cents' | 'created_at'
>

export interface LowStockVariant extends Pick<ProductVariant, 'id' | 'title' | 'sku' | 'inventory_quantity'> {
  product_id: string
  product_name: string
}

/** Postgres bigint/numeric values can arrive as strings; everything here is a whole number. */
function toNumber(value: unknown) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

type RawDashboard = {
  summary?: Record<keyof DashboardData['summary'], unknown>
  daily?: { day: string; revenue_cents: unknown; orders: unknown }[]
  bestsellers?: { product_id: string | null; product_name: string; units: unknown; revenue_cents: unknown }[]
  counts?: Record<keyof DashboardData['counts'], unknown>
}

function normalizeDashboard(raw: RawDashboard): DashboardData {
  const summary = raw.summary
  const counts = raw.counts
  return {
    summary: {
      revenue_cents: toNumber(summary?.revenue_cents),
      orders: toNumber(summary?.orders),
      average_order_cents: toNumber(summary?.average_order_cents),
      period_revenue_cents: toNumber(summary?.period_revenue_cents),
      period_orders: toNumber(summary?.period_orders),
    },
    daily: (raw.daily ?? []).map((day) => ({
      day: day.day,
      revenue_cents: toNumber(day.revenue_cents),
      orders: toNumber(day.orders),
    })),
    bestsellers: (raw.bestsellers ?? []).map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      units: toNumber(item.units),
      revenue_cents: toNumber(item.revenue_cents),
    })),
    counts: {
      orders_to_fulfill: toNumber(counts?.orders_to_fulfill),
      pending_reviews: toNumber(counts?.pending_reviews),
      new_requests: toNumber(counts?.new_requests),
      new_messages: toNumber(counts?.new_messages),
      low_stock_variants: toNumber(counts?.low_stock_variants),
    },
  }
}

/**
 * Revenue, order counts, bestsellers and "needs attention" counts from the
 * admin_dashboard(p_days) database function. Returns null when the numbers
 * cannot be loaded, so the page can say so instead of showing false zeros.
 */
export async function getDashboard(days = 30): Promise<DashboardData | null> {
  if (!isSupabaseConfigured) return null

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_dashboard', { p_days: days })
  if (error || !data) {
    console.error('[dashboard] admin_dashboard failed', error?.message ?? 'empty response')
    return null
  }
  return normalizeDashboard(data as RawDashboard)
}

/**
 * The latest real orders. Pending orders without a Stripe session were placed
 * with manual payment and are kept; pending orders with a session are
 * abandoned Stripe checkouts and are left out.
 */
export async function getRecentOrders(limit = 6): Promise<RecentOrder[]> {
  if (!isSupabaseConfigured) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, email, customer_name, status, currency, total_cents, created_at')
    .or('status.neq.pending,stripe_checkout_session_id.is.null')
    .order('created_at', { ascending: false })
    .limit(limit)
    .overrideTypes<RecentOrder[], { merge: false }>()

  if (error) {
    console.error('[dashboard] recent orders failed', error.message)
    return []
  }
  return data.map((order) => ({ ...order, order_number: toNumber(order.order_number) }))
}

/**
 * Manual-payment orders still waiting for the money (pending, no Stripe
 * session), for the "Needs attention" list. Null when it cannot be counted.
 */
export async function getAwaitingPaymentCount(): Promise<number | null> {
  if (!isSupabaseConfigured) return null

  const supabase = await createClient()
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .is('stripe_checkout_session_id', null)

  if (error) {
    console.error('[dashboard] awaiting-payment count failed', error.message)
    return null
  }
  return count ?? 0
}

type LowStockRow = Pick<ProductVariant, 'id' | 'title' | 'sku' | 'inventory_quantity'> & {
  products: { id: string; name: string } | null
}

/**
 * Active, stock-tracked variants of active products at or below the store's
 * low-stock threshold, emptiest first. Matches the dashboard's low-stock count.
 */
export async function getLowStockVariants(limit = 8): Promise<LowStockVariant[]> {
  if (!isSupabaseConfigured) return []

  const [{ low_stock_threshold }, supabase] = await Promise.all([getStoreSettings(), createClient()])
  const { data, error } = await supabase
    .from('product_variants')
    .select('id, title, sku, inventory_quantity, products!inner(id, name)')
    .eq('track_inventory', true)
    .eq('is_active', true)
    .eq('products.status', 'active')
    .lte('inventory_quantity', low_stock_threshold)
    .order('inventory_quantity', { ascending: true })
    .limit(limit)
    .overrideTypes<LowStockRow[], { merge: false }>()

  if (error) {
    console.error('[dashboard] low-stock variants failed', error.message)
    return []
  }
  return data.flatMap(({ products, ...variant }) =>
    products ? [{ ...variant, product_id: products.id, product_name: products.name }] : [],
  )
}
