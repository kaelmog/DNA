import { Heart } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { ProductGrid } from '@/components/shop/product-grid'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/misc'
import { requireUser } from '@/lib/auth'
import { getWishlistProducts } from '@/lib/data/wishlist'
import { pluralize } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Wishlist',
  robots: { index: false, follow: false },
}

export default async function AccountWishlistPage() {
  await requireUser('/account/wishlist')
  // Only products that are still for sale; unpublished ones drop off automatically.
  const products = await getWishlistProducts()

  return (
    <section aria-labelledby="wishlist-heading">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <h2 id="wishlist-heading" className="font-serif text-2xl tracking-tight sm:text-3xl">
          Saved pieces
        </h2>
        {products.length > 0 && (
          <p className="text-sm text-muted-foreground">{pluralize(products.length, 'piece')}</p>
        )}
      </div>

      <ProductGrid
        products={products}
        wishlistIds={products.map((product) => product.id)}
        emptyState={
          <EmptyState
            icon={<Heart />}
            title="Your wishlist is empty"
            description="Tap the heart on any piece to save it here for later."
            action={
              <Link href="/shop" className={buttonVariants()}>
                Browse the shop
              </Link>
            }
          />
        }
      />
    </section>
  )
}
