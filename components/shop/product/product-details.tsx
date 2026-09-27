import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

import { formatMoney } from '@/lib/format'
import type { StoreSettings } from '@/lib/types'

interface ProductDetailsProps {
  details: string | null
  settings: StoreSettings
}

/** Collapsible "Details & care" and "Shipping & returns" panels (native details/summary, no JavaScript). */
export function ProductDetails({ details, settings }: ProductDetailsProps) {
  return (
    <div className="divide-y divide-border border-y border-border">
      {details && (
        <Disclosure title="Details & care" defaultOpen>
          <p className="whitespace-pre-line wrap-anywhere">{details}</p>
        </Disclosure>
      )}
      <Disclosure title="Shipping & returns">
        <ShippingSummary settings={settings} />
      </Disclosure>
    </div>
  )
}

function Disclosure({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details className="group" open={defaultOpen}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-semibold transition-colors hover:text-clay [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="pb-5 text-sm leading-6 text-muted-foreground">{children}</div>
    </details>
  )
}

/** Country codes ("US") to names ("United States") for the shipping note. */
function countryNames(codes: string[]) {
  const names = new Intl.DisplayNames(['en'], { type: 'region' })
  return codes.map((code) => {
    try {
      return names.of(code) ?? code
    } catch {
      return code // not a valid region code
    }
  })
}

/** One sentence describing the shipping price, driven by the store settings. */
function shippingPriceText({ flat_shipping_cents, free_shipping_threshold_cents, currency }: StoreSettings) {
  if (flat_shipping_cents === 0) return 'Shipping is free on every order.'
  const flat = formatMoney(flat_shipping_cents, currency)
  if (free_shipping_threshold_cents === null) return `Flat-rate shipping of ${flat} per order.`
  return `Free shipping on orders over ${formatMoney(free_shipping_threshold_cents, currency)}; otherwise a flat ${flat}.`
}

function ShippingSummary({ settings }: { settings: StoreSettings }) {
  const countries = countryNames(settings.allowed_shipping_countries)

  return (
    <div className="grid gap-2">
      <p>{shippingPriceText(settings)}</p>
      {countries.length > 0 && (
        <p>We currently ship to {new Intl.ListFormat('en', { type: 'conjunction' }).format(countries)}.</p>
      )}
      <p>Every piece is packed with care, and we email you as soon as it ships.</p>
      <p>
        <Link href="/shipping-returns" className="font-medium text-clay underline-offset-4 hover:underline">
          Read our shipping &amp; returns policy
        </Link>
      </p>
    </div>
  )
}
