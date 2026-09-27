import { formatMoney } from '@/lib/format'
import type { Order } from '@/lib/types'
import { cn } from '@/lib/utils'

type TotalsOrder = Pick<
  Order,
  'currency' | 'subtotal_cents' | 'discount_cents' | 'discount_code' | 'shipping_cents' | 'tax_cents' | 'total_cents' | 'refunded_cents'
>

/** Price breakdown of an order, using the amounts stored when it was placed. */
export function OrderTotals({ order }: { order: TotalsOrder }) {
  const money = (cents: number) => formatMoney(cents, order.currency)

  return (
    <dl className="grid gap-2.5 text-sm">
      <TotalRow label="Subtotal" value={money(order.subtotal_cents)} />
      {order.discount_cents > 0 && (
        <TotalRow
          label={order.discount_code ? `Discount (${order.discount_code})` : 'Discount'}
          value={`−${money(order.discount_cents)}`}
          className="text-success"
        />
      )}
      <TotalRow label="Shipping" value={order.shipping_cents > 0 ? money(order.shipping_cents) : 'Free'} />
      {order.tax_cents > 0 && <TotalRow label="Tax" value={money(order.tax_cents)} />}
      <TotalRow
        label="Total"
        value={money(order.total_cents)}
        className="mt-1 border-t border-border pt-3 text-base font-semibold text-foreground"
      />
      {order.refunded_cents > 0 && (
        <TotalRow label="Refunded" value={`−${money(order.refunded_cents)}`} className="text-destructive" />
      )}
    </dl>
  )
}

function TotalRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4 text-muted-foreground', className)}>
      <dt>{label}</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </div>
  )
}
