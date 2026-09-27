'use client'

import { Trash2 } from 'lucide-react'
import Link from 'next/link'

import { LineThumbnail } from '@/components/cart/line-thumbnail'
import { QuantityStepper } from '@/components/cart/quantity-stepper'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CartLine } from '@/lib/cart-store'
import { lineLabel, lineQuantityLimit } from '@/lib/checkout/reconcile-cart'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

/** One row in the bag: image, name, variant, price, quantity and remove. */
export function CartLineItem({
  line,
  currency,
  unavailable,
  onQuantityChange,
  onRemove,
}: {
  line: CartLine
  currency: string
  /** Missing, unpublished or sold out: shown greyed out and left out of checkout. */
  unavailable: boolean
  onQuantityChange: (variantId: string, quantity: number) => void
  onRemove: (variantId: string) => void
}) {
  const label = lineLabel(line)
  const productHref = `/products/${line.slug}`
  const limit = lineQuantityLimit(line.maxQuantity)
  const atStockLimit = line.maxQuantity !== null && line.quantity >= line.maxQuantity

  return (
    <li className="flex gap-4 py-5 sm:gap-5">
      {/* The image repeats the name link, so it is hidden from keyboard and screen readers. */}
      <Link href={productHref} tabIndex={-1} aria-hidden="true" className={cn(unavailable && 'opacity-50')}>
        <LineThumbnail src={line.imageUrl} alt={line.name} sizes="(min-width: 640px) 96px, 80px" className="w-20 sm:w-24" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className={cn('min-w-0', unavailable && 'text-muted-foreground')}>
            <Link href={productHref} className="line-clamp-2 font-medium leading-snug transition-colors hover:text-clay">
              {line.name}
            </Link>
            {line.variantTitle && <p className="mt-0.5 text-sm text-muted-foreground">{line.variantTitle}</p>}
            <p className="mt-1 text-sm text-muted-foreground">{formatMoney(line.unitPriceCents, currency)} each</p>
          </div>
          {!unavailable && (
            <p className="shrink-0 text-sm font-semibold tabular-nums">
              {formatMoney(line.unitPriceCents * line.quantity, currency)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {unavailable ? (
            <Badge tone="danger">No longer available</Badge>
          ) : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <QuantityStepper
                value={line.quantity}
                max={limit}
                itemLabel={label}
                onChange={(quantity) => onQuantityChange(line.variantId, quantity)}
              />
              {atStockLimit && <span className="text-xs text-muted-foreground">Only {line.maxQuantity} in stock</span>}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-10 text-muted-foreground hover:text-foreground"
            onClick={() => onRemove(line.variantId)}
            aria-label={`Remove ${label} from your bag`}
          >
            <Trash2 aria-hidden="true" />
            Remove
          </Button>
        </div>
      </div>
    </li>
  )
}
