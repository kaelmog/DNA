import { ChevronLeft, MessageCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { OrderItemImage } from '@/components/account/order-item-image'
import { OrderStatusTimeline } from '@/components/account/order-status-timeline'
import { OrderTotals } from '@/components/account/order-totals'
import { OrderTracking } from '@/components/account/order-tracking'
import { ShippingAddress } from '@/components/account/shipping-address'
import { PaymentInstructions } from '@/components/checkout/payment-instructions'
import { StatusBadge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { requireUser } from '@/lib/auth'
import { MANUAL_PAYMENT_INSTRUCTIONS } from '@/lib/checkout/manual-payment'
import { ORDER_STATUS } from '@/lib/constants'
import { getMyOrder } from '@/lib/data/account'
import { formatDateTime, formatMoney, formatOrderNumber, pluralize } from '@/lib/format'
import type { OrderItem } from '@/lib/types'
import { uuidField } from '@/lib/validation'

export const metadata: Metadata = {
  title: 'Order details',
  robots: { index: false, follow: false },
}

/** Section headings sit under the page's "Order #…" h2. */
const sectionTitleClass = 'mb-4 font-serif text-xl tracking-tight'

export default async function AccountOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!uuidField.safeParse(id).success) notFound()

  await requireUser(`/account/orders/${id}`)
  // Row Level Security plus a user_id filter: customers only ever see their own orders.
  const order = await getMyOrder(id)
  if (!order) notFound()

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const hasTracking = Boolean(order.carrier || order.tracking_number || order.tracking_url)
  // Manual-payment orders (no Stripe session) are paid outside the site, so repeat how to pay.
  const awaitingManualPayment = order.status === 'pending' && !order.stripe_checkout_session_id

  return (
    <div className="grid gap-6">
      <div>
        <Link
          href="/account/orders"
          className="inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          All orders
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="font-serif text-2xl tracking-tight sm:text-3xl">Order {formatOrderNumber(order.order_number)}</h2>
          <StatusBadge meta={ORDER_STATUS[order.status]} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Placed on {formatDateTime(order.created_at)}</p>
      </div>

      <Card>
        <h3 className="sr-only">Order progress</h3>
        <OrderStatusTimeline order={order} />
        {awaitingManualPayment && (
          <PaymentInstructions instructions={MANUAL_PAYMENT_INSTRUCTIONS} className="mt-4" />
        )}
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <h3 className={sectionTitleClass}>Items ({pluralize(itemCount, 'piece')})</h3>
          <ul className="divide-y divide-border">
            {order.items.map((item) => (
              <OrderItemRow key={item.id} item={item} currency={order.currency} />
            ))}
          </ul>
        </Card>

        <div className="grid gap-6">
          <Card>
            <h3 className={sectionTitleClass}>Summary</h3>
            <OrderTotals order={order} />
          </Card>

          {order.shipping_address && (
            <Card>
              <h3 className={sectionTitleClass}>Shipping to</h3>
              <ShippingAddress address={order.shipping_address} />
              {order.shipping_method && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Method: <span className="text-foreground">{order.shipping_method}</span>
                </p>
              )}
            </Card>
          )}

          {hasTracking && (
            <Card>
              <h3 className={sectionTitleClass}>Tracking</h3>
              <OrderTracking order={order} />
            </Card>
          )}

          {order.customer_note && (
            <Card>
              <h3 className={sectionTitleClass}>Your note</h3>
              <p className="text-sm leading-6 break-words whitespace-pre-line text-muted-foreground">{order.customer_note}</p>
            </Card>
          )}

          <Card className="bg-linen/60">
            <h3 className={sectionTitleClass}>Need a hand?</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Questions about delivery, returns or anything else? Get in touch and mention order{' '}
              {formatOrderNumber(order.order_number)}.
            </p>
            <Link href="/contact" className={buttonVariants({ variant: 'outline', className: 'mt-4 w-full' })}>
              <MessageCircle aria-hidden="true" />
              Contact us
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}

function OrderItemRow({ item, currency }: { item: OrderItem; currency: string }) {
  // Products without options have a single variant called "Default"; there is nothing useful to show.
  const variant = item.variant_title && item.variant_title !== 'Default' ? item.variant_title : null

  return (
    <li className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <OrderItemImage src={item.image_url} alt={item.product_name} className="size-16 sm:size-20" sizes="80px" />
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="font-medium break-words">{item.product_name}</p>
          {variant && <p className="text-sm text-muted-foreground">{variant}</p>}
          <p className="text-sm text-muted-foreground">
            {item.quantity} × {formatMoney(item.unit_price_cents, currency)}
          </p>
        </div>
        <p className="font-medium tabular-nums sm:text-right">{formatMoney(item.total_cents, currency)}</p>
      </div>
    </li>
  )
}
