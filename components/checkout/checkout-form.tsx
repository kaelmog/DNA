'use client'

import { Loader2, Lock, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

import { placeOrder } from '@/app/(shop)/checkout/actions'
import { CartNotice } from '@/components/cart/cart-notice'
import { clearAppliedDiscount, useAppliedDiscount } from '@/components/cart/use-applied-discount'
import { useCartSync } from '@/components/cart/use-cart-sync'
import { ContactFields, ShippingFields, type ContactDefaults } from '@/components/checkout/checkout-fields'
import { CheckoutSection } from '@/components/checkout/checkout-section'
import { CheckoutSkeleton } from '@/components/checkout/checkout-skeleton'
import { CheckoutSummary } from '@/components/checkout/checkout-summary'
import { PaymentInstructions } from '@/components/checkout/payment-instructions'
import { HoneypotField } from '@/components/forms/honeypot-field'
import { Button, buttonVariants } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Textarea } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/misc'
import { useCart } from '@/hooks/use-cart'
import { cartStore, type CartLine } from '@/lib/cart-store'
import { MAX_ORDER_NOTE_LENGTH } from '@/lib/checkout/rules'
import type {
  AppliedDiscount,
  CartPricingSettings,
  CheckoutCountry,
  ManualOrderInput,
  PlaceOrderState,
} from '@/lib/checkout/types'
import { calculateTotals } from '@/lib/pricing'

const CONNECTION_ERROR = 'Something went wrong. Please check your connection and try again.'
const ERROR_ALERT_ID = 'checkout-error'
const NO_RESULT: PlaceOrderState = {}

interface CheckoutFormProps {
  settings: CartPricingSettings
  /** Countries the store ships to; the first one is preselected. */
  countries: CheckoutCountry[]
  /** Prefilled from the signed-in customer's profile (empty for guests). */
  defaults: ContactDefaults
  signedInEmail: string | null
  /** MANUAL_PAYMENT_INSTRUCTIONS, passed down from the server page. */
  paymentInstructions: string[]
}

/** Everything the server needs, read from the form. Prices are never sent. */
function buildOrderInput(form: FormData, lines: CartLine[], discount: AppliedDiscount | null): ManualOrderInput {
  const text = (name: string) => {
    const value = form.get(name)
    return typeof value === 'string' ? value.trim() : ''
  }
  return {
    lines: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
    discountCode: discount?.code ?? null,
    note: text('note') || null,
    contact: { email: text('email'), fullName: text('fullName'), phone: text('phone') || null },
    shipping: {
      line1: text('line1'),
      line2: text('line2') || null,
      city: text('city'),
      state: text('state') || null,
      postalCode: text('postalCode'),
      country: text('country'),
    },
    website: text('website'),
  }
}

function ContactDescription({ signedInEmail }: { signedInEmail: string | null }) {
  if (signedInEmail) {
    return (
      <p>
        Signed in as <span className="font-medium break-all text-foreground">{signedInEmail}</span>.
      </p>
    )
  }
  return (
    <p>
      Have an account?{' '}
      <Link href="/login?next=/checkout" className="font-medium text-clay underline underline-offset-4">
        Sign in
      </Link>{' '}
      to follow your order from your account.
    </p>
  )
}

/** Shown for the moment between placing the order and the confirmation page loading. */
function PlacingOrder() {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <Loader2 className="size-8 animate-spin text-clay" aria-hidden="true" />
      <p className="font-serif text-xl">Taking you to your order confirmation…</p>
    </div>
  )
}

/**
 * Manual-payment checkout: contact details, shipping address, how payment
 * works and an optional note, beside an order summary. The bag comes from
 * localStorage; prices and stock are refreshed from the server, and
 * `placeOrder` recalculates everything before reserving the pieces.
 */
