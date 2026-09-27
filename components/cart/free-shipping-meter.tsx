import { Truck } from 'lucide-react'

import { formatMoney } from '@/lib/format'
import { amountUntilFreeShipping, type ShippingSettings } from '@/lib/pricing'

/** "Spend $X more for free shipping" with a small progress bar. Hidden when there is no threshold. */
export function FreeShippingMeter({
  discountedSubtotalCents,
  settings,
  currency,
}: {
  discountedSubtotalCents: number
  settings: ShippingSettings
  currency: string
}) {
  const threshold = settings.free_shipping_threshold_cents
  if (threshold === null || threshold <= 0 || discountedSubtotalCents <= 0) return null

  const remaining = amountUntilFreeShipping(discountedSubtotalCents, settings)
  const progress = Math.min(100, Math.round((discountedSubtotalCents / threshold) * 100))

  return (
    <div className="rounded-2xl bg-linen/70 p-4">
      <p className="flex items-center gap-2 text-sm">
        <Truck className="size-4 shrink-0 text-clay" aria-hidden="true" />
        {remaining === null ? (
          <span>You’ve unlocked free shipping.</span>
        ) : (
          <span>
            Spend <strong className="font-semibold">{formatMoney(remaining, currency)}</strong> more for free shipping.
          </span>
        )}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-oat/60" aria-hidden="true">
        <div className="h-full rounded-full bg-clay transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
