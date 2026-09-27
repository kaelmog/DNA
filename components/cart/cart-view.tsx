'use client'

import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'

import { startCheckout } from '@/app/(shop)/checkout/actions'
import { CartLineItem } from '@/components/cart/cart-line-item'
import { CartNotice } from '@/components/cart/cart-notice'
import { CartSkeleton } from '@/components/cart/cart-skeleton'
import { CheckoutButton } from '@/components/cart/checkout-button'
import { DiscountCodeForm } from '@/components/cart/discount-code-form'
import { FreeShippingMeter } from '@/components/cart/free-shipping-meter'
import { TotalsList, type TotalsRow } from '@/components/cart/totals-list'
import { useAppliedDiscount } from '@/components/cart/use-applied-discount'
import { useCartSync } from '@/components/cart/use-cart-sync'
import { buttonVariants } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Textarea } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/misc'
import { useCart } from '@/hooks/use-cart'
import { MAX_ORDER_NOTE_LENGTH } from '@/lib/checkout/rules'
import type { AppliedDiscount, CartPricingSettings, CheckoutMode } from '@/lib/checkout/types'
import { formatMoney, pluralize } from '@/lib/format'
import { calculateTotals, type OrderTotals } from '@/lib/pricing'

const CONNECTION_ERROR = 'Something went wrong. Please check your connection and try again.'

function summaryRows(
  totals: OrderTotals,
  itemCount: number,
  discount: AppliedDiscount | null,
  settings: CartPricingSettings,
  showTaxRow: boolean,
): TotalsRow[] {
  const money = (cents: number) => formatMoney(cents, settings.currency)
  const rows: TotalsRow[] = [{ label: `Subtotal (${pluralize(itemCount, 'item')})`, value: money(totals.subtotalCents) }]
  if (discount && totals.discountCents > 0) {
    rows.push({ label: `Discount (${discount.code})`, value: `−${money(totals.discountCents)}`, positive: true })
  }
  rows.push({ label: 'Shipping', value: totals.shippingCents === 0 ? 'Free' : money(totals.shippingCents) })
  if (showTaxRow) rows.push({ label: 'Taxes', value: 'Calculated at checkout' })
  return rows
}

/** The small print under the checkout button. */
function checkoutHint(mode: CheckoutMode, manualPaymentSummary: string) {
  if (mode === 'stripe') return 'You’ll add your shipping address and pay on Stripe’s secure checkout.'
  if (mode === 'manual') return `${manualPaymentSummary} You’ll add your shipping address on the next step.`
  return 'Checkout opens once the store owner connects the store database (see /todo).'
}

/**
 * The shopping bag. Lines live in localStorage (see lib/cart-store.ts); prices
 * and stock are refreshed from the server, and checkout re-validates
 * everything, so what is shown here is always an estimate.
 */
