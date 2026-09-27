import { Package } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { OrderList } from '@/components/account/order-list'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/misc'
import { Pagination } from '@/components/ui/pagination'
import { requireUser } from '@/lib/auth'
import { getMyOrders } from '@/lib/data/account'
import { pluralize } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Order history',
  robots: { index: false, follow: false },
}

export default async function AccountOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireUser('/account/orders')
  const params = await searchParams
  const page = Math.max(1, Math.floor(Number(params.page)) || 1)
  const { orders, total, pageCount } = await getMyOrders({ page })

  // A page number past the end (old bookmark, edited URL): start again from the first page.
  if (page > 1 && orders.length === 0) redirect('/account/orders')

  return (
    <section aria-labelledby="orders-heading">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <h2 id="orders-heading" className="font-serif text-2xl tracking-tight sm:text-3xl">
          Order history
        </h2>
        {total > 0 && <p className="text-sm text-muted-foreground">{pluralize(total, 'order')}</p>}
      </div>

      {orders.length > 0 ? (
        <>
          <OrderList orders={orders} />
          <Pagination page={page} pageCount={pageCount} basePath="/account/orders" />
        </>
      ) : (
        <EmptyState
          icon={<Package />}
          title="No orders yet"
          description="When you place an order it will appear here, with updates as it ships."
          action={
            <Link href="/shop" className={buttonVariants()}>
              Browse the shop
            </Link>
          }
        />
      )}
    </section>
  )
}
