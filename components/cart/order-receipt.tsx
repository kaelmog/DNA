import { LineThumbnail } from '@/components/cart/line-thumbnail'
import { TotalsList, type TotalsRow } from '@/components/cart/totals-list'
import { StatusBadge } from '@/components/ui/badge'
import { ORDER_STATUS } from '@/lib/constants'
import { formatMoney, formatOrderNumber } from '@/lib/format'
import type { OrderWithItems } from '@/lib/types'

function receiptRows(order: OrderWithItems): TotalsRow[] {
  const money = (cents: number) => formatMoney(cents, order.currency)
  const rows: TotalsRow[] = [{ label: 'Subtotal', value: money(order.subtotal_cents) }]
  if (order.discount_cents > 0) {
    rows.push({
      label: order.discount_code ? `Discount (${order.discount_code})` : 'Discount',
      value: `−${money(order.discount_cents)}`,
      positive: true,
    })
  }
  rows.push({ label: order.shipping_method ?? 'Shipping', value: order.shipping_cents > 0 ? money(order.shipping_cents) : 'Free' })
  if (order.tax_cents > 0) rows.push({ label: 'Tax', value: money(order.tax_cents) })
  return rows
}

/** Items and totals of a placed order, as stored in the database. */
export function OrderReceipt({ order }: { order: OrderWithItems }) {
  return (
    <section aria-labelledby="order-receipt-heading" className="rounded-3xl border border-border bg-card p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="order-receipt-heading" className="font-serif text-2xl tracking-tight">
          Order {formatOrderNumber(order.order_number)}
        </h2>
        {/* "Awaiting payment" would confuse right after paying; the page explains that state instead. */}
        {order.status !== 'pending' && <StatusBadge meta={ORDER_STATUS[order.status]} />}
      </div>

      <ul className="mt-4 divide-y divide-border border-y border-border">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-4">
            <LineThumbnail src={item.image_url} alt={item.product_name} sizes="64px" className="w-16" />
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-snug">{item.product_name}</p>
              {item.variant_title && <p className="text-sm text-muted-foreground">{item.variant_title}</p>}
              <p className="text-sm text-muted-foreground">Qty {item.quantity}</p>
            </div>
            <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(item.total_cents, order.currency)}</p>
          </li>
        ))}
      </ul>

      <TotalsList
        className="mt-5"
        rows={receiptRows(order)}
        totalLabel="Total"
        totalValue={formatMoney(order.total_cents, order.currency)}
      />
    </section>
  )
}
