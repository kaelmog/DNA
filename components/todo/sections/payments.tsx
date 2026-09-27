import { Callout } from '@/components/todo/callout'
import { CodeBlock } from '@/components/todo/code-block'
import { ClickPath, Code, ExternalLink, TextLink } from '@/components/todo/prose'
import type { ChecklistContext, SectionDefinition } from '@/components/todo/types'

/** Must match the events handled in lib/checkout/webhook-handlers.ts. */
const STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
  'charge.refunded',
]

const TEST_CARDS = [
  { number: '4242 4242 4242 4242', result: 'Payment succeeds' },
  { number: '4000 0027 6000 3184', result: 'Asks for 3D Secure authentication' },
  { number: '4000 0000 0000 0002', result: 'Card is declined' },
]

export function manualPaymentsSection({ status }: ChecklistContext): SectionDefinition {
  return {
    id: 'manual-payments',
    title: 'Payments today (manual)',
    summary:
      'Without Stripe keys the shop takes orders and you collect the money yourself: bank transfer, PayPal, a payment link or cash on pickup.',
    badge: status.stripeConfigured ? { label: 'Not in use', tone: 'neutral' } : { label: 'Active', tone: 'success' },
    steps: [
      {
        id: 'manual-flow',
        title: 'Learn how a manual order works',
        content: (
          <ol>
            <li>The customer places an order at checkout. Their items are reserved, so stock drops straight away.</li>
            <li>
              The order appears in <TextLink href="/admin/orders">Admin → Orders</TextLink> under{' '}
              <strong>Awaiting payment</strong>. The customer sees your payment instructions on screen and, once email
              is set up (section G), in an “order received” email.
            </li>
            <li>You send your payment details if needed and wait for the money to arrive.</li>
            <li>
              Open the order and click <strong>Mark as paid</strong>. The customer gets an order confirmation email.
            </li>
            <li>
              Pack it, add the carrier and tracking number and mark it as <strong>Shipped</strong>. The customer gets a
              shipping email with the tracking link.
            </li>
          </ol>
        ),
      },
      {
        id: 'manual-instructions',
        title: 'Write your payment instructions',
        content: (
          <>
            <p>
              The payment text lives in <Code>lib/checkout/manual-payment.ts</Code>:
            </p>
            <ul>
              <li>
                <Code>MANUAL_PAYMENT_INSTRUCTIONS</Code>: one short paragraph per line, shown at checkout, on the order
                confirmation page and in the “order received” email.
              </li>
              <li>
                <Code>MANUAL_PAYMENT_SUMMARY</Code>: the one-line note under the checkout button in the bag.
              </li>
            </ul>
            <p>
              Describe how you want to be paid, how quickly you reply and how long items stay reserved (7 days), and ask
              customers to use their order number as the payment reference. Edit the file on GitHub (or ask a
              developer); Vercel redeploys automatically.
            </p>
          </>
        ),
      },
      {
        id: 'manual-cancel',
        title: 'Cancel orders that stay unpaid for 7 days',
        content: (
          <>
            <p>
              Once a week, look at <strong>Awaiting payment</strong>. Send a friendly reminder, and if an order is
              still unpaid after 7 days open it and change its status to <strong>Cancelled</strong>.
            </p>
            <Callout tone="info">
              Cancelling puts the reserved items back in stock automatically, so other customers can buy them.
            </Callout>
          </>
        ),
      },
    ],
  }
}

