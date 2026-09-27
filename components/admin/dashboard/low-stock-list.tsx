import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { LowStockVariant } from '@/lib/data/admin/dashboard'

/** Variants that are nearly or completely sold out, linking to the product editor to restock. */
export function LowStockList({ variants, threshold }: { variants: LowStockVariant[]; threshold: number }) {
  return (
    <Card className="min-w-0">
      <CardHeader className="mb-3">
        <div>
          <CardTitle>Low stock</CardTitle>
          <CardDescription>Active variants with {threshold} or fewer left.</CardDescription>
        </div>
      </CardHeader>

      {variants.length === 0 ? (
        <p className="text-sm text-muted-foreground">Everything is well stocked.</p>
      ) : (
        <ul className="-mx-2 grid gap-0.5">
          {variants.map((variant) => (
            <li key={variant.id}>
              <Link
                href={`/admin/products/${variant.product_id}`}
                className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-accent"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{variant.product_name}</p>
                  {(variant.title !== 'Default' || variant.sku) && (
                    <p className="truncate text-xs text-muted-foreground">
                      {[variant.title !== 'Default' ? variant.title : null, variant.sku].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                {variant.inventory_quantity === 0 ? (
                  <Badge tone="danger">Sold out</Badge>
                ) : (
                  <Badge tone="warning">{variant.inventory_quantity} left</Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
