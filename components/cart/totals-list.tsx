import { cn } from '@/lib/utils'

export interface TotalsRow {
  label: React.ReactNode
  value: React.ReactNode
  /** Highlights savings, e.g. a discount. */
  positive?: boolean
}

/**
 * Money breakdown (subtotal, discount, shipping, total) as a description list.
 * Used by the cart summary and the order confirmation page.
 */
export function TotalsList({
  rows,
  totalLabel,
  totalValue,
  className,
}: {
  rows: TotalsRow[]
  totalLabel: React.ReactNode
  totalValue: React.ReactNode
  className?: string
}) {
  return (
    <dl className={cn('grid gap-3 text-sm', className)}>
      {rows.map((row, index) => (
        <div key={index} className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className={cn('text-right tabular-nums', row.positive && 'text-success')}>{row.value}</dd>
        </div>
      ))}
      <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-border pt-4">
        <dt className="font-semibold">{totalLabel}</dt>
        <dd className="font-serif text-2xl tabular-nums">{totalValue}</dd>
      </div>
    </dl>
  )
}