export function stripeSection({ status, liveUrl }: ChecklistContext): SectionDefinition {
  return {
    id: 'stripe',
    title: 'Payments later (Stripe, optional)',
    summary:
      'Stripe takes card, Apple Pay and Google Pay payments and marks orders as paid automatically. Adding the keys switches checkout to Stripe by itself.',
    badge: status.stripeConfigured
      ? { label: `Active (${status.stripeMode} mode)`, tone: 'success' }
      : { label: 'Optional', tone: 'neutral' },
    intro: !status.stripeConfigured && (
      <Callout tone="info">
        Skip this section until you want card payments. The shop works fully with manual payments in the meantime.
      </Callout>
    ),
    steps: [
      {
        id: 'stripe-account',
        title: 'Create and activate your Stripe account',
        content: (
          <p>
            Sign up at <ExternalLink href="https://dashboard.stripe.com/register">dashboard.stripe.com</ExternalLink>{' '}
            and complete <strong>Activate payments</strong> (business details and the bank account for payouts). You
            can test everything before activation.
          </p>
        ),
      },
      {
        id: 'stripe-secret-key',
        title: 'Add the secret key (test mode first)',
        verified: status.env.STRIPE_SECRET_KEY,
        content: (
          <>
            <p>
              In Stripe, turn on <strong>Test mode</strong> and open <ClickPath items={['Developers', 'API keys']} />.
              Reveal the <strong>Secret key</strong> (<Code>sk_test_…</Code>) and save it as{' '}
              <Code>STRIPE_SECRET_KEY</Code>.
            </p>
            <Callout tone="warning">
              As soon as this key is set, checkout sends customers to Stripe. Add the webhook secret (next step) at the
              same time, or paid orders will stay “Awaiting payment”.
            </Callout>
          </>
        ),
      },
      {
        id: 'stripe-webhook',
        title: 'Create the webhook',
        verified: status.env.STRIPE_WEBHOOK_SECRET,
        content: (
          <>
            <p>
              Open <ClickPath items={['Developers', 'Webhooks']} /> and add a destination (endpoint) with this URL:
            </p>
            <CodeBlock code={`${liveUrl}/api/webhooks/stripe`} label="Webhook endpoint URL" />
            <p>Select exactly these events:</p>
            <CodeBlock code={STRIPE_WEBHOOK_EVENTS.join('\n')} label="Webhook events" />
            <p>
              Save, then copy the <strong>Signing secret</strong> (<Code>whsec_…</Code>) into{' '}
              <Code>STRIPE_WEBHOOK_SECRET</Code> and redeploy.
            </p>
          </>
        ),
      },
      {
        id: 'stripe-cli',
        title: 'Test on your computer with the Stripe CLI',
        content: (
          <>
            <p>
              Install the <ExternalLink href="https://docs.stripe.com/stripe-cli">Stripe CLI</ExternalLink>, run{' '}
              <Code>stripe login</Code>, then keep this running while <Code>npm run dev</Code> is open:
            </p>
            <CodeBlock code="stripe listen --forward-to localhost:3000/api/webhooks/stripe" label="Terminal" />
            <p>
              It prints a <Code>whsec_…</Code> secret for local use: put that one in <Code>.env.local</Code> as{' '}
              <Code>STRIPE_WEBHOOK_SECRET</Code> and restart the dev server.
            </p>
          </>
        ),
      },
      {
        id: 'stripe-receipts-tax',
        title: 'Receipts and tax',
        content: (
          <ul>
            <li>
              Turn on emailed receipts: <ClickPath items={['Settings', 'Customer emails']} />, then{' '}
              <strong>Successful payments</strong>.
            </li>
            <li>
              Optional: set up <ExternalLink href="https://docs.stripe.com/tax">Stripe Tax</ExternalLink> in{' '}
              <ClickPath items={['Settings', 'Tax']} /> (your address and where you are registered), then switch on
              Stripe Tax in <TextLink href="/admin/settings">Admin → Settings</TextLink>. Ask your accountant first.
            </li>
          </ul>
        ),
      },
      {
        id: 'stripe-test-cards',
        title: 'Place test orders with test cards',
        content: (
          <>
            <p>Use any future expiry date, any 3-digit CVC and any postcode:</p>
            <ul>
              {TEST_CARDS.map((card) => (
                <li key={card.number}>
                  <Code>{card.number}</Code>: {card.result}
                </li>
              ))}
            </ul>
            <p>
              Each successful test should appear in <TextLink href="/admin/orders">Admin → Orders</TextLink> as{' '}
              <strong>Paid</strong> within a few seconds.
            </p>
          </>
        ),
      },
      {
        id: 'stripe-live',
        title: 'Go live',
        verified: status.stripeMode === 'live',
        content: (
          <ol>
            <li>Switch Stripe out of test mode and copy the live secret key (<Code>sk_live_…</Code>).</li>
            <li>
              Create the same webhook again in live mode: live mode has its own endpoint and its own signing secret.
            </li>
            <li>Update both values in Vercel (Production only) and redeploy.</li>
            <li>Buy something small with your own card, check it arrives as Paid, then refund it from Stripe.</li>
          </ol>
        ),
      },
    ],
  }
}
