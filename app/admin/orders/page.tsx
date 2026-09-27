import { ShoppingCart } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AwaitingPaymentNotice } from '@/components/admin/orders/awaiting-payment-notice'
import {
  FilterTabs,
  ListSearch,
  listHref,
  readPage,
  readParam,
  type SearchParams,
} from '@/components/admin/orders/list-controls'
import { OrdersTable } from '@/components/admin/orders/orders-table'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/misc'
import { Pagination } from '@/components/ui/pagination'
import { requireAdmin } from '@/lib/auth'
import { getAdminOrders, getOrderTabCounts, ORDER_TABS, parseOrderTab } from '@/lib/data/admin/orders'

export const metadata: Metadata = {
  title: 'Orders',
}

const BASE_PATH = '/admin/orders'

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin()

  const params = await searchParams
  const tab = parseOrderTab(readParam(params.status))
  const query = readParam(params.q)?.trim() || undefined
  const page = readPage(params.page)
  // "all" is the default tab, so it does not need to be in the URL.
  const status = tab === 'all' ? undefined : tab

  const [orders, counts] = await Promise.all([getAdminOrders({ tab, search: query, page }), getOrderTabCounts()])

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description="New orders wait under “Awaiting payment” until they are paid, then appear under “Needs fulfilment” until you mark them as shipped."
      />

      {tab !== 'pending' && (
        <AwaitingPaymentNotice count={counts.pending} href={listHref(BASE_PATH, { status: 'pending' })} />
      )}

      <FilterTabs
        label="Filter orders by status"
        active={tab}
        tabs={ORDER_TABS.map((item) => ({
          value: item.value,
          label: item.label,
          count: counts[item.value],
          highlight: item.value === 'pending' || item.value === 'paid',
          href: listHref(BASE_PATH, { status: item.value === 'all' ? undefined : item.value, q: query }),
        }))}
      />

      <ListSearch
        action={BASE_PATH}
        query={query}
        label="Search orders"
        placeholder="Order number or email"
        keep={{ status }}
      />

      {orders.items.length > 0 ? (
        <OrdersTable orders={orders.items} />
      ) : query ? (
        <EmptyState
          icon={<ShoppingCart />}
          title="No matching orders"
          description={`Nothing in this tab matches “${query}”. Try another tab or search term.`}
          action={
            <Link href={listHref(BASE_PATH, { status })} className={buttonVariants({ variant: 'outline' })}>
              Clear search
            </Link>
          }
        />
      ) : tab === 'pending' ? (
        <EmptyState
          icon={<ShoppingCart />}
          title="Nothing awaiting payment"
          description="Orders paid by bank transfer or another manual method wait here until you mark them as paid."
        />
      ) : (
        <EmptyState
          icon={<ShoppingCart />}
          title="No orders here yet"
          description="Orders show up here as soon as customers check out."
        />
      )}

      <Pagination page={page} pageCount={orders.pageCount} basePath={BASE_PATH} searchParams={{ status, q: query }} />
    </>
  )
}
