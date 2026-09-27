import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { StatusBadge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { ORDER_STATUS } from '@/lib/constants'
import type { RecentOrder } from '@/lib/data/admin/dashboard'
import { formatDate, formatMoney, formatOrderNumber } from '@/lib/format'

const orderHref = (order: RecentOrder) => `/admin/orders/${order.id}`

/** Latest orders: stacked rows on phones, a table from md up. */
export function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  return (
    <section aria-labelledby="recent-orders-heading" className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="recent-orders-heading" className="font-serif text-xl tracking-tight">
          Recent orders
        </h2>
        <Link href="/admin/orders" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          View all <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-input px-6 py-10 text-center text-sm text-muted-foreground">
          No orders yet. New orders will be listed here.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card md:hidden">
            {orders.map((order) => (
              <li key={order.id}>
                <Link href={orderHref(order)} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{formatOrderNumber(order.order_number)}</p>
                    <p className="truncate text-xs text-muted-foreground">{order.email ?? 'No email'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-medium tabular-nums">
                      {formatMoney(order.total_cents, order.currency)}
                    </span>
                    <StatusBadge meta={ORDER_STATUS[order.status]} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <Table>
              <THead>
                <tr>
                  <TH>Order</TH>
                  <TH>Customer</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Total</TH>
                  <TH className="text-right">Date</TH>
                </tr>
              </THead>
              <TBody>
                {orders.map((order) => (
                  <TR key={order.id}>
                    <TD>
                      <Link href={orderHref(order)} className="font-semibold text-clay hover:underline">
                        {formatOrderNumber(order.order_number)}
                      </Link>
                    </TD>
                    <TD className="max-w-56 truncate" title={order.email ?? undefined}>
                      {order.email ?? <span className="text-muted-foreground">No email</span>}
                    </TD>
                    <TD>
                      <StatusBadge meta={ORDER_STATUS[order.status]} />
                    </TD>
                    <TD className="text-right font-medium tabular-nums">
                      {formatMoney(order.total_cents, order.currency)}
                    </TD>
                    <TD className="text-right whitespace-nowrap text-muted-foreground">
                      {formatDate(order.created_at)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </>
      )}
    </section>
  )
}
