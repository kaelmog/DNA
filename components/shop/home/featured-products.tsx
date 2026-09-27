import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { ProductGrid } from '@/components/shop/product-grid'
import { Container, EmptyState } from '@/components/ui/misc'
import type { ProductListing } from '@/lib/types'

interface FeaturedProductsProps {
  products: ProductListing[]
  wishlistIds: string[]
}

/** "The collection" section: featured (or newest) pieces with a link to the full shop. */
export function FeaturedProducts({ products, wishlistIds }: FeaturedProductsProps) {
  return (
    <section aria-labelledby="featured-heading">
      <Container className="py-16 lg:py-24">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:mb-10 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow mb-2">The collection</p>
            <h2 id="featured-heading" className="max-w-xl font-serif text-4xl tracking-[-0.04em] sm:text-5xl">
              Made for your corner of the world.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:items-end sm:text-right">
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              Small-batch pieces for walls, windowsills, and the little nooks that make a home.
            </p>
            <Link
              href="/shop"
              className="inline-flex min-h-10 items-center gap-2 self-start text-sm font-semibold text-clay transition-colors hover:text-clay-dark sm:self-end"
            >
              Shop all <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <ProductGrid
          products={products}
          wishlistIds={wishlistIds}
          emptyState={
            <EmptyState
              title="New pieces are on the loom"
              description="The first collection is being knotted right now. Check back soon, or ask us about a custom piece."
              action={
                <Link href="/custom" className="text-sm font-semibold text-clay hover:underline">
                  Request a custom piece
                </Link>
              }
            />
          }
        />
      </Container>
    </section>
  )
}
