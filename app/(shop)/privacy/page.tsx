import type { Metadata } from 'next'
import Link from 'next/link'

import { LegalPage, type LegalSection } from '@/components/content/legal-page'
import { Placeholder } from '@/components/content/placeholder'
import { getStoreSettings } from '@/lib/data/settings'

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How Knotted Studio collects, uses and protects your personal information, and the choices you have.',
  alternates: { canonical: '/privacy' },
}

/**
 * Privacy policy template that describes how THIS site handles data.
 * Replace every [placeholder] and have it reviewed by a lawyer in your country.
 */
export default async function PrivacyPage() {
  const settings = await getStoreSettings()
  const contactEmail = settings.support_email ? (
    <a href={`mailto:${settings.support_email}`}>{settings.support_email}</a>
  ) : (
    <Placeholder>Privacy contact email</Placeholder>
  )

  const sections: LegalSection[] = [
    {
      id: 'who-we-are',
      title: 'Who we are',
      content: (
        <p>
          This website is run by <Placeholder>Your business legal name</Placeholder> (&quot;Knotted Studio&quot;,
          &quot;we&quot;, &quot;us&quot;), <Placeholder>Business address</Placeholder>. We are responsible for the
          personal information described in this policy. You can reach us at {contactEmail}.
        </p>
      ),
    },
    {
      id: 'information-we-collect',
      title: 'Information we collect',
      content: (
        <>
          <p>We only collect what we need to run the shop:</p>
          <ul>
            <li>
              <strong>Account details</strong>: your email address, password (stored only as a secure hash, never in
              plain text), and optionally your name and phone number.
            </li>
            <li>
              <strong>Order details</strong>: your name, email, phone number, shipping address, the items you bought,
              amounts paid, any discount code, and delivery and tracking information.
            </li>
            <li>
              <strong>Things you send us</strong>: contact form messages, custom order requests (including any
              reference photo you upload), product reviews and your newsletter subscription.
            </li>
            <li>
              <strong>Wishlist</strong>: the products you save while signed in.
            </li>
            <li>
              <strong>Technical information</strong>: your IP address and basic browser details, used briefly to keep
              the site secure and to protect our forms from spam and abuse.
            </li>
          </ul>
          <p>
            We do not collect or store your payment card details. See{' '}
            <a href="#payments">Payments</a> below.
          </p>
        </>
      ),
    },
    {
      id: 'how-we-use',
      title: 'How we use your information',
      content: (
        <>
          <ul>
            <li>To process, ship and support your orders, including returns and refunds.</li>
            <li>To run your account, order history and wishlist.</li>
            <li>To reply to your messages and custom requests.</li>
            <li>To send order confirmations, shipping updates and other service emails.</li>
            <li>To send our newsletter, only if you subscribed. You can unsubscribe at any time.</li>
            <li>To show approved product reviews on the site with the name you chose.</li>
            <li>To prevent fraud, spam and abuse, and to meet our legal and tax obligations.</li>
          </ul>
          <p>
            Where the law requires a legal basis, we rely on: performing our contract with you (orders and your
            account), our legitimate interests (running and securing the shop, answering messages), your consent
            (newsletter) and legal obligations (tax and accounting records).
          </p>
        </>
      ),
    },
    {
      id: 'payments',
      title: 'Payments',
      content: (
        <p>
          Payments are handled by <a href="https://stripe.com/privacy">Stripe</a>. When you check out, you enter your
          card details on Stripe&apos;s secure checkout page, so your card number never touches our servers. Stripe
          tells us whether the payment succeeded and shares the details needed to fulfil your order, such as your
          name, email and shipping address. Stripe may use your information to prevent fraud, as described in its own
          privacy policy.
        </p>
      ),
    },
    {
      id: 'service-providers',
      title: 'Service providers we use',
      content: (
        <>
          <p>We share information only with companies that help us run the shop, and only what they need:</p>
          <ul>
            <li>
              <strong>Supabase</strong>: hosts our database, user accounts and file storage (including custom request
              photos, which are kept private and visible only to us).
            </li>
            <li>
              <strong>Stripe</strong>: processes payments and, where enabled, calculates sales tax.
            </li>
            <li>
              <strong>Resend</strong>: delivers our emails, such as order confirmations and replies.
            </li>
            <li>
              <strong>Vercel</strong>: hosts the website and provides privacy-friendly, cookie-free visitor statistics
              that do not identify you personally.
            </li>
            <li>
              <strong>
                <Placeholder>Newsletter email service</Placeholder>
              </strong>
              : sends our newsletter, if you subscribed.
            </li>
            <li>
              <strong>Shipping carriers</strong>: receive your name, address and sometimes phone number to deliver your
              order.
            </li>
          </ul>
          <p>
            We never sell your personal information, and we do not share it with advertisers. Some providers may
            process data outside your country, for example in the United States. Where required, they use safeguards
            such as the European Commission&apos;s Standard Contractual Clauses.
          </p>
        </>
      ),
    },
    {
      id: 'cookies',
      title: 'Cookies and local storage',
      content: (
        <>
          <p>We keep this simple:</p>
          <ul>
            <li>
              <strong>Sign-in cookie</strong>: when you sign in, we set an essential cookie that keeps you logged in.
              It is removed when you sign out.
            </li>
            <li>
              <strong>Your bag</strong>: the items in your shopping bag are saved in your browser&apos;s local storage
              on your own device, so they are still there when you come back. We do not see them until you check out.
            </li>
          </ul>
          <p>
            We do not use advertising or cross-site tracking cookies, and our visitor statistics work without cookies.
            That is why we do not show a cookie banner. If we ever add marketing tools, we will ask for your consent
            first.
          </p>
        </>
      ),
    },
    {
      id: 'retention',
      title: 'How long we keep information',
      content: (
        <ul>
          <li>
            <strong>Order records</strong>: <Placeholder>Number</Placeholder> years, as required for tax and
            accounting.
          </li>
          <li>
            <strong>Your account</strong>: until you delete it.
          </li>
          <li>
            <strong>Messages and custom requests</strong>: up to <Placeholder>Number</Placeholder> years after our
            last contact, then deleted.
          </li>
          <li>
            <strong>Newsletter</strong>: until you unsubscribe.
          </li>
          <li>
            <strong>Spam-protection data</strong> (such as IP-based request counts): a short time only; we clear it
            regularly.
          </li>
        </ul>
      ),
    },
    {
      id: 'your-rights',
      title: 'Your rights and choices',
      content: (
        <>
          <p>Depending on where you live, you have the right to:</p>
          <ul>
            <li>access the personal information we hold about you and get a copy of it;</li>
            <li>correct information that is wrong or incomplete;</li>
            <li>delete your information;</li>
            <li>object to or restrict certain uses, and withdraw consent at any time;</li>
            <li>complain to your local data protection authority.</li>
          </ul>
          <p>
            You can update your details and <strong>delete your account</strong> yourself in{' '}
            <Link href="/account/settings">Account settings</Link>. Deleting your account permanently removes your
            profile, wishlist and reviews. Order records and custom requests are kept for as long as the law requires
            but are no longer linked to an account. For anything else, email us at {contactEmail} and we will reply
            within 30 days.
          </p>
        </>
      ),
    },
    {
      id: 'security',
      title: 'How we protect your information',
      content: (
        <p>
          The site is served over HTTPS, passwords are securely hashed, and access to customer data is restricted to
          the people who run the shop, protected by strong passwords and two-factor authentication. Database rules make
          sure each customer can only see their own orders and details. No system is perfectly secure, but we work hard
          to keep your information safe and will let you know if a breach affects you.
        </p>
      ),
    },
    {
      id: 'children',
      title: 'Children',
      content: (
        <p>
          Our shop is not directed at children under 16, and we do not knowingly collect their personal information.
          If you believe a child has given us their information, please contact us and we will delete it.
        </p>
      ),
    },
    {
      id: 'changes',
      title: 'Changes to this policy',
      content: (
        <p>
          We may update this policy from time to time. The effective date at the top shows when it last changed. If we
          make important changes, we will let you know on this page or by email.
        </p>
      ),
    },
    {
      id: 'contact',
      title: 'Contact us',
      content: (
        <p>
          Questions about your privacy? Email {contactEmail}, write to{' '}
          <Placeholder>Your business legal name</Placeholder>, <Placeholder>Business address</Placeholder>, or use our{' '}
          <Link href="/contact">contact form</Link>.
        </p>
      ),
    },
  ]

  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      intro={
        <p>
          Your privacy matters to us. This policy explains what personal information Knotted Studio collects when you
          visit our website, create an account or place an order, how we use it, and the choices you have.
        </p>
      }
      sections={sections}
    />
  )
}
