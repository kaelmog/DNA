import { CircleAlert, CircleDollarSign, Plus, Receipt, ShoppingBag, TrendingUp } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Bestsellers } from '@/components/admin/dashboard/bestsellers'
import { KpiCards, type KpiItem } from '@/components/admin/dashboard/kpi-cards'
import { LowStockList } from '@/components/admin/dashboard/low-stock-list'
import { NeedsAttention } from '@/components/admin/dashboard/needs-attention'
import { RecentOrders } from '@/components/admin/dashboard/recent-orders'
import { RevenueChart } from '@/components/admin/dashboard/revenue-chart'
import { buttonVariants } from '@/components/ui/button'
import { requireAdmin } from '@/lib/auth'
import { getAwaitingPaymentCount, getDashboard, getLowStockVariants, getRecentOrders } from '@/lib/data/admin/dashboard'
import { getStoreSettings } from '@/lib/data/settings'
import { isStripeConfigured } from '@/lib/env.server'
import { formatMoney, pluralize } from '@/lib/format'
import type { DashboardData } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Dashboard',
}

const PERIOD_DAYS = 30

function kpiItems(summary: DashboardData['summary'], currency: string): KpiItem[] {
  return [
    {
      label: 'Total revenue',
      value: formatMoney(summary.revenue_cents, currency),
      hint: 'All time, after refunds',
      icon: CircleDollarSign,
    },
    { label: 'Orders', value: summary.orders.toLocaleString('en-US'), hint: 'All time', icon: ShoppingBag },
    {
      label: 'Average order',
      value: formatMoney(summary.average_order_cents, currency),
      hint: 'Per paid order',
      icon: Receipt,
    },
    {
      label: `Revenue, last ${PERIOD_DAYS} days`,
      value: formatMoney(summary.period_revenue_cents, currency),
      hint: pluralize(summary.period_orders, 'order'),
      icon: TrendingUp,
    },
  ]
}

export default async function AdminDashboardPage() {
  const profile = await requireAdmin()

  const [dashboard, recentOrders, lowStock, settings, awaitingPayment] = await Promise.all([
    getDashboard(PERIOD_DAYS),
    getRecentOrders(6),
    getLowStockVariants(8),
    getStoreSettings(),
    getAwaitingPaymentCount(),
  ])
  const firstName = profile.full_name?.trim().split(/\s+/)[0]
  // Without Stripe every order is paid by hand, so that queue always shows; with Stripe only when something waits.
  const awaitingPaymentRow =
    awaitingPayment !== null && (!isStripeConfigured || awaitingPayment > 0) ? awaitingPayment : undefined

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description={`Welcome back${firstName ? `, ${firstName}` : ''}. Here is how ${settings.store_name} is doing.`}
        actions={
          <>
            <Link href="/admin/products/new" className={buttonVariants({ variant: 'accent' })}>
              <Plus aria-hidden="true" /> New product
            </Link>
            <Link href="/admin/orders" className={buttonVariants({ variant: 'outline' })}>
              View orders
            </Link>
          </>
        }
      />

      <div className="grid gap-6">
        {dashboard ? (
          <>
            <KpiCards items={kpiItems(dashboard.summary, settings.currency)} />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="min-w-0 lg:col-span-2">
                <RevenueChart
                  daily={dashboard.daily}
                  currency={settings.currency}
                  days={PERIOD_DAYS}
                  hasSales={dashboard.summary.orders > 0}
                />
              </div>
              <NeedsAttention counts={dashboard.counts} awaitingPayment={awaitingPaymentRow} />
            </div>
          </>
        ) : (
          <p
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              The sales numbers could not be loaded. Make sure <code>supabase/schema.sql</code> has been run in your
              Supabase project, then reload this page.
            </span>
          </p>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <RecentOrders orders={recentOrders} />
          </div>
          <div className="grid min-w-0 gap-6">
            {dashboard && <Bestsellers items={dashboard.bestsellers} currency={settings.currency} />}
            <LowStockList variants={lowStock} threshold={settings.low_stock_threshold} />
          </div>
        </div>
      </div>
    </>
  )
}
