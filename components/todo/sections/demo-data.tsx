import { Callout } from '@/components/todo/callout'
import { CodeBlock } from '@/components/todo/code-block'
import { Code, TextLink } from '@/components/todo/prose'
import type { ChecklistContext, SectionDefinition } from '@/components/todo/types'

export function demoDataSection({ status }: ChecklistContext): SectionDefinition {
  const { demoCustomers, demoProducts } = status.database
  const demoCounted = demoCustomers !== null && demoProducts !== null
  const hasDemoData = demoCounted && demoCustomers + demoProducts > 0

  return {
    id: 'demo-data',
    title: 'Demo data: remove before launch',
    summary:
      'npm run seed:demo fills the shop with pretend customers, orders, reviews, messages and products so you can try every screen. None of it may be live when real customers arrive.',
    badge: { label: 'Before launch', tone: 'danger' },
    intro: hasDemoData && (
      <Callout tone="danger" title="Demo data found in your database">
        {demoCustomers} demo customers and {demoProducts} demo products are still there.
      </Callout>
    ),
    steps: [
      {
        id: 'demo-data-reset',
        title: 'Remove the demo data',
        verified: demoCounted && !hasDemoData,
        content: (
          <>
            <p>In a terminal in the project folder, run:</p>
            <CodeBlock code="npm run seed:demo:reset" label="Terminal" />
            <p>
              It removes only demo data: customers with <Code>@example.com</Code> emails and their orders, reviews,
              wishlists, messages and custom requests, newsletter sign-ups, products tagged <Code>demo</Code> and the
              demo discount codes. Your own account, products and real orders are never touched.
            </p>
            <p className="text-sm">
              Want to explore again later? <Code>npm run seed:demo</Code> recreates everything and prints the shared
              demo password. Never run it once the shop is live.
            </p>
          </>
        ),
      },
      {
        id: 'demo-data-discounts',
        title: 'Delete or change WELCOME10',
        content: (
          <p>
            <Code>WELCOME10</Code> (10% off) comes from the starter data and anyone can guess it. In{' '}
            <TextLink href="/admin/discounts">Admin → Discounts</TextLink>, delete it or switch it off, and check that
            none of the demo codes (THANKYOU5, SUMMER25, TENOFF, SPRING15, HOLIDAY20) are left. Then create the codes
            you actually want to offer.
          </p>
        ),
      },
      {
        id: 'demo-data-starter-products',
        title: 'Archive the starter products you do not sell',
        content: (
          <p>
            The four starter products (Sol Wall Hanging, Haven Plant Hanger, Mara Rainbow, Little Knot Keychain) came
            from the starter data. In <TextLink href="/admin/products">Admin → Products</TextLink>, edit them to match
            real pieces or set their status to <strong>Archived</strong>. Archiving hides a product but keeps it on
            past orders.
          </p>
        ),
      },
    ],
  }
}
