import Link from 'next/link'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney, pluralize } from '@/lib/format'
import type { DashboardData } from '@/lib/types'

/** Top five products by units sold (all time). */
export function Bestsellers({ items, currency }: { items: DashboardData['bestsellers']; currency: string }) {
  return (
    <Card className="min-w-0">
      <CardHeader className="mb-3">
        <div>
          <CardTitle>Bestsellers</CardTitle>
          <CardDescription>Most units sold, all time.</CardDescription>
        </div>
      </CardHeader>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Your top products will show up after the first sales.</p>
      ) : (
        <ol className="grid gap-3">
          {items.map((item, index) => (
            <li key={`${item.product_id ?? 'deleted'}-${item.product_name}`} className="flex items-center gap-3">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-clay"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                {item.product_id ? (
                  <Link
                    href={`/admin/products/${item.product_id}`}
                    className="block truncate text-sm font-medium hover:text-clay hover:underline"
                  >
                    {item.product_name}
                  </Link>
                ) : (
                  // The product was deleted; order history keeps its name.
                  <p className="truncate text-sm font-medium">{item.product_name}</p>
                )}
                <p className="text-xs text-muted-foreground">{pluralize(item.units, 'unit')} sold</p>
              </div>
              <p className="text-sm font-medium tabular-nums">{formatMoney(item.revenue_cents, currency)}</p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
