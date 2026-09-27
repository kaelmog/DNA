import type { Metadata } from 'next'
import Link from 'next/link'

import { LegalPage, type LegalSection } from '@/components/content/legal-page'
import { Placeholder } from '@/components/content/placeholder'
import { getStoreSettings } from '@/lib/data/settings'

export const metadata: Metadata = {
  title: 'Terms of service',
  description: 'The terms that apply when you use the Knotted Studio website and buy from our shop.',
  alternates: { canonical: '/terms' },
}

/**
 * Terms of service template for a small handmade shop.
 * Replace every [placeholder] and have it reviewed by a lawyer in your country.
 */
export default async function TermsPage() {
  const settings = await getStoreSettings()
  const currency = settings.currency.toUpperCase()
  const contactEmail = settings.support_email ? (
    <a href={`mailto:${settings.support_email}`}>{settings.support_email}</a>
  ) : (
    <Placeholder>Support email</Placeholder>
  )

  const sections: LegalSection[] = [
    {
      id: 'about',
      title: 'About these terms',
      content: (
        <p>
          These terms apply when you use this website or buy from Knotted Studio, a shop run by{' '}
          <Placeholder>Your business legal name</Placeholder>, <Placeholder>Business address</Placeholder>{' '}
          (&quot;we&quot;, &quot;us&quot;). By using the site or placing an order, you agree to them. Please also read
          our <Link href="/privacy">privacy policy</Link> and <Link href="/shipping-returns">shipping &amp; returns</Link>{' '}
          page, which form part of these terms.
        </p>
      ),
    },
    {
      id: 'accounts',
      title: 'Your account',
      content: (
        <p>
          You can shop as a guest or create an account. If you create one, please give accurate information, keep your
          password private and let us know straight away if you think someone else has used your account. You must be
          at least 18, or have a parent or guardian&apos;s permission, to place an order.
        </p>
      ),
    },
    {
      id: 'products',
      title: 'Handmade products',
      content: (
        <p>
          Every piece is made by hand from natural materials, so small variations in colour, size, knots and wood grain
          are part of its character, not a defect. Sizes are approximate. We photograph our pieces as accurately as we
          can, but colours can look different on different screens.
        </p>
      ),
    },
    {
      id: 'prices',
      title: 'Prices and payment',
      content: (
        <>
          <p>
            Prices are shown in {currency}. Shipping and any applicable taxes are shown at checkout before you pay.
            Payments are processed securely by Stripe; we never see or store your full card details.
          </p>
          <p>
            We work hard to keep prices and stock accurate. If a product is listed at a clearly wrong price or turns out
            to be unavailable, we may cancel the order and refund you in full.
          </p>
        </>
      ),
    },
    {
      id: 'orders',
      title: 'Orders',
      content: (
        <p>
          Your order is accepted when your payment succeeds and we send you an order confirmation email. We may refuse
          or cancel an order, for example if we suspect fraud or cannot fulfil it, and we will refund any payment in
          full if we do.
        </p>
      ),
    },
    {
      id: 'shipping',
      title: 'Shipping and delivery',
      content: (
        <p>
          Shipping costs, delivery areas and timings are explained on our{' '}
          <Link href="/shipping-returns">shipping &amp; returns</Link> page. Delivery dates are estimates. Responsibility
          for the goods passes to you when they are delivered to the address you gave us.
        </p>
      ),
    },
    {
      id: 'returns',
      title: 'Returns and refunds',
      content: (
        <p>
          You can return unused items in their original condition within 30 days of delivery, as described on our{' '}
          <Link href="/shipping-returns">shipping &amp; returns</Link> page. Custom and made-to-order pieces are final
          sale unless they arrive damaged or faulty. Nothing in these terms affects the rights you have under consumer
          law where you live.
        </p>
      ),
    },
    {
      id: 'custom-orders',
      title: 'Custom orders',
      content: (
        <p>
          When you send a custom request, we reply with a design idea, a quote and an estimated timeline. Work begins
          only after you accept the quote and pay as agreed. Timelines are estimates and may change; we will keep you
          updated. Because custom pieces are made just for you, they cannot be cancelled once work has started, except
          as required by law.
        </p>
      ),
    },
    {
      id: 'discounts',
      title: 'Discount codes',
      content: (
        <p>
          Discount codes have no cash value, cannot be exchanged or combined unless we say so, and may have a minimum
          spend, a limited number of uses or an expiry date. We may withdraw a code at any time.
        </p>
      ),
    },
    {
      id: 'reviews',
      title: 'Reviews and content you send us',
      content: (
        <p>
          When you post a review or send us content, you confirm it is honest and your own, and you give us permission
          to show it on our website and social channels. We read reviews before publishing them and may decline or
          remove content that is offensive, misleading, unlawful or unrelated to the product.
        </p>
      ),
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual property',
      content: (
        <p>
          Our designs, photos, text and branding belong to us or our licensors. You may share links to our pages, but
          please do not copy our designs, photos or text for commercial use without written permission.
        </p>
      ),
    },
    {
      id: 'acceptable-use',
      title: 'Acceptable use',
      content: (
        <p>
          Please do not misuse the site: for example, do not try to break its security, overload it, scrape it with
          automated tools, submit spam through our forms or use it for anything unlawful. We may suspend accounts that
          do.
        </p>
      ),
    },
    {
      id: 'liability',
      title: 'Our responsibility to you',
      content: (
        <p>
          We are responsible for losses you suffer that are a foreseeable result of us breaking these terms. To the
          extent the law allows, we are not responsible for indirect or unforeseeable losses, and our total liability
          for any order is limited to the amount you paid for it. Nothing in these terms limits liability that cannot be
          limited by law, such as for death or personal injury caused by negligence, or fraud.
        </p>
      ),
    },
    {
      id: 'changes',
      title: 'Changes to these terms',
      content: (
        <p>
          We may update these terms from time to time. The version that applies to your order is the one shown on the
          site when you placed it. The effective date at the top shows when these terms last changed.
        </p>
      ),
    },
    {
      id: 'governing-law',
      title: 'Governing law',
      content: (
        <p>
          These terms are governed by the laws of <Placeholder>Governing law</Placeholder>. If you are a consumer, you
          also keep any protections given to you by the laws of the country where you live, and you may bring a claim
          in your local courts.
        </p>
      ),
    },
    {
      id: 'contact',
      title: 'Contact us',
      content: (
        <p>
          Questions about these terms? Email {contactEmail}, write to{' '}
          <Placeholder>Your business legal name</Placeholder>, <Placeholder>Business address</Placeholder>, or use our{' '}
          <Link href="/contact">contact form</Link>.
        </p>
      ),
    },
  ]

  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of service"
      intro={
        <p>
          Thank you for shopping with Knotted Studio. These terms explain the agreement between you and us when you use
          our website and buy our handmade pieces. We have tried to keep them short and in plain language.
        </p>
      }
      sections={sections}
    />
  )
}
