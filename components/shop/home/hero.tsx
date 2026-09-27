import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/ui/misc'

/** Home page opening: headline and CTA, with the hero photo first on phones and on the right on desktops. */
export function Hero() {
  return (
    <section aria-labelledby="hero-heading">
      <Container className="grid gap-8 pt-4 pb-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:pt-12 lg:pb-24">
        <div className="order-2 lg:order-1">
          <p className="eyebrow mb-5">Made slowly · made to last</p>
          <h1
            id="hero-heading"
            className="max-w-xl font-serif text-[3.25rem] leading-[0.95] tracking-[-0.05em] sm:text-7xl lg:text-8xl"
          >
            Objects with a <em className="text-clay">little soul.</em>
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-muted-foreground">
            Thoughtful macrame for softer spaces. Each piece is hand-knotted with natural fibers, good energy, and a
            whole lot of patience.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
            <Link
              href="/shop"
              className="inline-flex min-h-11 items-center gap-3 border-b border-espresso text-sm font-semibold transition-colors hover:border-clay hover:text-clay"
            >
              Shop the collection <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/custom"
              className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-clay"
            >
              Request a custom piece
            </Link>
          </div>
        </div>

        <div className="relative order-1 aspect-[0.93] overflow-hidden rounded-[2rem] bg-oat lg:order-2">
          <Image
            src="/macrame-hero.png"
            alt="Cream macrame wall hanging on a terracotta wall"
            fill
            preload
            sizes="(min-width: 1280px) 600px, (min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
          <p className="absolute bottom-5 left-5 rounded-full bg-cream/90 px-4 py-2 text-xs text-espresso">
            The Sol collection · 01
          </p>
        </div>
      </Container>
    </section>
  )
}
