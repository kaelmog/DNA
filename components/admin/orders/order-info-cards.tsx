import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { MarkPaidButton } from '@/components/admin/orders/mark-paid-button'
import { orderPaymentMethod, PAYMENT_METHOD_LABEL, type PaymentMethod } from '@/components/admin/orders/payment-method'
import { canMarkAsPaid } from '@/components/admin/orders/status-rules'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle } from '@/components/ui/card'
import { formatDateTime, formatMoney, formatOrderNumber } from '@/lib/format'
import type { Order } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Cards on the order page: customer, shipping address, payment (with "Mark as
 * paid" for manual payments), timeline and the customer's checkout note.
 */

export function OrderCustomerCard({ order }: { order: Order }) {
  const isStripe = orderPaymentMethod(order) === 'stripe'
  return (
    <Card>
      <CardTitle className="mb-3">Customer</CardTitle>
      <div className="grid gap-1 text-sm">
        <p className="font-medium">{order.customer_name || 'Name not provided'}</p>
        {order.email ? (
          <a href={`mailto:${order.email}`} className="break-all text-clay hover:underline">
            {order.email}
          </a>
        ) : (
          <p className="text-muted-foreground">
            {isStripe && !order.paid_at ? 'No email yet (added when payment completes)' : 'No email address'}
          </p>
        )}
        {order.phone && (
          <a href={`tel:${order.phone}`} className="text-muted-foreground hover:text-foreground">
            {order.phone}
          </a>
        )}
      </div>
      <p className="mt-4 border-t border-border pt-4 text-sm">
        {order.user_id ? (
          <Link href={`/admin/customers/${order.user_id}`} className="font-medium text-clay hover:underline">
            View customer profile
          </Link>
        ) : (
          <span className="text-muted-foreground">Guest checkout (no account)</span>
        )}
      </p>
    </Card>
  )
}

export function OrderAddressCard({ order }: { order: Order }) {
  const address = order.shipping_address
  const waitingForStripe = orderPaymentMethod(order) === 'stripe' && !order.paid_at
  return (
    <Card>
      <CardTitle className="mb-3">Shipping address</CardTitle>
      {address ? (
        <address className="text-sm leading-6 not-italic">
          {address.name && <span className="block font-medium">{address.name}</span>}
          <span className="block">{address.line1}</span>
          {address.line2 && <span className="block">{address.line2}</span>}
          <span className="block">
            {[address.city, address.state, address.postal_code].filter(Boolean).join(', ')}
          </span>
          <span className="block">{address.country}</span>
        </address>
      ) : (
        <p className="text-sm text-muted-foreground">
          {waitingForStripe
            ? 'No address yet. Stripe adds it when the payment completes.'
            : 'No shipping address was provided. Ask the customer before shipping.'}
        </p>
      )}
    </Card>
  )
}

/** "Awaiting payment", "Paid on …" or "Not paid", from the order's status and paid date. */
function paymentStatusText(order: Order) {
  if (order.paid_at) return `Paid on ${formatDateTime(order.paid_at)}`
  if (order.status === 'pending') return 'Awaiting payment'
  return 'Not paid'
}

/** Short guidance under the payment details, depending on how and whether the order was paid. */
function paymentHelpText(order: Order, method: PaymentMethod) {
  const awaiting = canMarkAsPaid(order.status)
  if (method === 'manual') {
    if (awaiting) {
      return 'When the customer’s payment arrives (bank transfer, cash…), mark the order as paid. They get a confirmation email and the order moves to “Needs fulfilment”.'
    }
    return order.paid_at
      ? 'Paid outside Stripe. To refund it, send the money back the way you received it, then cancel the order.'
      : null
  }
  if (awaiting) {
    return 'The customer started paying by card but has not finished. Unfinished Stripe checkouts are cancelled automatically when they expire. If they paid you another way, you can mark the order as paid.'
  }
  return order.paid_at ? 'Refunds are issued in your Stripe dashboard. They sync back to this order automatically.' : null
}

export function OrderPaymentCard({ order }: { order: Order }) {
  const method = orderPaymentMethod(order)
  const paymentId = order.stripe_payment_intent_id
  const awaiting = canMarkAsPaid(order.status)
  // Manual orders waiting for money are the owner's to-do, so the card stands out.
  const highlight = awaiting && method === 'manual'
  const helpText = paymentHelpText(order, method)

  return (
    <Card className={cn(highlight && 'border-clay/40 bg-linen/50')}>
      <CardTitle className="mb-3">Payment</CardTitle>

      <dl className="grid gap-2 text-sm">
        <PaymentRow label="Method">{PAYMENT_METHOD_LABEL[method]}</PaymentRow>
        <PaymentRow label="Status">
          {awaiting ? <Badge tone="warning">Awaiting payment</Badge> : paymentStatusText(order)}
        </PaymentRow>
        <PaymentRow label={awaiting ? 'Amount due' : 'Total'}>
          <span className="font-semibold tabular-nums">{formatMoney(order.total_cents, order.currency)}</span>
        </PaymentRow>
        {order.refunded_cents > 0 && (
          <PaymentRow label="Refunded">
            <span className="text-destructive tabular-nums">{formatMoney(order.refunded_cents, order.currency)}</span>
          </PaymentRow>
        )}
      </dl>

      {paymentId && (
        <a
          href={`https://dashboard.stripe.com/payments/${encodeURIComponent(paymentId)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium break-all text-clay hover:underline"
        >
          View payment in Stripe
          <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}

      {awaiting && (
        <div className="mt-4">
          <MarkPaidButton
            orderId={order.id}
            orderLabel={formatOrderNumber(order.order_number)}
            email={order.email}
            prominent={method === 'manual'}
          />
        </div>
      )}

      {helpText && <p className="mt-3 text-xs leading-5 text-muted-foreground">{helpText}</p>}
    </Card>
  )
}

function PaymentRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  )
}

export function OrderTimelineCard({ order }: { order: Order }) {
  const shippedDetail = [order.carrier, order.tracking_number].filter(Boolean).join(' · ')
  const events = [
    { label: 'Order placed', at: order.created_at, detail: null },
    { label: 'Payment received', at: order.paid_at, detail: null },
    { label: 'Shipped', at: order.shipped_at, detail: shippedDetail || null },
    { label: 'Delivered', at: order.delivered_at, detail: null },
    { label: 'Cancelled', at: order.cancelled_at, detail: order.cancel_reason },
  ]
    .filter((event): event is { label: string; at: string; detail: string | null } => Boolean(event.at))
    .sort((a, b) => a.at.localeCompare(b.at))

  return (
    <Card>
      <CardTitle className="mb-4">Timeline</CardTitle>
      <ol className="grid gap-4">
        {events.map((event) => (
          <li key={event.label} className="relative flex gap-3">
            <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-clay" aria-hidden="true" />
            <div className="min-w-0 text-sm">
              <p className="font-medium">{event.label}</p>
              <p className="text-muted-foreground">
                <time dateTime={event.at}>{formatDateTime(event.at)}</time>
              </p>
              {event.detail && <p className="mt-0.5 break-words text-muted-foreground">{event.detail}</p>}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}

export function OrderCustomerNoteCard({ note }: { note: string }) {
  return (
    <Card className="bg-linen/60">
      <CardTitle className="mb-2">Note from the customer</CardTitle>
      <p className="text-sm leading-6 whitespace-pre-wrap">{note}</p>
    </Card>
  )
}