export function CheckoutForm({ settings, countries, defaults, signedInEmail, paymentInstructions }: CheckoutFormProps) {
  const router = useRouter()
  const { lines, hydrated } = useCart()
  const [discount, setDiscount] = useAppliedDiscount()
  const [result, setResult] = useState<PlaceOrderState>(NO_RESULT)
  const [isPlacing, startPlacing] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const { unavailableIds, notices, dismissNotices, refresh, isSyncing } = useCartSync({
    lines,
    hydrated,
    currency: settings.currency,
    releaseOrderId: null,
  })

  // After a failed attempt, move focus to the first field with an error, or to the message.
  useEffect(() => {
    if (result.ok || !result.message) return
    const invalidField = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    const target = invalidField ?? document.getElementById(ERROR_ALERT_ID)
    target?.focus()
  }, [result])

  if (!hydrated) return <CheckoutSkeleton />

  if (lines.length === 0) {
    // The bag is emptied right before moving to the confirmation page.
    if (isPlacing || result.ok) return <PlacingOrder />
    return (
      <EmptyState
        icon={<ShoppingBag />}
        title="Your bag is empty"
        description="Add a piece you love to your bag, then come back here to check out."
        action={
          <Link href="/shop" className={buttonVariants()}>
            Browse the shop
          </Link>
        }
      />
    )
  }

  const unavailable = new Set(unavailableIds)
  const orderLines = lines.filter((line) => !unavailable.has(line.variantId))
  const subtotalCents = orderLines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
  const totals = calculateTotals(subtotalCents, settings, discount)
  const errors = result.fieldErrors ?? {}

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPlacing) return
    const input = buildOrderInput(new FormData(event.currentTarget), orderLines, discount)

    startPlacing(async () => {
      try {
        const next = await placeOrder(input)
        if (next.ok && next.orderId) {
          cartStore.clear()
          clearAppliedDiscount()
          router.push(`/checkout/success?order=${encodeURIComponent(next.orderId)}`)
        } else {
          if (next.discountRejected) setDiscount(null)
          refresh() // stock or prices may have changed; show the shopper what is different
        }
        setResult(next)
      } catch {
        setResult({ ok: false, message: CONNECTION_ERROR })
      }
    })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start xl:gap-14">
      <CheckoutSummary
        className="lg:col-start-2 lg:row-start-1"
        lines={orderLines}
        unavailableCount={lines.length - orderLines.length}
        totals={totals}
        discount={discount}
        currency={settings.currency}
        onApplyDiscount={setDiscount}
        onRemoveDiscount={() => setDiscount(null)}
      />

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="relative grid min-w-0 gap-10 lg:col-start-1 lg:row-start-1"
        aria-label="Checkout"
      >
        <HoneypotField idPrefix="checkout" />

        {notices.length > 0 && (
          <CartNotice onDismiss={dismissNotices}>
            <p className="font-medium">We updated your bag</p>
            <ul className="mt-1 grid gap-1 text-muted-foreground">
              {notices.map((notice) => (
                <li key={notice}>{notice}</li>
              ))}
            </ul>
          </CartNotice>
        )}

        <CheckoutSection
          id="checkout-contact"
          step={1}
          title="Contact"
          description={<ContactDescription signedInEmail={signedInEmail} />}
        >
          <ContactFields defaults={defaults} errors={errors} />
        </CheckoutSection>

        <CheckoutSection id="checkout-shipping" step={2} title="Shipping address">
          <ShippingFields countries={countries} errors={errors} />
        </CheckoutSection>

        <CheckoutSection
          id="checkout-payment"
          step={3}
          title="Payment"
          description="Nothing is charged when you place your order."
        >
          <PaymentInstructions instructions={paymentInstructions} />
        </CheckoutSection>

        <Field
          id="checkout-note"
          label="Order note (optional)"
          hint="A gift message, delivery details or anything we should know."
          errors={errors.note}
        >
          <Textarea
            id="checkout-note"
            name="note"
            rows={3}
            maxLength={MAX_ORDER_NOTE_LENGTH}
            aria-invalid={Boolean(errors.note?.length) || undefined}
            aria-describedby="checkout-note-description"
          />
        </Field>

        <div className="grid gap-3">
          {result.message && !result.ok && (
            <div id={ERROR_ALERT_ID} tabIndex={-1} className="rounded-2xl outline-none">
              <CartNotice tone="error">{result.message}</CartNotice>
            </div>
          )}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isPlacing || isSyncing || orderLines.length === 0}
            aria-busy={isPlacing}
          >
            {isPlacing ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Lock aria-hidden="true" />}
            {isPlacing ? 'Placing your order…' : 'Place order'}
          </Button>
          <p className="text-center text-xs leading-5 text-muted-foreground">
            By placing your order you agree to our{' '}
            <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
              terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </form>
    </div>
  )
}
