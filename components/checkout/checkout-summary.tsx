'use client'

import { ChevronDown, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { DiscountCodeForm } from '@/components/cart/discount-code-form'
import { LineThumbnail } from '@/components/cart/line-thumbnail'
import { TotalsList, type TotalsRow } from '@/components/cart/totals-list'
import type { CartLine } from '@/lib/cart-store'
import type { AppliedDiscount } from '@/lib/checkout/types'
import { formatMoney, pluralize } from '@/lib/format'
import type { OrderTotals } from '@/lib/pricing'
import { cn } from '@/lib/utils'

const PANEL_ID = 'checkout-summary-panel'

function summaryRows(totals: OrderTotals, itemCount: number, discount: AppliedDiscount | null, currency: string): TotalsRow[] {
  const money = (cents: number) => formatMoney(cents, currency)
  const rows: TotalsRow[] = [{ label: `Subtotal (${pluralize(itemCount, 'item')})`, value: money(totals.subtotalCents) }]
  if (discount && totals.discountCents > 0) {
    rows.push({ label: `Discount (${discount.code})`, value: `−${money(totals.discountCents)}`, positive: true })
  }
  rows.push({ label: 'Shipping', value: totals.shippingCents === 0 ? 'Free' : money(totals.shippingCents) })
  return rows
}

function SummaryLine({ line, currency }: { line: CartLine; currency: string }) {
  return (
    <li className="flex items-center gap-3 py-3">
      {/* The name is right next to it, so the picture is decorative. */}
      <LineThumbnail src={line.imageUrl} alt="" sizes="56px" className="w-14" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{line.name}</p>
        {line.variantTitle && <p className="text-xs text-muted-foreground">{line.variantTitle}</p>}
        <p className="text-xs text-muted-foreground">Qty {line.quantity}</p>
      </div>
      <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(line.unitPriceCents * line.quantity, currency)}</p>
    </li>
  )
}

/**
 * Order summary on /checkout: on large screens a sticky card beside the form,
 * on phones a collapsed bar at the top ("Show order summary" + total).
 * Amounts are an estimate; the server recalculates everything when the order is placed.
 */
export function CheckoutSummary({
  lines,
  unavailableCount,
  totals,
  discount,
  currency,
  onApplyDiscount,
  onRemoveDiscount,
  className,
}: {
  /** Lines that will be ordered (unavailable ones already removed). */
  lines: CartLine[]
  unavailableCount: number
  totals: OrderTotals
  discount: AppliedDiscount | null
  currency: string
  onApplyDiscount: (discount: AppliedDiscount) => void
  onRemoveDiscount: () => void
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)
  const total = formatMoney(totals.totalCents, currency)

  return (
    <aside aria-labelledby="checkout-summary-heading" className={cn('min-w-0 lg:sticky lg:top-28', className)}>
      <div className="rounded-3xl border border-border bg-card">
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls={PANEL_ID}
          className="flex min-h-14 w-full items-center justify-between gap-3 rounded-3xl px-5 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/40 lg:hidden"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-clay">
            <ShoppingBag className="size-4 shrink-0" aria-hidden="true" />
            {expanded ? 'Hide order summary' : 'Show order summary'}
            <ChevronDown className={cn('size-4 shrink-0 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
          </span>
          <span className="font-serif text-xl tabular-nums">{total}</span>
        </button>

        <div
          id={PANEL_ID}
          className={cn(
            'gap-6 border-t border-border p-5 sm:p-7 lg:grid lg:border-t-0',
            expanded ? 'grid' : 'hidden',
          )}
        >
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="checkout-summary-heading" className="font-serif text-2xl tracking-tight">
              Order summary
            </h2>
            <Link
              href="/cart"
              className="-my-2 inline-flex min-h-10 items-center text-sm font-medium text-clay underline-offset-4 hover:underline"
            >
              Edit bag
            </Link>
          </div>

          <ul className="-my-3 divide-y divide-border">
            {lines.map((line) => (
              <SummaryLine key={line.variantId} line={line} currency={currency} />
            ))}
          </ul>

          {unavailableCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {pluralize(unavailableCount, 'item')} in your bag {unavailableCount === 1 ? 'is' : 'are'} no longer
              available and won’t be ordered.
            </p>
          )}

          <DiscountCodeForm
            applied={discount}
            subtotalCents={totals.subtotalCents}
            currency={currency}
            onApply={onApplyDiscount}
            onRemove={onRemoveDiscount}
          />

          <TotalsList rows={summaryRows(totals, itemCount, discount, currency)} totalLabel="Total" totalValue={total} />
        </div>
      </div>
    </aside>
  )
}
