import { ExternalLink } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import type { Order } from '@/lib/types'

/** Only plain web links are rendered, so a mistyped or malicious tracking URL can never run script. */
function safeTrackingUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

/** Carrier, tracking number and a link to the carrier's tracking page when the store added one. */
export function OrderTracking({ order }: { order: Pick<Order, 'carrier' | 'tracking_number' | 'tracking_url'> }) {
  const trackingUrl = safeTrackingUrl(order.tracking_url)

  return (
    <div className="grid gap-3 text-sm">
      <dl className="grid gap-1.5">
        {order.carrier && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Carrier</dt>
            <dd className="text-right font-medium">{order.carrier}</dd>
          </div>
        )}
        {order.tracking_number && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Tracking number</dt>
            <dd className="text-right font-medium break-all">{order.tracking_number}</dd>
          </div>
        )}
      </dl>
      {trackingUrl && (
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: 'outline', className: 'w-full' })}
        >
          Track your parcel <ExternalLink aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    </div>
  )
}
