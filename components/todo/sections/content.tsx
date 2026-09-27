import { Callout } from '@/components/todo/callout'
import { Code, ExternalLink, TextLink } from '@/components/todo/prose'
import type { SectionDefinition } from '@/components/todo/types'

export function contentSection(): SectionDefinition {
  return {
    id: 'content',
    title: 'Content and legal',
    summary: 'Make the shop yours: real products, your story, your contact details and policies that match what you do.',
    badge: { label: 'Before launch', tone: 'warning' },
    steps: [
      {
        id: 'content-products',
        title: 'Add your own products and photos',
        content: (
          <ul>
            <li>
              <TextLink href="/admin/products">Admin → Products</TextLink>: add each piece with at least one variant
              (price and stock), a category and a clear description with size, materials and care.
            </li>
            <li>
              Photos: WebP or JPEG, about 1600 px on the long edge and under 1 MB each. Free tool:{' '}
              <ExternalLink href="https://squoosh.app">squoosh.app</ExternalLink>. Use natural light and the same
              background for a calm, consistent shop.
            </li>
            <li>Write alt text that describes each photo for customers who use screen readers.</li>
          </ul>
        ),
      },
      {
        id: 'content-settings',
        title: 'Fill in the store settings',
        content: (
          <p>
            In <TextLink href="/admin/settings">Admin → Settings</TextLink> set the support email and phone, business
            address, the announcement bar text, shipping price, free-shipping threshold, the countries you ship to and
            your social media links. The FAQ, footer and shipping page update from these automatically.
          </p>
        ),
      },
      {
        id: 'content-about',
        title: 'Tell your story on the About page',
        content: (
          <p>
            <TextLink href="/about">/about</TextLink> is often the second page people open. Replace the text with your
            own story and a photo of you or your studio. The text lives in <Code>app/(shop)/about/page.tsx</Code>.
          </p>
        ),
      },
      {
        id: 'content-legal',
        title: 'Complete the privacy policy and terms',
        content: (
          <>
            <p>
              Open <TextLink href="/privacy">/privacy</TextLink> and <TextLink href="/terms">/terms</TextLink>. Every
              highlighted <Code>[placeholder]</Code> (legal business name, address, contact email, governing law,
              retention periods) must be replaced in <Code>app/(shop)/privacy/page.tsx</Code> and{' '}
              <Code>app/(shop)/terms/page.tsx</Code>.
            </p>
            <Callout tone="warning">
              These pages are a starting point, not legal advice. Have a lawyer review them for the countries you sell
              to.
            </Callout>
          </>
        ),
      },
      {
        id: 'content-returns',
        title: 'Check the shipping and returns policy',
        content: (
          <p>
            <TextLink href="/shipping-returns">/shipping-returns</TextLink> takes prices and countries from the
            settings. The 30-day return window and 7-day damage window are set at the top of{' '}
            <Code>app/(shop)/shipping-returns/page.tsx</Code>: change them if you work differently.
          </p>
        ),
      },
      {
        id: 'content-tax-rights',
        title: 'Check tax and consumer rights',
        content: (
          <ul>
            <li>
              Selling to the EU or UK: VAT registration (the EU One-Stop Shop), prices shown including VAT, and the
              14-day right to cancel online orders (made-to-order custom pieces can be exempt).
            </li>
            <li>Selling in the US: check where you owe sales tax.</li>
            <li>A short call with an accountant before launch is money well spent.</li>
          </ul>
        ),
      },
    ],
  }
}
