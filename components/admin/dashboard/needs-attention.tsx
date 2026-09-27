import {
  Banknote,
  ChevronRight,
  CircleCheck,
  MessageSquareQuote,
  PackageSearch,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardData } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AttentionItem {
  label: string
  count: number
  href: string
  icon: LucideIcon
}

function attentionItems(counts: DashboardData['counts'], awaitingPayment?: number): AttentionItem[] {
  // Manual-payment orders come first: nothing ships until the money arrives.
  const paymentItem: AttentionItem[] =
    awaitingPayment === undefined
      ? []
      : [{ label: 'Orders awaiting payment', count: awaitingPayment, href: '/admin/orders?status=pending', icon: Banknote }]
  return [
    ...paymentItem,
    { label: 'Orders to fulfil', count: counts.orders_to_fulfill, href: '/admin/orders?status=paid', icon: Truck },
    { label: 'Reviews to moderate', count: counts.pending_reviews, href: '/admin/reviews', icon: Star },
    { label: 'New custom requests', count: counts.new_requests, href: '/admin/requests', icon: Sparkles },
    { label: 'New messages', count: counts.new_messages, href: '/admin/messages', icon: MessageSquareQuote },
    {
      label: 'Low-stock variants',
      count: counts.low_stock_variants,
      // The dashboard count covers active products only, so the list opens with the same filter.
      href: '/admin/products?stock=low&status=active',
      icon: PackageSearch,
    },
  ]
}

/**
 * Shortcuts to the queues that need the owner, with a count on each.
 * `awaitingPayment` adds the manual-payment queue; leave it out to hide that row.
 */
export function NeedsAttention({ counts, awaitingPayment }: { counts: DashboardData['counts']; awaitingPayment?: number }) {
  const items = attentionItems(counts, awaitingPayment)
  const allClear = items.every((item) => item.count === 0)

  return (
    <Card className="min-w-0">
      <CardHeader className="mb-3">
        <div>
          <CardTitle>Needs attention</CardTitle>
          <CardDescription>
            {allClear ? (
              <span className="inline-flex items-center gap-1.5 text-success">
                <CircleCheck className="size-4" aria-hidden="true" /> All caught up.
              </span>
            ) : (
              'Work waiting for you.'
            )}
          </CardDescription>
        </div>
      </CardHeader>
      <ul className="-mx-2 grid gap-0.5">
        {items.map(({ label, count, href, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-accent"
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full',
                  count > 0 ? 'bg-clay/10 text-clay' : 'bg-muted text-muted-foreground',
                )}
                aria-hidden="true"
              >
                <Icon className="size-4" />
              </span>
              <span className={cn('min-w-0 flex-1', count === 0 && 'text-muted-foreground')}>{label}</span>
              <span
                className={cn(
                  'min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums',
                  count > 0 ? 'bg-clay text-white' : 'bg-muted text-muted-foreground',
                )}
              >
                {count}
              </span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
