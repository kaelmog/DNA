import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

interface PriceProps {
  cents: number | null
  /** Original price; shown struck through only when it is higher than `cents`. */
  compareAtCents?: number | null
  currency?: string
  /** Prefix with "From" when a product has several prices. */
  from?: boolean
  className?: string
}

/** A product price, with an optional crossed-out "was" price. Safe in server and client components. */
export function Price({ cents, compareAtCents = null, currency = 'usd', from = false, className }: PriceProps) {
  if (cents === null) {
    return <span className={cn('text-muted-foreground', className)}>Unavailable</span>
  }

  const onSale = compareAtCents !== null && compareAtCents > cents

  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2', className)}>
      <span className={cn(onSale && 'text-clay-dark')}>
        {onSale && <span className="sr-only">Sale price </span>}
        {from && 'From '}
        {formatMoney(cents, currency)}
      </span>
      {onSale && (
        <s className="text-[0.85em] text-muted-foreground">
          <span className="sr-only">Regular price </span>
          {formatMoney(compareAtCents, currency)}
        </s>
      )}
    </span>
  )
}
