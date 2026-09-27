import { Hand, Leaf, Recycle, TreePine } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { CtaBand } from '@/components/content/cta-band'
import { FeatureGrid, type Feature } from '@/components/content/feature-grid'
import { NumberedSteps, type NumberedStep } from '@/components/content/numbered-steps'
import { buttonVariants } from '@/components/ui/button'
import { Container } from '@/components/ui/misc'

export const metadata: Metadata = {
  title: 'Our story',
  description:
    'Knotted Studio is a tiny studio making hand-knotted macrame from natural cotton and reclaimed wood, in small batches and made to last.',
  alternates: { canonical: '/about' },
}

const VALUES: Feature[] = [
  {
    icon: Leaf,
    title: 'Natural fibres',
    description: 'Soft, undyed and gently dyed cotton cord that feels good in the hand and ages beautifully.',
  },
  {
    icon: TreePine,
    title: 'Reclaimed wood',
    description: 'Dowels and driftwood given a second life, each with its own grain, knots and character.',
  },
  {
    icon: Hand,
    title: 'Small batches',
    description: 'Every piece is knotted by hand, one at a time. Nothing is mass-produced or rushed.',
  },
  {
    icon: Recycle,
    title: 'Less waste',
    description: 'Offcuts become keychains and small goods, and we pack orders with as little plastic as we can.',
  },
]

const PROCESS: NumberedStep[] = [
  {
    title: 'Design',
    description: 'Each piece starts as a sketch and a colour story inspired by sun-warmed places: sand, oat, clay and terracotta.',
  },
  {
    title: 'Knot',
    description: 'Cord is measured, cut and knotted by hand. A large wall hanging can take many hours of patient work.',
  },
  {
    title: 'Finish and ship',
    description: 'We comb and trim every fringe, check every knot, then wrap your piece carefully for its trip home.',
  },
]

export default function AboutPage() {
  return (
    <>
      <section>
        <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-20">
          <div>
            <p className="eyebrow mb-4">A slower kind of beautiful</p>
            <h1 className="max-w-xl font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">
              Made by hand, for the hands that <em className="text-clay">live with it.</em>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
              Knotted is a tiny studio with a big love for tactile things. We choose natural cotton, reclaimed wood,
              and colour stories inspired by sun-warmed places, and we make everything slowly, on purpose.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/shop" className={buttonVariants({ variant: 'accent', size: 'lg' })}>
                Shop the collection
              </Link>
              <Link href="/custom" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                Request a custom piece
              </Link>
            </div>
          </div>

          <div className="relative aspect-[0.93] overflow-hidden rounded-[2rem] bg-oat">
            <Image
              src="/macrame-hero.png"
              alt="Cream macrame wall hanging on a terracotta wall"
              fill
              priority
              sizes="(min-width: 1280px) 580px, (min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
            <p className="absolute bottom-5 left-5 rounded-full bg-cream/90 px-4 py-2 text-xs">
              Hand-knotted in small batches
            </p>
          </div>
        </Container>
      </section>

      <section aria-labelledby="our-story" className="bg-linen/70">
        <Container className="py-14 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <p className="eyebrow mb-3">Our story</p>
            <h2 id="our-story" className="font-serif text-3xl tracking-tight sm:text-4xl">
              It started with a length of cord and an empty wall.
            </h2>
            <div className="prose-shop mt-6">
              <p>
                Knotted began at a kitchen table, with a coil of cotton cord and the wish for a home that felt a little
                softer. One wall hanging became a few, friends started asking for their own, and the studio grew from
                there: slowly, and on purpose.
              </p>
              <p>
                Today every piece is still knotted by hand, one at a time. We work with natural cotton cord because it
                is soft, strong and honest, and we hang our pieces on reclaimed and responsibly sourced wood, so no two
                are ever quite the same.
              </p>
              <p>
                We make in small batches. Nothing sits in a warehouse, every knot gets our full attention, and when
                something sells out it may come back a little different next time. That is part of the charm of
                handmade.
              </p>
              <p>
                Handmade is slower by nature, and we think that is a good thing. It means fewer, better things: pieces
                made to be lived with for years, not replaced next season.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section aria-labelledby="our-values">
        <Container className="py-14 sm:py-20">
          <div className="mb-10 max-w-xl">
            <p className="eyebrow mb-3">What we care about</p>
            <h2 id="our-values" className="font-serif text-3xl tracking-tight sm:text-4xl">
              Simple materials, made with care.
            </h2>
          </div>
          <FeatureGrid features={VALUES} />
        </Container>
      </section>

      <section aria-labelledby="our-process" className="border-t border-border">
        <Container className="grid gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="relative order-2 aspect-square overflow-hidden rounded-[2rem] bg-oat lg:order-1">
            <Image
              src="/macrame-planter.png"
              alt="Hand-knotted macrame plant hanger holding a leafy plant"
              fill
              sizes="(min-width: 1280px) 580px, (min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="order-1 lg:order-2">
            <p className="eyebrow mb-3">How we work</p>
            <h2 id="our-process" className="mb-8 font-serif text-3xl tracking-tight sm:text-4xl">
              From cord to wall
            </h2>
            <NumberedSteps steps={PROCESS} />
          </div>
        </Container>
      </section>

      <CtaBand
        eyebrow="Find your piece"
        title="Something soft for your corner of the world."
        description="Browse the collection, or tell us about a piece made just for your space."
        actions={
          <>
            <Link href="/shop" className={buttonVariants({ variant: 'accent' })}>
              Shop all pieces
            </Link>
            <Link href="/custom" className={buttonVariants({ variant: 'outline' })}>
              Start a custom request
            </Link>
          </>
        }
      />
    </>
  )
}
