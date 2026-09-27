import { ArrowRight, Clock, Mail, MapPin, Phone, type LucideIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { getFaqGroups } from '@/components/content/faq-content'
import { ContactForm } from '@/components/forms/contact-form'
import { Card, CardTitle } from '@/components/ui/card'
import { Container, PageHeading } from '@/components/ui/misc'
import { getStoreSettings } from '@/lib/data/settings'

export const metadata: Metadata = {
  title: 'Contact us',
  description:
    'Questions about an order, a piece or a custom idea? Send Knotted Studio a message and a real person will reply.',
  alternates: { canonical: '/contact' },
}

/** The FAQ questions people ask most before writing to us. */
const TEASER_QUESTIONS = [
  { group: 'shipping', question: 'How much does shipping cost?' },
  { group: 'returns', question: 'What is your return policy?' },
  { group: 'orders', question: 'Can I change or cancel my order?' },
]

export default async function ContactPage() {
  const settings = await getStoreSettings()
  const faqGroups = getFaqGroups(settings)
  const teaser = TEASER_QUESTIONS.flatMap(({ group, question }) => {
    const item = faqGroups.find((faqGroup) => faqGroup.id === group)?.items.find((entry) => entry.question === question)
    return item ? [{ ...item, href: `/faq#${group}` }] : []
  })

  const hasContactDetails = Boolean(settings.support_email || settings.support_phone || settings.business_address)

  return (
    <Container className="py-12 sm:py-16">
      <PageHeading
        eyebrow="Contact"
        title="We'd love to hear from you."
        description="Questions about an order, a piece or a custom idea? Send us a note and someone from the studio will reply personally."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
        {/* The form comes first in the page order (and on phones); on large screens it sits on the right. */}
        <section aria-labelledby="contact-form-title" className="rounded-3xl bg-card p-5 ring-1 ring-border sm:p-8 lg:order-2">
          <h2 id="contact-form-title" className="font-serif text-2xl tracking-tight sm:text-3xl">
            Send a message
          </h2>
          <p className="mt-2 mb-6 text-sm text-muted-foreground">
            Fields marked <span className="text-clay">*</span> are required.
          </p>
          <ContactForm />
        </section>

        <div className="grid content-start gap-6 lg:order-1">
          <Card>
            <CardTitle>Get in touch</CardTitle>
            <ul className="mt-4 grid gap-4 text-sm">
              {settings.support_email && (
                <ContactDetail icon={Mail} label="Email">
                  <a href={`mailto:${settings.support_email}`} className="break-all hover:text-clay">
                    {settings.support_email}
                  </a>
                </ContactDetail>
              )}
              {settings.support_phone && (
                <ContactDetail icon={Phone} label="Phone">
                  <a href={`tel:${settings.support_phone.replace(/[^\d+]/g, '')}`} className="hover:text-clay">
                    {settings.support_phone}
                  </a>
                </ContactDetail>
              )}
              {settings.business_address && (
                <ContactDetail icon={MapPin} label="Studio">
                  <span className="whitespace-pre-line">{settings.business_address}</span>
                </ContactDetail>
              )}
              {!hasContactDetails && (
                <li className="text-muted-foreground">Use the form and we will reply to you by email.</li>
              )}
              <ContactDetail icon={Clock} label="Response time">
                Within 1–2 business days, Monday to Friday.
              </ContactDetail>
            </ul>
          </Card>

          <Card>
            <CardTitle>Quick answers</CardTitle>
            <ul className="mt-4 grid gap-3 text-sm">
              {teaser.map((item) => (
                <li key={item.question}>
                  <Link href={item.href} className="font-medium hover:text-clay">
                    {item.question}
                  </Link>
                  <p className="mt-1 leading-6 text-muted-foreground">{item.answer}</p>
                </li>
              ))}
            </ul>
            <Link
              href="/faq"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-clay underline-offset-4 hover:underline"
            >
              Browse all FAQs <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Card>

          <Card className="bg-linen/70">
            <CardTitle>Dreaming up a custom piece?</CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use the custom request form to share sizes, colours and photos, and we will reply with ideas and a quote.
            </p>
            <Link
              href="/custom"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-clay underline-offset-4 hover:underline"
            >
              Start a custom request <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Card>
        </div>
      </div>
    </Container>
  )
}

function ContactDetail({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-clay" aria-hidden="true" />
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </li>
  )
}
