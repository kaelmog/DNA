import { CircleCheckBig, CreditCard, Hourglass, Mail, SearchX, Store } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { CartNotice } from '@/components/cart/cart-notice'
import { CheckoutStatus } from '@/components/cart/checkout-status'
import { ClearCartOnMount } from '@/components/cart/clear-cart-on-mount'
import { OrderNextSteps } from '@/components/cart/order-next-steps'
import { OrderReceipt } from '@/components/cart/order-receipt'
import { ManualOrderConfirmation } from '@/components/checkout/manual-order-confirmation'
import { buttonVariants } from '@/components/ui/button'
import { Container } from '@/components/ui/misc'
import { getCurrentUser } from '@/lib/auth'
import { getCheckoutOutcome, type CheckoutOutcome } from '@/lib/checkout/checkout-outcome'
import { getManualOrderConfirmation } from '@/lib/checkout/manual-confirmation'
import { MANUAL_PAYMENT_INSTRUCTIONS } from '@/lib/checkout/manual-payment'
import { isCheckoutSessionId } from '@/lib/checkout/schemas'
import { formatOrderNumber } from '@/lib/format'
import { uuidField } from '@/lib/validation'

export const metadata: Metadata = {
  title: 'Order confirmation',
  robots: { index: false, follow: false },
}

type CompleteOutcome = Extract<CheckoutOutcome, { state: 'complete' }>

/** Explains a confirmation that is not final yet. Returns null when everything is settled. */
function PaymentStateNotice({ outcome }: { outcome: CompleteOutcome }) {
  if (outcome.payment === 'processing') {
    return (
      <CartNotice>
        Your payment is still processing. This can take a few days for bank payments. We’ll email you as soon as it
        clears.
      </CartNotice>
    )
  }
  if (!outcome.order || outcome.order.status === 'pending') {
    return (
      <CartNotice>
        Payment received. We’re confirming your order now, which usually takes a few seconds. Refresh this page to see
        the update.
      </CartNotice>
    )
  }
  return null
}

async function OrderConfirmation({ outcome }: { outcome: CompleteOutcome }) {
  const user = await getCurrentUser()
  const { order, email } = outcome

  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <ClearCartOnMount />

      <div className="text-center">
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CircleCheckBig className="size-7" aria-hidden="true" />
        </div>
        <p className="eyebrow mb-3">Order placed</p>
        <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">Thank you for your order</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          {order ? `Your order number is ${formatOrderNumber(order.order_number)}. ` : ''}
          {email ? (
            <>
              We’ll send your receipt to <span className="font-medium break-all text-foreground">{email}</span>.
            </>
          ) : (
            'We’ll email your receipt shortly.'
          )}
        </p>
      </div>

      <PaymentStateNotice outcome={outcome} />
      {order && <OrderReceipt order={order} />}
      <OrderNextSteps email={email} isSignedIn={Boolean(user)} />

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/shop" className={buttonVariants({ size: 'lg' })}>
          Continue shopping
        </Link>
        {user && (
          <Link href="/account/orders" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            View your orders
          </Link>
        )}
      </div>
    </div>
  )
}

function OutcomeView({ outcome }: { outcome: CheckoutOutcome }) {
  switch (outcome.state) {
    case 'complete':
      return <OrderConfirmation outcome={outcome} />
    case 'open':
      return (
        <CheckoutStatus
          icon={<CreditCard />}
          eyebrow="Almost there"
          title="Your payment isn’t complete yet"
          description="It looks like checkout wasn’t finished, so you haven’t been charged. Your bag is saved."
          primaryAction={{ href: '/cart', label: 'Return to your bag' }}
        />
      )
    case 'expired':
      return (
        <CheckoutStatus
          icon={<Hourglass />}
          eyebrow="Checkout expired"
          title="This checkout has timed out"
          description="Checkout links are valid for about 30 minutes and you haven’t been charged. Your bag is saved, so you can start again any time."
          primaryAction={{ href: '/cart', label: 'Return to your bag' }}
        />
      )
    case 'not-configured':
      return (
        <CheckoutStatus
          icon={<Store />}
          eyebrow="Demo mode"
          title="Payments aren’t set up yet"
          description="This store is still being prepared, so no order was placed and nobody was charged."
          primaryAction={{ href: '/shop', label: 'Browse the shop' }}
        />
      )
    case 'not-found':
      return (
        <CheckoutStatus
          icon={<SearchX />}
          eyebrow="Order not found"
          title="We couldn’t find that order"
          description="This link may be incomplete or out of date. If you were charged, check your inbox for a receipt or get in touch and we’ll sort it out."
          primaryAction={{ href: '/shop', label: 'Browse the shop' }}
          secondaryAction={{ href: '/contact', label: 'Contact us' }}
        />
      )
  }
}

/**
 * Manual-payment orders (?order=<id>). Unknown, Stripe and older orders all get
 * the same friendly message, so the link never reveals whether an order exists.
 */
async function ManualOrderView({ orderId }: { orderId: string }) {
  const [order, user] = await Promise.all([getManualOrderConfirmation(orderId), getCurrentUser()])

  if (!order) {
    return (
      <CheckoutStatus
        icon={<Mail />}
        eyebrow="Thank you"
        title="Thanks for shopping with us"
        description="For your privacy, order details are only shown here for a few days after ordering. If you placed an order, we’ll be in touch by email, and you can always see your orders in your account."
        primaryAction={{ href: '/account/orders', label: 'View your orders' }}
        secondaryAction={{ href: '/shop', label: 'Browse the shop' }}
      />
    )
  }

  return <ManualOrderConfirmation order={order} instructions={MANUAL_PAYMENT_INSTRUCTIONS} isSignedIn={Boolean(user)} />
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { session_id: sessionId, order: orderId } = await searchParams

  // Orders are only ever looked up by an unguessable id: the Stripe session id,
  // or the random order id of a manual-payment order.
  if (!isCheckoutSessionId(sessionId) && typeof orderId === 'string' && uuidField.safeParse(orderId).success) {
    return (
      <Container className="py-12 sm:py-16 lg:py-20">
        <ManualOrderView orderId={orderId} />
      </Container>
    )
  }

  const outcome: CheckoutOutcome = isCheckoutSessionId(sessionId)
    ? await getCheckoutOutcome(sessionId)
    : { state: 'not-found' }

  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <OutcomeView outcome={outcome} />
    </Container>
  )
}
