import { CalendarClock, Gem, HandHeart } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { connection } from 'next/server'

import { FeatureGrid, type Feature } from '@/components/content/feature-grid'
import { NumberedSteps, type NumberedStep } from '@/components/content/numbered-steps'
import { CustomRequestForm } from '@/components/forms/custom-request-form'
import { Container } from '@/components/ui/misc'
import { getStoreSettings } from '@/lib/data/settings'

import { deadlineBounds } from './deadline'

export const metadata: Metadata = {
  title: 'Custom macrame orders',
  description:
    'Have a vision? Tell us about your space and we will design a hand-knotted wall hanging, plant hanger or event piece just for you.',
  alternates: { canonical: '/custom' },
}

const HOW_IT_WORKS: NumberedStep[] = [
  {
    title: 'Share your idea',
    description: 'Tell us about your space, the size, colours and budget. A photo of the wall or a piece you love helps.',
  },
  {
    title: 'Get a design and a quote',
    description: 'Within 2–3 business days we reply with ideas, a timeline and a price. No commitment until you say yes.',
  },
  {
    title: 'We knot it by hand',
    description: 'Once you approve the design, we make your piece in the studio and send it carefully packed to your door.',
  },
]

const GOOD_TO_KNOW: Feature[] = [
  {
    icon: CalendarClock,
    title: 'Timing',
    description: 'Most custom pieces take 2–4 weeks once the design is agreed. Tell us if you have a date in mind.',
  },
  {
    icon: Gem,
    title: 'Pricing',
    description: 'Quotes depend on size, materials and detail. Sharing a budget helps us design something that fits it.',
  },
  {
    icon: HandHeart,
    title: 'Made only for you',
    description: 'Because each piece is one of a kind, custom orders are final sale unless they arrive damaged.',
  },
]

export default async function CustomPage() {
  // The date picker starts at "today", so this page must render per request, not at build time.
  await connection()
  const deadline = deadlineBounds()
  const settings = await getStoreSettings()

  return (
    <>
      <section className="bg-linen">
        <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:py-20">
          <div>
            <p className="eyebrow mb-4">Made just for you</p>
            <h1 className="max-w-lg font-serif text-5xl leading-none tracking-tight sm:text-6xl">
              Have a vision? Let&apos;s knot it.
            </h1>
            <p className="mt-5 max-w-md leading-7 text-muted-foreground">
              Tell us what you&apos;re dreaming up and we&apos;ll come back with thoughtful ideas, a timeline, and a
              quote. Wall hangings sized to your space, plant hangers for tricky corners, pieces for weddings and
              events: if it can be knotted, we would love to hear about it.
            </p>

            <h2 className="mt-10 mb-5 font-serif text-2xl tracking-tight">How it works</h2>
            <NumberedSteps steps={HOW_IT_WORKS} />

            <div className="relative mt-10 hidden aspect-[4/3] overflow-hidden rounded-[2rem] bg-oat lg:block">
              <Image
                src="/macrame-rainbow.png"
                alt="Hand-knotted macrame rainbow in soft earthy tones"
                fill
                sizes="(min-width: 1280px) 480px, 40vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="h-fit rounded-3xl bg-background p-5 shadow-sm ring-1 ring-border sm:p-8">
            <h2 className="font-serif text-2xl tracking-tight sm:text-3xl">Tell us about your piece</h2>
            <p className="mt-2 mb-6 text-sm text-muted-foreground">
              Fields marked <span className="text-clay">*</span> are required.
              {settings.support_email && (
                <>
                  {' '}
                  Prefer email? Write to{' '}
                  <a href={`mailto:${settings.support_email}`} className="text-clay underline underline-offset-4">
                    {settings.support_email}
                  </a>
                  .
                </>
              )}
            </p>
            <CustomRequestForm minDeadline={deadline.min} maxDeadline={deadline.max} />
          </div>
        </Container>
      </section>

      <section aria-labelledby="good-to-know">
        <Container className="py-14 sm:py-20">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow mb-3">Before you ask</p>
              <h2 id="good-to-know" className="font-serif text-3xl tracking-tight sm:text-4xl">
                Good to know
              </h2>
            </div>
            <Link href="/faq#custom-orders" className="text-sm font-semibold text-clay underline-offset-4 hover:underline">
              More custom order questions
            </Link>
          </div>
          <FeatureGrid features={GOOD_TO_KNOW} className="md:grid-cols-3 lg:grid-cols-3" />
        </Container>
      </section>
    </>
  )
}
