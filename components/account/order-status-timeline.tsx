import { Check, CircleX, Clock, RotateCcw, type LucideIcon } from 'lucide-react'

import { formatDate, formatMoney } from '@/lib/format'
import type { Order, OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

type TimelineOrder = Pick<
  Order,
  | 'status'
  | 'paid_at'
  | 'shipped_at'
  | 'delivered_at'
  | 'cancelled_at'
  | 'cancel_reason'
  | 'refunded_cents'
  | 'currency'
  | 'stripe_checkout_session_id'
>

type StepDateKey = 'paid_at' | 'shipped_at' | 'delivered_at'

/** A paid order's journey. `dateKey` is the timestamp the database sets when the order reaches that step. */
const FULFILMENT_STEPS: { status: OrderStatus; label: string; dateKey: StepDateKey | null }[] = [
  { status: 'paid', label: 'Paid', dateKey: 'paid_at' },
  { status: 'processing', label: 'Processing', dateKey: null },
  { status: 'shipped', label: 'Shipped', dateKey: 'shipped_at' },
  { status: 'delivered', label: 'Delivered', dateKey: 'delivered_at' },
]

/** Progress of an order: a four-step tracker, or a clear panel for pending, cancelled and refunded orders. */
export function OrderStatusTimeline({ order }: { order: TimelineOrder }) {
  if (order.status === 'pending') {
    // No Stripe session means the order was placed in manual-payment mode and is paid outside the website.
    const isManual = !order.stripe_checkout_session_id
    return (
      <StatusPanel icon={Clock} tone="neutral" title="Awaiting payment">
        {isManual
          ? 'Your pieces are reserved. We will send payment details to your email and start on your order once payment arrives.'
          : 'We have not received payment for this order yet. If you just completed checkout, it can take a minute to update.'}
      </StatusPanel>
    )
  }

  if (order.status === 'cancelled') {
    return (
      <StatusPanel icon={CircleX} tone="danger" title="Order cancelled">
        {order.cancelled_at ? `This order was cancelled on ${formatDate(order.cancelled_at)}.` : 'This order was cancelled.'}
        {order.cancel_reason && <span className="mt-1 block">Reason: {order.cancel_reason}</span>}
      </StatusPanel>
    )
  }

  if (order.status === 'refunded') {
    return (
      <StatusPanel icon={RotateCcw} tone="danger" title="Order refunded">
        {order.refunded_cents > 0
          ? `${formatMoney(order.refunded_cents, order.currency)} was refunded to your original payment method.`
          : 'This order was refunded to your original payment method.'}{' '}
        Refunds usually appear within 5 to 10 business days.
      </StatusPanel>
    )
  }

  const currentIndex = FULFILMENT_STEPS.findIndex((step) => step.status === order.status)

  return (
    <ol className="grid gap-4 sm:grid-cols-4 sm:gap-2">
      {FULFILMENT_STEPS.map((step, index) => {
        const reached = index <= currentIndex
        const date = step.dateKey ? order[step.dateKey] : null
        const isLast = index === FULFILMENT_STEPS.length - 1
        return (
          <li
            key={step.status}
            aria-current={index === currentIndex ? 'step' : undefined}
            className="flex items-center gap-3 sm:flex-col sm:items-stretch sm:gap-2"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  reached ? 'border-clay bg-clay text-white' : 'border-input bg-card text-muted-foreground',
                )}
              >
                {reached ? <Check className="size-4" aria-hidden="true" /> : index + 1}
              </span>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn('hidden h-0.5 flex-1 rounded-full sm:block', index < currentIndex ? 'bg-clay' : 'bg-border')}
                />
              )}
            </div>
            <div>
              <p className={cn('text-sm font-medium', !reached && 'text-muted-foreground')}>
                {step.label}
                <span className="sr-only">{reached ? ' (done)' : ' (not yet)'}</span>
              </p>
              {reached && date && <p className="text-xs text-muted-foreground">{formatDate(date)}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

const panelTones = {
  neutral: 'bg-muted text-foreground',
  danger: 'bg-destructive/10 text-destructive',
} as const

function StatusPanel({
  icon: Icon,
  tone,
  title,
  children,
}: {
  icon: LucideIcon
  tone: keyof typeof panelTones
  title: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex items-start gap-3 rounded-2xl p-4', panelTones[tone])}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="text-sm leading-6">
        <p className="font-semibold">{title}</p>
        <p className="opacity-90">{children}</p>
      </div>
    </div>
  )
}
