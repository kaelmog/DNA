import { getShippingFacts, shippingPriceSentence } from '@/components/content/shipping-facts'
import type { StoreSettings } from '@/lib/types'

export interface FaqItem {
  question: string
  /** Plain text: it is also used for the FAQPage structured data. */
  answer: string
  link?: { href: string; label: string }
}

export interface FaqGroup {
  /** Anchor id, e.g. /faq#shipping. */
  id: string
  title: string
  items: FaqItem[]
}

/**
 * All FAQ questions, grouped. Shipping answers are built from the store
 * settings so they always match checkout. Edit the wording here.
 */
export function getFaqGroups(settings: StoreSettings): FaqGroup[] {
  const shipping = getShippingFacts(settings)

  return [
    {
      id: 'orders',
      title: 'Orders',
      items: [
        {
          question: 'How do I place an order?',
          answer:
            'Add the pieces you love to your bag, then check out securely through Stripe. You can check out as a guest, or sign in to keep your order history in one place.',
          link: { href: '/shop', label: 'Browse the shop' },
        },
        {
          question: 'Which payment methods do you accept?',
          answer:
            'All major credit and debit cards, plus wallets such as Apple Pay and Google Pay where your device supports them. Payments are processed by Stripe, so your card details never touch our servers.',
        },
        {
          question: 'Do I need an account to order?',
          answer:
            'No. An account is optional, but it lets you see your order history and tracking, save pieces to a wishlist and leave reviews.',
          link: { href: '/signup', label: 'Create an account' },
        },
        {
          question: 'Can I change or cancel my order?',
          answer:
            'Yes, as long as it has not shipped yet. Contact us as soon as possible with your order number and we will do our best to help.',
          link: { href: '/contact', label: 'Contact us' },
        },
        {
          question: 'Do you offer discount codes?',
          answer:
            'Now and then. Join the studio letter at the bottom of any page to hear about offers first. You can add a code before you pay.',
        },
      ],
    },
    {
      id: 'shipping',
      title: 'Shipping',
      items: [
        {
          question: 'How much does shipping cost?',
          answer: `Shipping is ${shippingPriceSentence(shipping)}. You will always see the exact amount before you pay.`,
        },
        {
          question: 'Where do you ship?',
          answer: `We currently ship to ${shipping.countries}. If you live somewhere else, get in touch and we will see what we can do.`,
        },
        {
          question: 'How long will my order take?',
          answer:
            'Ready-to-ship pieces leave the studio within 1–3 business days. Delivery usually takes a further 3–7 business days, depending on where you are.',
          link: { href: '/shipping-returns', label: 'Shipping & returns' },
        },
        {
          question: 'Will I get a tracking number?',
          answer:
            'Yes. We email you tracking details as soon as your order ships. If you have an account, you can also see them in your order history.',
        },
      ],
    },
    {
      id: 'returns',
      title: 'Returns',
      items: [
        {
          question: 'What is your return policy?',
          answer:
            'You can return unused items in their original condition within 30 days of delivery. Custom pieces are made just for you and are final sale.',
          link: { href: '/shipping-returns', label: 'Read the full policy' },
        },
        {
          question: 'How do I start a return?',
          answer:
            'Send us a message with your order number and the items you would like to return. We will reply with the return address and next steps.',
          link: { href: '/contact', label: 'Start a return' },
        },
        {
          question: 'My order arrived damaged. What now?',
          answer:
            'We are so sorry. Contact us within 7 days of delivery with a few photos of the piece and the packaging, and we will send a replacement or a full refund.',
        },
        {
          question: 'When will I get my refund?',
          answer:
            'As soon as your return arrives and has been checked, we refund your original payment method. Banks usually take 5–10 business days to show it.',
        },
      ],
    },
    {
      id: 'care',
      title: 'Care',
      items: [
        {
          question: 'How do I look after my macrame?',
          answer:
            'Dust it gently, or use a hairdryer on the cool setting. For small marks, dab with cold water and a little mild soap, then let it dry flat. Keep pieces out of strong direct sunlight to stop the cotton from fading.',
        },
        {
          question: 'My piece is creased from shipping. Is that normal?',
          answer:
            'Yes. Hang it up for a day or two and the creases relax on their own. For stubborn folds, mist lightly with water or use a steamer from a distance.',
        },
        {
          question: 'Can I hang a plant hanger outdoors?',
          answer:
            'Natural cotton is happiest indoors or on a sheltered porch. Rain and strong sun slowly weaken the fibres.',
        },
        {
          question: 'How do I keep the fringe neat?',
          answer:
            'Brush it out with a wide-tooth comb, then trim any stray ends with sharp fabric scissors.',
        },
      ],
    },
    {
      id: 'custom-orders',
      title: 'Custom orders',
      items: [
        {
          question: 'Can you make something just for me?',
          answer:
            'We would love to. Tell us about your space, size, colours and budget, and we will come back with ideas, a timeline and a quote.',
          link: { href: '/custom', label: 'Start a custom request' },
        },
        {
          question: 'How long does a custom piece take?',
          answer:
            'Most custom pieces take 2–4 weeks once the design is agreed, depending on the size and our current queue. If you have a date in mind, let us know in your request.',
        },
        {
          question: 'How is a custom piece priced?',
          answer:
            'Every quote is based on size, materials and complexity. Sharing a budget helps us suggest a design that fits it.',
        },
        {
          question: 'Can I change my design after you start?',
          answer:
            'Small changes are easy early on. Once knotting has begun, bigger changes may affect the price and timeline, and we will always check with you first.',
        },
      ],
    },
  ]
}
