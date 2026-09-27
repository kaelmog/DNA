import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { Container } from '@/components/ui/misc'

/** Short studio story on the oat background, linking to /about. */
export function StorySection() {
  return (
    <section aria-labelledby="story-heading" className="bg-oat">
      <Container className="grid gap-8 py-16 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-24">
        <div>
          {/* clay-dark keeps small text above 4.5:1 contrast on the oat background. */}
          <p className="eyebrow mb-4 text-clay-dark!">A slower kind of beautiful</p>
          <h2 id="story-heading" className="max-w-lg font-serif text-4xl leading-none tracking-[-0.05em] sm:text-5xl">
            Made by hand, for the hands that live with it.
          </h2>
        </div>
        <div>
          <p className="max-w-md text-base leading-7 text-espresso/85">
            Knotted is a tiny studio with a big love for tactile things. We choose natural cotton, reclaimed wood, and
            color stories inspired by sun-warmed places.
          </p>
          <Link
            href="/about"
            className="mt-6 inline-flex min-h-11 items-center gap-3 border-b border-espresso text-sm font-semibold transition-colors hover:border-clay-dark hover:text-clay-dark"
          >
            Meet the maker <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </section>
  )
}
