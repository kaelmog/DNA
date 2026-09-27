import { CircleCheckBig, Truck } from 'lucide-react'
import Link from 'next/link'

import { CartNotice } from '@/components/cart/cart-notice'
import { OrderNextSteps } from '@/components/cart/order-next-steps'
import { OrderReceipt } from '@/components/cart/order-receipt'
import { PaymentInstructions } from '@/components/checkout/payment-instructions'
import { buttonVariants } from '@/components/ui/button'
import { countryName } from '@/lib/checkout/countries'
import { formatOrderNumber } from '@/lib/format'
import type { OrderWithItems } from '@/lib/types'

/** Where the parcel goes, without the street: the confirmation link could be shared. */
function ShippingDestination({ order }: { order: OrderWithItems }) {
  const address = order.shipping_address
  if (!address) return null
  const place = [address.city, address.country ? countryName(address.country) : null].filter(Boolean).join(', ')

  return (
    <p className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
      <Truck className="mt-0.5 size-4 shrink-0 text-clay" aria-hidden="true" />
      <span>
        Shipping to <span className="font-medium">{place}</span>
        {order.shipping_method && <span className="text-muted-foreground"> · {order.shipping_method}</span>}
      </span>
    </p>
  )
}

/** Payment instructions while the order waits for payment, otherwise a short note on its state. */
function PaymentStatus({ order, instructions }: { order: OrderWithItems; instructions: string[] }) {
  if (order.status === 'pending') {
    return (
      <section aria-labelledby="how-to-pay-heading" className="grid gap-4 rounded-3xl border border-border bg-card p-5 sm:p-7">
        <h2 id="how-to-pay-heading" className="font-serif text-2xl tracking-tight">
          How to pay
        </h2>
        <PaymentInstructions instructions={instructions} />
      </section>
    )
  }
  if (order.status === 'cancelled' || order.status === 'refunded') {
    return (
      <CartNotice>
        This order has been {order.status}. If that’s unexpected,{' '}
        <Link href="/contact" className="font-medium text-clay underline underline-offset-4">
          get in touch
        </Link>{' '}
        and we’ll sort it out.
      </CartNotice>
    )
  }
  return <CartNotice>We’ve received your payment. Thank you!</CartNotice>
}

/**
 * /checkout/success?order=<id> for manual-payment orders: the order number,
 * items and totals, how to pay, and what happens next. The bag was already
 * emptied in the browser before arriving here.
 */
export function ManualOrderConfirmation({
  order,
  instructions,
  isSignedIn,
}: {
  order: OrderWithItems
  instructions: string[]
  isSignedIn: boolean
}) {
  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CircleCheckBig className="size-7" aria-hidden="true" />
        </div>
        <p className="eyebrow mb-3">Order received</p>
        <h1 className="font-serif text-4xl leading-tight tracking-tight text-balance sm:text-5xl">
          Thank you – we have received your order
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          Your order number is{' '}
          <span className="font-medium text-foreground">{formatOrderNumber(order.order_number)}</span>.
          {order.email && (
            <>
              {' '}
              We’ll be in touch at <span className="font-medium break-all text-foreground">{order.email}</span>.
            </>
          )}
        </p>
      </div>

      <PaymentStatus order={order} instructions={instructions} />
      <OrderReceipt order={order} />
      <ShippingDestination order={order} />
      <OrderNextSteps email={order.email} isSignedIn={isSignedIn} awaitingPayment={order.status === 'pending'} />

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/shop" className={buttonVariants({ size: 'lg' })}>
          Continue shopping
        </Link>
        {isSignedIn && (
          <Link href="/account/orders" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            View your orders
          </Link>
        )}
      </div>
    </div>
  )
}
