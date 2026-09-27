import { ClickPath, Code, ExternalLink, TextLink } from '@/components/todo/prose'
import type { ChecklistContext, SectionDefinition } from '@/components/todo/types'

export function testingSection({ liveUrl }: ChecklistContext): SectionDefinition {
  return {
    id: 'testing',
    title: 'Test before launch',
    summary: 'Walk through the shop the way a customer would, on the live site, with a real email address.',
    badge: { label: 'Before launch', tone: 'warning' },
    steps: [
      {
        id: 'testing-accounts',
        title: 'Accounts',
        content: (
          <p>
            Sign up with a real address, click the confirmation email, sign out and in, use{' '}
            <TextLink href="/forgot-password">Forgot password</TextLink> and set a new password, then change your email
            in <TextLink href="/account/settings">Account settings</TextLink>. Try one link on your phone while signed
            up on your computer.
          </p>
        ),
      },
      {
        id: 'testing-wishlist-reviews',
        title: 'Wishlist and reviews',
        content: (
          <p>
            Save a product to your wishlist and find it in <TextLink href="/account/wishlist">your account</TextLink>.
            Write a review, check it waits in <TextLink href="/admin/reviews">Admin → Reviews</TextLink>, approve it and
            see it on the product page.
          </p>
        ),
      },
      {
        id: 'testing-manual-order',
        title: 'A full manual order',
        content: (
          <ol>
            <li>Add two items to the bag, apply a discount code and place the order.</li>
            <li>
              Check it appears under <strong>Awaiting payment</strong> in{' '}
              <TextLink href="/admin/orders">Admin → Orders</TextLink> and that stock dropped in Admin → Products.
            </li>
            <li>Click Mark as paid, then add a carrier and tracking number and mark it as shipped.</li>
            <li>
              Check each email arrived and that <TextLink href="/account/orders">your order history</TextLink> shows the
              right status.
            </li>
            <li>Place a second order and cancel it: the stock should come back.</li>
          </ol>
        ),
      },
      {
        id: 'testing-forms',
        title: 'Custom request, contact and newsletter forms',
        content: (
          <p>
            Send a <TextLink href="/custom">custom request</TextLink> with a reference photo, a{' '}
            <TextLink href="/contact">contact message</TextLink> and a newsletter sign-up from the footer. They should
            appear in Admin → Custom requests, Messages and Subscribers.
          </p>
        ),
      },
      {
        id: 'testing-phone',
        title: 'Every page on your phone',
        content: (
          <p>
            Open every page on an iPhone and an Android phone: menu, search, filters, product photos, bag, checkout,
            account and the admin area. Nothing should need sideways scrolling and every button should be easy to tap.
          </p>
        ),
      },
      {
        id: 'testing-lighthouse',
        title: 'Run Lighthouse',
        content: (
          <p>
            Test the home, shop and a product page at{' '}
            <ExternalLink href="https://pagespeed.web.dev">pagespeed.web.dev</ExternalLink> (or Chrome DevTools →
            Lighthouse, mobile). Aim for 90+ in every category. Large photos are the usual culprit.
          </p>
        ),
      },
      {
        id: 'testing-search-console',
        title: 'Submit the sitemap to Google',
        content: (
          <p>
            Add your domain in{' '}
            <ExternalLink href="https://search.google.com/search-console">Google Search Console</ExternalLink>, verify
            it with the DNS record it gives you, then open <ClickPath items={['Sitemaps']} /> and submit{' '}
            <Code>{`${liveUrl}/sitemap.xml`}</Code>.
          </p>
        ),
      },
    ],
  }
}

export function afterLaunchSection(): SectionDefinition {
  return {
    id: 'after-launch',
    title: 'After launch',
    summary: 'Small habits that keep the shop healthy.',
    badge: { label: 'Ongoing', tone: 'neutral' },
    steps: [
      {
        id: 'after-launch-daily',
        title: 'Check the admin area every day',
        content: (
          <p>
            The <TextLink href="/admin">dashboard</TextLink> shows what needs you: orders awaiting payment, paid orders
            to ship, custom requests, messages, reviews to moderate and low stock.
          </p>
        ),
      },
      {
        id: 'after-launch-usage',
        title: 'Watch your Supabase and Vercel usage',
        content: (
          <p>
            Once a month, look at the <strong>Usage</strong> pages in Supabase (database size, storage, bandwidth) and
            Vercel, and set spending alerts so there are no surprises.
          </p>
        ),
      },
      {
        id: 'after-launch-updates',
        title: 'Update packages monthly',
        content: (
          <p>
            Merge Dependabot’s security updates when they appear, and once a month have a developer run{' '}
            <Code>npm outdated</Code>, update, and check that <Code>npm run build</Code> still passes before deploying.
          </p>
        ),
      },
      {
        id: 'after-launch-checklist',
        title: 'Come back to this checklist any time',
        content: (
          <p>
            On the live site, <Code>/todo</Code> is hidden from everyone except signed-in admins, so it is safe to keep.
            Bookmark it for when you add Stripe or email later.
          </p>
        ),
      },
    ],
  }
}
