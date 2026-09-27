import Link from 'next/link'

import { orderPaymentMethod } from '@/components/admin/orders/payment-method'
import { StatusBadge } from '@/components/ui/badge'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { ORDER_STATUS } from '@/lib/constants'
import type { AdminOrderRow } from '@/lib/data/admin/orders'
import { formatDateTime, formatMoney, formatOrderNumber, pluralize } from '@/lib/format'

/** Under the status of unpaid orders: manual ones need the owner, Stripe ones are unfinished card checkouts. */
function awaitingPaymentHint(order: AdminOrderRow) {
  if (order.status !== 'pending') return null
  return orderPaymentMethod(order) === 'manual' ? 'Manual payment' : 'Card checkout not finished'
}

function OrderStatusCell({ order }: { order: AdminOrderRow }) {
  const hint = awaitingPaymentHint(order)
  return (
    <div className="grid justify-items-start gap-1">
      <StatusBadge meta={ORDER_STATUS[order.status]} />
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}

/** Orders list: stacked cards on phones, a table from the md breakpoint up. */
export function OrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  return (
    <>
      <ul className="grid gap-3 md:hidden">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href={`/admin/orders/${order.id}`}
              className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-clay">{formatOrderNumber(order.order_number)}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">{formatMoney(order.total_cents, order.currency)}</p>
              </div>
              <p className="mt-2 truncate text-sm font-medium">{order.customer_name || 'Guest'}</p>
              {order.email && <p className="truncate text-xs text-muted-foreground">{order.email}</p>}
              <div className="mt-3 flex items-end justify-between gap-3">
                <OrderStatusCell order={order} />
                <span className="text-xs text-muted-foreground">{pluralize(order.item_count, 'item')}</span>
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
              <TH>Date</TH>
              <TH>Customer</TH>
              <TH>Status</TH>
              <TH className="text-right">Items</TH>
              <TH className="text-right">Total</TH>
            </tr>
          </THead>
          <TBody>
            {orders.map((order) => (
              <TR key={order.id}>
                <TD>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="inline-flex min-h-10 items-center font-semibold text-clay hover:underline"
                  >
                    {formatOrderNumber(order.order_number)}
                  </Link>
                </TD>
                <TD className="whitespace-nowrap text-muted-foreground">{formatDateTime(order.created_at)}</TD>
                <TD className="max-w-[16rem]">
                  <p className="truncate font-medium">{order.customer_name || 'Guest'}</p>
                  {order.email && <p className="truncate text-xs text-muted-foreground">{order.email}</p>}
                </TD>
                <TD>
                  <OrderStatusCell order={order} />
                </TD>
                <TD className="text-right tabular-nums">{order.item_count}</TD>
                <TD className="text-right font-medium whitespace-nowrap tabular-nums">
                  {formatMoney(order.total_cents, order.currency)}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  )
}
