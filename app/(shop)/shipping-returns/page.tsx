import { Clock, Globe2, RotateCcw, Truck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { FeatureGrid, type Feature } from '@/components/content/feature-grid'
import { getShippingFacts, shippingPriceSentence } from '@/components/content/shipping-facts'
import { buttonVariants } from '@/components/ui/button'
import { Container, PageHeading } from '@/components/ui/misc'
import { getStoreSettings } from '@/lib/data/settings'

export const metadata: Metadata = {
  title: 'Shipping & returns',
  description:
    'Shipping rates, processing times, where we ship and how returns work at Knotted Studio, including damaged items and custom pieces.',
  alternates: { canonical: '/shipping-returns' },
}

/** Keep these in sync with what you actually do (see the /todo checklist). */
const RETURN_WINDOW_DAYS = 30
const DAMAGE_REPORT_DAYS = 7

export default async function ShippingReturnsPage() {
  const settings = await getStoreSettings()
  const shipping = getShippingFacts(settings)

  const highlights: Feature[] = [
    {
      icon: Truck,
      title: shipping.flatRate ? `${shipping.flatRate} flat rate` : 'Free shipping',
      description: shipping.freeThreshold
        ? `Free on orders of ${shipping.freeThreshold} or more.`
        : shipping.flatRate
          ? 'One simple price per order.'
          : 'On every order, no minimum.',
    },
    {
      icon: Globe2,
      title: 'Where we ship',
      description: `We currently ship to ${shipping.countries}.`,
    },
    {
      icon: Clock,
      title: '1–3 business days',
      description: 'Ready-to-ship pieces leave the studio quickly, carefully packed.',
    },
    {
      icon: RotateCcw,
      title: `${RETURN_WINDOW_DAYS}-day returns`,
      description: 'Changed your mind? Return unused items in their original condition.',
    },
  ]

  return (
    <Container className="py-12 sm:py-16">
      <PageHeading
        eyebrow="Help"
        title="Shipping & returns"
        description="Everything about getting your pieces home, and what to do if something isn't right."
      />

      <h2 className="sr-only">At a glance</h2>
      <FeatureGrid features={highlights} />

      <div className="prose-shop mx-auto mt-14 max-w-3xl">
        <h2>Shipping</h2>
        <h3>Rates</h3>
        <p>
          Shipping is {shippingPriceSentence(shipping)}. The exact shipping cost is always shown in your bag and at
          checkout before you pay. Any sales tax or VAT that applies is calculated at checkout.
        </p>

        <h3>Processing times</h3>
        <ul>
          <li>Ready-to-ship pieces are packed and sent within 1–3 business days.</li>
          <li>During sales and the holiday season, please allow a few extra days.</li>
          <li>
            Custom pieces ship once they are finished. We agree the timeline with you before we start (see{' '}
            <Link href="/custom">custom orders</Link>).
          </li>
        </ul>

        <h3>Where we ship</h3>
        <p>
          We currently ship to {shipping.countries}. Want a piece somewhere else?{' '}
          <Link href="/contact">Get in touch</Link> and we will see what we can do.
        </p>

        <h3>Tracking</h3>
        <p>
          As soon as your order ships, we email you the carrier and tracking number. If you have an account, you can
          also follow it in <Link href="/account/orders">your orders</Link>. Delivery usually takes 3–7 business days
          after dispatch.
        </p>

        <h2>Returns</h2>
        <h3>{RETURN_WINDOW_DAYS}-day returns</h3>
        <p>
          If you are not completely happy, you can return unused items in their original condition and packaging within{' '}
          {RETURN_WINDOW_DAYS} days of delivery. Return shipping is paid by the customer unless the item arrived
          damaged or we made a mistake. We recommend a tracked service, as we cannot refund parcels that go missing on
          their way back to us.
        </p>

        <h3>Damaged or wrong items</h3>
        <p>
          Every piece is checked before it leaves the studio, but journeys can be rough. If your order arrives damaged
          or is not what you ordered, contact us within {DAMAGE_REPORT_DAYS} days of delivery with your order number
          and a few photos of the item and packaging. We will send a replacement or give you a full refund, including
          shipping.
        </p>

        <h3>Custom pieces are final sale</h3>
        <p>
          Custom and made-to-order pieces are made just for you, so they cannot be returned or exchanged unless they
          arrive damaged or faulty. We share the design with you before we start, so there are no surprises.
        </p>

        <h3>How to start a return</h3>
        <ol>
          <li>
            <Link href="/contact">Send us a message</Link> with your order number and the items you would like to
            return.
          </li>
          <li>We reply with the return address and any instructions, usually within 1–2 business days.</li>
          <li>Pack the items securely in their original packaging and send them back with a tracked service.</li>
        </ol>

        <h3>Refunds</h3>
        <p>
          Once your return arrives and has been checked, we refund your original payment method and email you to let
          you know. Original shipping costs are not refundable unless the item was damaged or incorrect. Banks usually
          take 5–10 business days to show the refund on your statement.
        </p>
      </div>

      <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-serif text-xl">Need help with an order?</p>
          <p className="mt-1 text-sm text-muted-foreground">We usually reply within 1–2 business days.</p>
        </div>
        <Link href="/contact" className={buttonVariants({ variant: 'accent' })}>
          Contact us
        </Link>
      </div>
    </Container>
  )
}
