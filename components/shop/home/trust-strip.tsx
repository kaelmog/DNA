import { Leaf, ShieldCheck, Sparkles, Truck, type LucideIcon } from 'lucide-react'

import { Container } from '@/components/ui/misc'
import { formatMoney } from '@/lib/format'
import type { StoreSettings } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TrustPoint {
  icon: LucideIcon
  title: string
  description: string
}

/** Short reassurance band under the hero. The shipping point only appears when a free-shipping threshold is set. */
export function TrustStrip({ settings }: { settings: StoreSettings }) {
  const threshold = settings.free_shipping_threshold_cents

  const points: TrustPoint[] = [
    { icon: Leaf, title: 'Hand-knotted', description: 'Natural cotton and reclaimed wood' },
    ...(threshold !== null
      ? [{ icon: Truck, title: 'Free shipping', description: `On orders over ${formatMoney(threshold, settings.currency)}` }]
      : []),
    { icon: Sparkles, title: 'Small batches', description: 'Made slowly, never mass-produced' },
    { icon: ShieldCheck, title: 'Secure checkout', description: 'Encrypted payments via Stripe' },
  ]

  return (
    <section aria-label="Why shop with us" className="border-y border-border bg-card">
      <Container>
        <ul className={cn('grid grid-cols-2 gap-x-4 gap-y-6 py-7 sm:py-8', points.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
          {points.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linen text-clay-dark">
                <Icon className="size-[18px]" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
