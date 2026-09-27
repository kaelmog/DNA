import { ArrowRight, Hourglass } from 'lucide-react'
import Link from 'next/link'

import { pluralize } from '@/lib/format'

/**
 * Reminder shown above the other order tabs while orders are waiting for
 * payment. Manual-payment orders sit there until the owner marks them as
 * paid, so they must not go unnoticed.
 */
export function AwaitingPaymentNotice({ count, href }: { count: number; href: string }) {
  if (count <= 0) return null
  return (
    <div
      className="mb-5 flex flex-col gap-3 rounded-2xl border border-warning/25 bg-warning/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-start gap-2.5 text-foreground">
        <Hourglass className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
        <span>
          <strong className="font-semibold">{pluralize(count, 'order')} awaiting payment.</strong> Mark{' '}
          {count === 1 ? 'it' : 'them'} as paid once the money arrives, or cancel {count === 1 ? 'it' : 'them'} to
          release the reserved stock.
        </span>
      </p>
      <Link
        href={href}
        className="inline-flex min-h-10 shrink-0 items-center gap-1.5 self-start font-semibold text-clay hover:underline sm:self-auto"
      >
        Review {count === 1 ? 'it' : 'them'} <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  )
}
