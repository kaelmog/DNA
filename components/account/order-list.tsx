import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { OrderItemImage } from '@/components/account/order-item-image'
import { StatusBadge } from '@/components/ui/badge'
import { ORDER_STATUS } from '@/lib/constants'
import { formatDate, formatMoney, formatOrderNumber, pluralize } from '@/lib/format'
import type { OrderWithItems } from '@/lib/types'

function countItems(order: OrderWithItems) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0)
}

/** Tappable order rows (a list rather than a table so it reads well on phones). */
export function OrderList({ orders }: { orders: OrderWithItems[] }) {
  return (
    <ul className="grid gap-3">
      {orders.map((order) => {
        const firstItem = order.items[0]
        return (
          <li key={order.id}>
            <Link
              href={`/account/orders/${order.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-clay/50 hover:bg-accent/40 sm:gap-4 sm:p-4"
            >
              <OrderItemImage
                src={firstItem?.image_url ?? null}
                alt={firstItem?.product_name ?? ''}
                className="size-14 sm:size-16"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="font-medium">Order {formatOrderNumber(order.order_number)}</p>
                  <StatusBadge meta={ORDER_STATUS[order.status]} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(order.created_at)} · {pluralize(countItems(order), 'item')}
                </p>
              </div>
              <p className="shrink-0 font-medium tabular-nums">{formatMoney(order.total_cents, order.currency)}</p>
              <ChevronRight
                className="hidden size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block"
                aria-hidden="true"
              />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
