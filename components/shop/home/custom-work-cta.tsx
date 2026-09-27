import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { Container } from '@/components/ui/misc'

const STEPS = [
  { title: 'Share your idea', description: 'Tell us about the space, the size and the feeling you are after.' },
  { title: 'Get a quote', description: 'We reply with thoughtful ideas, a timeline and a price.' },
  { title: 'Knotted by hand', description: 'Your piece is made just for you and shipped with care.' },
] as const

/** Invitation to request a commissioned piece, linking to /custom. */
export function CustomWorkCta() {
  return (
    <section aria-labelledby="custom-heading" className="bg-linen">
      <Container className="grid gap-10 py-16 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16 lg:py-24">
        <div>
          {/* clay-dark keeps small text above 4.5:1 contrast on the linen background. */}
          <p className="eyebrow mb-4 text-clay-dark!">Made just for you</p>
          <h2 id="custom-heading" className="max-w-lg font-serif text-4xl leading-none tracking-[-0.05em] sm:text-5xl">
            Have a vision? Let&apos;s knot it.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-espresso/80">
            Tell us what you&apos;re dreaming up and we&apos;ll come back with thoughtful ideas, a timeline, and a quote.
          </p>
        </div>

        <div className="rounded-3xl bg-background p-6 sm:p-8">
          <ol className="grid gap-5">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sand font-serif text-sm text-clay-dark"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/custom" className={buttonVariants({ size: 'lg', className: 'mt-7 w-full sm:w-auto' })}>
            Start a custom request <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </section>
  )
}
