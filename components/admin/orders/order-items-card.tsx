import { Package } from 'lucide-react'
import Image from 'next/image'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney, pluralize } from '@/lib/format'
import type { OrderWithItems } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Line items (a stacked list, so it fits a phone screen) followed by the money breakdown. */
export function OrderItemsCard({ order }: { order: OrderWithItems }) {
  const unitCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const money = (cents: number) => formatMoney(cents, order.currency)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Items</CardTitle>
        <CardDescription>{pluralize(unitCount, 'item')}</CardDescription>
      </CardHeader>

      <ul className="divide-y divide-border">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-4 py-4 first:pt-0">
            <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
              {item.image_url ? (
                <Image src={item.image_url} alt={item.product_name} fill sizes="64px" className="object-cover" />
              ) : (
                <Package className="size-5 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{item.product_name}</p>
              {item.variant_title && <p className="text-sm text-muted-foreground">{item.variant_title}</p>}
              {item.sku && <p className="text-xs text-muted-foreground">SKU {item.sku}</p>}
              <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                {item.quantity} × {money(item.unit_price_cents)}
              </p>
            </div>
            <p className="shrink-0 font-medium tabular-nums">{money(item.total_cents)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-2 grid gap-2 border-t border-border pt-4 text-sm">
        <TotalRow label="Subtotal" value={money(order.subtotal_cents)} />
        {order.discount_cents > 0 && (
          <TotalRow
            label={order.discount_code ? `Discount (${order.discount_code})` : 'Discount'}
            value={`−${money(order.discount_cents)}`}
          />
        )}
        <TotalRow
          label={order.shipping_method ? `Shipping (${order.shipping_method})` : 'Shipping'}
          value={order.shipping_cents > 0 ? money(order.shipping_cents) : 'Free'}
        />
        <TotalRow label="Tax" value={money(order.tax_cents)} />
        <TotalRow label="Total" value={money(order.total_cents)} emphasis />
        {order.refunded_cents > 0 && (
          <>
            <TotalRow label="Refunded" value={`−${money(order.refunded_cents)}`} className="text-destructive" />
            <TotalRow label="Net" value={money(order.total_cents - order.refunded_cents)} emphasis />
          </>
        )}
      </dl>
    </Card>
  )
}

function TotalRow({
  label,
  value,
  emphasis,
  className,
}: {
  label: string
  value: string
  emphasis?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex justify-between gap-4', emphasis && 'text-base font-semibold', className)}>
      <dt className={cn(!emphasis && 'text-muted-foreground')}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}
