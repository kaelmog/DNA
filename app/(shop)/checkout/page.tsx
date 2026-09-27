import { ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { CheckoutForm } from '@/components/checkout/checkout-form'
import { Container, PageHeading } from '@/components/ui/misc'
import { getCurrentProfile, getCurrentUser } from '@/lib/auth'
import { countryName, shippingCountryCodes } from '@/lib/checkout/countries'
import { getCheckoutMode, MANUAL_PAYMENT_INSTRUCTIONS } from '@/lib/checkout/manual-payment'
import { getStoreSettings } from '@/lib/data/settings'

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
}

/**
 * Manual-payment checkout (used while Stripe is not connected). With Stripe,
 * the bag sends shoppers to Stripe's hosted page instead, so this page sends
 * them back to the bag.
 */
export default async function CheckoutPage() {
  if (getCheckoutMode() !== 'manual') redirect('/cart')

  const [settings, user] = await Promise.all([getStoreSettings(), getCurrentUser()])
  const profile = user ? await getCurrentProfile() : null
  const signedInEmail = profile?.email || user?.email || null

  const countries = shippingCountryCodes(settings.allowed_shipping_countries).map((code) => ({
    code,
    name: countryName(code),
  }))

  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      <PageHeading eyebrow="Nearly yours" title="Checkout">
        <Link
          href="/cart"
          className="mt-3 -ml-1 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-clay underline-offset-4 hover:underline"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Back to your bag
        </Link>
      </PageHeading>

      <CheckoutForm
        settings={{
          currency: settings.currency,
          flat_shipping_cents: settings.flat_shipping_cents,
          free_shipping_threshold_cents: settings.free_shipping_threshold_cents,
          stripe_tax_enabled: settings.stripe_tax_enabled,
        }}
        countries={countries}
        defaults={{
          email: signedInEmail ?? '',
          fullName: profile?.full_name ?? '',
          phone: profile?.phone ?? '',
        }}
        signedInEmail={signedInEmail}
        paymentInstructions={MANUAL_PAYMENT_INSTRUCTIONS}
      />
    </Container>
  )
}
