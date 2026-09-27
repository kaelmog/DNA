import { Package, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { StatusBadge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/misc'
import { CUSTOM_REQUEST_STATUS, ORDER_STATUS } from '@/lib/constants'
import type { CustomerOrder, CustomerRequest } from '@/lib/data/admin/customers'
import { formatDate, formatMoney, formatOrderNumber, pluralize } from '@/lib/format'

/** A customer's orders, each linking to the admin order page. */
export function CustomerOrdersCard({ orders }: { orders: CustomerOrder[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>{pluralize(orders.length, 'order')}, including unpaid checkouts</CardDescription>
      </CardHeader>
      {orders.length > 0 ? (
        // A list rather than a table, so it fits a phone screen without sideways scrolling.
        <ul className="divide-y divide-border">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="inline-flex min-h-10 items-center font-semibold text-clay hover:underline"
                >
                  {formatOrderNumber(order.order_number)}
                </Link>
                <span className="ml-3 text-sm text-muted-foreground">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge meta={ORDER_STATUS[order.status]} />
                <span className="font-medium whitespace-nowrap tabular-nums">
                  {formatMoney(order.total_cents, order.currency)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<Package />} title="No orders yet" className="py-10" />
      )}
    </Card>
  )
}

/** Custom requests the customer sent while signed in. */
export function CustomerRequestsCard({ requests, currency }: { requests: CustomerRequest[]; currency: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom requests</CardTitle>
        <CardDescription>{pluralize(requests.length, 'request')}</CardDescription>
      </CardHeader>
      {requests.length > 0 ? (
        <ul className="divide-y divide-border">
          {requests.map((request) => (
            <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <Link
                  href={`/admin/requests?status=${request.status}`}
                  className="font-medium text-clay hover:underline"
                >
                  {request.request_type}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {formatDate(request.created_at)}
                  {request.quoted_price_cents !== null &&
                    ` · Quoted ${formatMoney(request.quoted_price_cents, currency)}`}
                </p>
              </div>
              <StatusBadge meta={CUSTOM_REQUEST_STATUS[request.status]} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<Sparkles />} title="No custom requests" className="py-10" />
      )}
    </Card>
  )
}
