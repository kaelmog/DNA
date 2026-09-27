import type { Metadata } from 'next'
import Link from 'next/link'

import { CtaBand } from '@/components/content/cta-band'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { getFaqGroups } from '@/components/content/faq-content'
import { JsonLd } from '@/components/seo/json-ld'
import { buttonVariants } from '@/components/ui/button'
import { Container, PageHeading } from '@/components/ui/misc'
import { getStoreSettings } from '@/lib/data/settings'

export const metadata: Metadata = {
  title: 'Frequently asked questions',
  description:
    'Answers about orders, shipping, returns, caring for your macrame and custom pieces from Knotted Studio.',
  alternates: { canonical: '/faq' },
}

export default async function FaqPage() {
  const settings = await getStoreSettings()
  const groups = getFaqGroups(settings)

  // FAQPage structured data can earn rich results in Google search.
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: groups.flatMap((group) =>
      group.items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    ),
  }

  return (
    <>
      <JsonLd data={faqJsonLd} />
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <PageHeading
            eyebrow="Help"
            title="Frequently asked questions"
            description="Everything you might want to know about ordering, shipping, returns and looking after your pieces."
          />

          <nav aria-label="FAQ topics" className="mb-12 flex flex-wrap gap-2">
            {groups.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="inline-flex min-h-10 items-center rounded-full border border-input px-4 text-sm text-muted-foreground transition-colors hover:border-clay hover:text-foreground"
              >
                {group.title}
              </a>
            ))}
          </nav>

          <div className="grid gap-12">
            {groups.map((group) => (
              <section key={group.id} id={group.id} aria-labelledby={`${group.id}-title`} className="scroll-mt-28">
                <h2 id={`${group.id}-title`} className="mb-4 font-serif text-2xl tracking-tight sm:text-3xl">
                  {group.title}
                </h2>
                <FaqAccordion items={group.items} />
              </section>
            ))}
          </div>
        </div>
      </Container>

      <CtaBand
        eyebrow="Still wondering?"
        title="We're happy to help."
        description="If your question isn't answered here, send us a message and we'll get back to you within 1–2 business days."
        actions={
          <>
            <Link href="/contact" className={buttonVariants({ variant: 'accent' })}>
              Contact us
            </Link>
            <Link href="/shipping-returns" className={buttonVariants({ variant: 'outline' })}>
              Shipping &amp; returns
            </Link>
          </>
        }
      />
    </>
  )
}