export function CartView({
  settings,
  checkoutMode,
  manualPaymentSummary,
  releaseOrderId,
}: {
  settings: CartPricingSettings
  /** Decided on the server: Stripe Checkout, manual payment (/checkout) or not available yet. */
  checkoutMode: CheckoutMode
  /** One line about how manual orders are paid (from lib/checkout/manual-payment.ts). */
  manualPaymentSummary: string
  /** Set when the shopper came back from Stripe without paying. */
  releaseOrderId: string | null
}) {
  const { lines, hydrated, setQuantity, remove } = useCart()
  const [discount, setDiscount] = useAppliedDiscount()
  const [note, setNote] = useState('')
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const [isCheckingOut, startCheckoutTransition] = useTransition()
  const { unavailableIds, notices, dismissNotices, refresh, isSyncing } = useCartSync({
    lines,
    hydrated,
    currency: settings.currency,
    releaseOrderId,
  })

  if (!hydrated) return <CartSkeleton />

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag />}
        title="Your bag is empty"
        description="Find a piece you love. Everything is hand-knotted in small batches."
        action={
          <Link href="/shop" className={buttonVariants()}>
            Browse the shop
          </Link>
        }
      />
    )
  }

  const bagQuantity = lines.reduce((sum, line) => sum + line.quantity, 0)
  const unavailable = new Set(unavailableIds)
  const checkoutLines = lines.filter((line) => !unavailable.has(line.variantId))
  const itemCount = checkoutLines.reduce((sum, line) => sum + line.quantity, 0)
  const subtotalCents = checkoutLines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
  const totals = calculateTotals(subtotalCents, settings, discount)
  const isBusy = isCheckingOut || redirecting
  const isStripeMode = checkoutMode === 'stripe'

  /** Stripe mode only: manual mode links straight to /checkout. */
  function handleCheckout() {
    if (!isStripeMode) return
    setCheckoutError(null)
    startCheckoutTransition(async () => {
      try {
        const result = await startCheckout({
          lines: checkoutLines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
          discountCode: discount?.code ?? null,
          note: note.trim() || null,
        })
        if (result.ok) {
          setRedirecting(true)
          window.location.assign(result.url)
          return
        }
        setCheckoutError(result.message)
        if (result.field === 'discountCode') setDiscount(null)
        refresh() // stock or prices may have changed; show the shopper what is different
      } catch {
        setCheckoutError(CONNECTION_ERROR)
      }
    })
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start xl:gap-14">
      <section aria-labelledby="bag-items-heading" className="min-w-0">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <h2 id="bag-items-heading" className="eyebrow">
            {pluralize(bagQuantity, 'item')} in your bag
          </h2>
          <Link href="/shop" className="text-sm font-medium text-clay underline-offset-4 hover:underline">
            Continue shopping
          </Link>
        </div>

        {notices.length > 0 && (
          <CartNotice onDismiss={dismissNotices} className="mt-4">
            <p className="font-medium">We updated your bag</p>
            <ul className="mt-1 grid gap-1 text-muted-foreground">
              {notices.map((notice) => (
                <li key={notice}>{notice}</li>
              ))}
            </ul>
          </CartNotice>
        )}

        <ul className="divide-y divide-border">
          {lines.map((line) => (
            <CartLineItem
              key={line.variantId}
              line={line}
              currency={settings.currency}
              unavailable={unavailable.has(line.variantId)}
              onQuantityChange={setQuantity}
              onRemove={remove}
            />
          ))}
        </ul>
      </section>

      <aside aria-labelledby="order-summary-heading" className="lg:sticky lg:top-28">
        <div className="grid gap-6 rounded-3xl border border-border bg-card p-5 sm:p-7">
          <h2 id="order-summary-heading" className="font-serif text-2xl tracking-tight">
            Order summary
          </h2>

          <FreeShippingMeter
            discountedSubtotalCents={totals.subtotalCents - totals.discountCents}
            settings={settings}
            currency={settings.currency}
          />

          <DiscountCodeForm
            applied={discount}
            subtotalCents={subtotalCents}
            currency={settings.currency}
            onApply={setDiscount}
            onRemove={() => setDiscount(null)}
          />

          <div>
            <TotalsList
              rows={summaryRows(totals, itemCount, discount, settings, isStripeMode && settings.stripe_tax_enabled)}
              totalLabel="Estimated total"
              totalValue={formatMoney(totals.totalCents, settings.currency)}
            />
            {unavailable.size > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">Items that are no longer available are not included.</p>
            )}
          </div>

          {/* Stripe's page has no note field, so the bag collects it. The manual checkout page asks for it itself. */}
          {isStripeMode && (
            <Field id="order-note" label="Order note (optional)" hint="A gift message, delivery details or anything we should know.">
              <Textarea
                id="order-note"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={MAX_ORDER_NOTE_LENGTH}
                aria-describedby="order-note-description"
              />
            </Field>
          )}

          <div className="grid gap-3">
            {checkoutError && <CartNotice tone="error">{checkoutError}</CartNotice>}
            <CheckoutButton
              mode={checkoutMode}
              pending={isBusy}
              disabled={checkoutMode === 'unavailable' || isSyncing || checkoutLines.length === 0}
              onClick={handleCheckout}
            />
            <p className="text-center text-xs leading-5 text-muted-foreground">
              {checkoutHint(checkoutMode, manualPaymentSummary)}
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}
