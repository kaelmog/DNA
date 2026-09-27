import { Placeholder } from '@/components/content/placeholder'
import { Container, PageHeading } from '@/components/ui/misc'

export interface LegalSection {
  /** Anchor id for the table of contents. */
  id: string
  title: string
  content: React.ReactNode
}

/**
 * Shared layout for the privacy policy and terms: heading, effective date,
 * a table of contents and numbered sections.
 */
export function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string
  title: string
  intro: React.ReactNode
  sections: LegalSection[]
}) {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <PageHeading eyebrow={eyebrow} title={title} className="mb-6 sm:mb-8">
          <p className="mt-4 text-sm text-muted-foreground">
            Effective date: <Placeholder>Effective date</Placeholder>
          </p>
        </PageHeading>

        <div className="prose-shop">{intro}</div>

        <nav aria-label="On this page" className="my-10 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <p className="eyebrow mb-3">On this page</p>
          <ol className="grid gap-2 text-sm sm:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-muted-foreground transition-colors hover:text-clay">
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="prose-shop">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-28">
              <h2 id={`${section.id}-title`}>
                {index + 1}. {section.title}
              </h2>
              {section.content}
            </section>
          ))}
        </div>
      </div>
    </Container>
  )
}
