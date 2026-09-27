import type { Metadata } from 'next'

import { CartNotice } from '@/components/cart/cart-notice'
import { CartView } from '@/components/cart/cart-view'
import { Container, PageHeading } from '@/components/ui/misc'
import { getCheckoutMode, MANUAL_PAYMENT_SUMMARY } from '@/lib/checkout/manual-payment'
import { getStoreSettings } from '@/lib/data/settings'
import { uuidField } from '@/lib/validation'

export const metadata: Metadata = {
  title: 'Your bag',
  robots: { index: false, follow: false },
}

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const [params, settings] = await Promise.all([searchParams, getStoreSettings()])
  const checkoutMode = getCheckoutMode()

  // Stripe sends shoppers here with ?checkout=cancelled&order=<id> when they leave checkout.
  const checkoutCancelled = checkoutMode === 'stripe' && params.checkout === 'cancelled'
  const orderParam = typeof params.order === 'string' ? params.order : null
  const releaseOrderId = checkoutCancelled && uuidField.safeParse(orderParam).success ? orderParam : null

  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      <PageHeading eyebrow="Your bag" title="Shopping bag" />

      {checkoutCancelled && (
        <CartNotice className="mb-8">
          Checkout cancelled, and your bag is saved. Pick up where you left off whenever you’re ready.
        </CartNotice>
      )}

      <CartView
        settings={{
          currency: settings.currency,
          flat_shipping_cents: settings.flat_shipping_cents,
          free_shipping_threshold_cents: settings.free_shipping_threshold_cents,
          stripe_tax_enabled: settings.stripe_tax_enabled,
        }}
        checkoutMode={checkoutMode}
        manualPaymentSummary={MANUAL_PAYMENT_SUMMARY}
        releaseOrderId={releaseOrderId}
      />
    </Container>
  )
}
