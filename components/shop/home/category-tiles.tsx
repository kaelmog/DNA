import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/ui/misc'
import type { Category } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Background tones cycled across tiles that have no photo. */
const TILE_TONES = ['bg-sand', 'bg-linen', 'bg-oat', 'bg-muted'] as const

/** "Shop by category" tiles linking to the filtered shop. Hidden when there are no categories. */
export function CategoryTiles({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null

  return (
    <section aria-labelledby="categories-heading">
      <Container className="pb-16 lg:pb-24">
        <div className="mb-8 sm:mb-10">
          <p className="eyebrow mb-2">Shop by category</p>
          <h2 id="categories-heading" className="font-serif text-4xl tracking-[-0.04em] sm:text-5xl">
            Find your kind of knot.
          </h2>
        </div>

        <ul className={cn('grid grid-cols-2 gap-3 sm:gap-4', categories.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
          {categories.map((category, index) => (
            <li key={category.id}>
              <CategoryTile category={category} tone={TILE_TONES[index % TILE_TONES.length]} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

function CategoryTile({ category, tone }: { category: Category; tone: string }) {
  const hasImage = Boolean(category.image_url)

  return (
    <Link
      href={`/shop?category=${encodeURIComponent(category.slug)}`}
      className={cn(
        'group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl p-4 sm:p-6',
        hasImage ? 'bg-oat text-cream' : cn(tone, 'text-espresso'),
      )}
    >
      {category.image_url ? (
        <>
          <Image
            src={category.image_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
          {/* Darkens the bottom of the photo so the light text stays readable. */}
          <div className="absolute inset-0 bg-linear-to-t from-espresso/80 via-espresso/25 to-transparent" aria-hidden="true" />
        </>
      ) : (
        <span
          className="pointer-events-none absolute -top-3 right-3 font-serif text-[7rem] leading-none text-clay/15 select-none sm:text-[9rem]"
          aria-hidden="true"
        >
          {category.name.charAt(0)}
        </span>
      )}

      <div className="relative">
        <h3 className="font-serif text-xl leading-tight tracking-tight sm:text-2xl">{category.name}</h3>
        {category.description && (
          <p className={cn('mt-1.5 line-clamp-2 text-xs leading-5 sm:text-sm', hasImage ? 'text-cream/85' : 'text-espresso/75')}>
            {category.description}
          </p>
        )}
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold">
          Shop now <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}
