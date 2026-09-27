import Image from 'next/image'
import Link from 'next/link'

import { Price } from '@/components/shop/price'
import { StarRating } from '@/components/shop/star-rating'
import { WishlistButton } from '@/components/shop/wishlist-button'
import { getStoreSettings } from '@/lib/data/settings'
import type { ProductListing } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: ProductListing
  wishlisted?: boolean
  showWishlist?: boolean
  /** Load the image eagerly (use for cards visible without scrolling). */
  priority?: boolean
}

/**
 * Product tile for grids. A Server Component: it reads the store currency
 * from the (per-request cached) settings. The wishlist heart is a sibling of
 * the link, never inside it, because a button inside an anchor is invalid HTML.
 */
export async function ProductCard({ product, wishlisted = false, showWishlist = true, priority = false }: ProductCardProps) {
  const { currency } = await getStoreSettings()
  const hasPriceRange =
    product.min_price_cents !== null &&
    product.max_price_cents !== null &&
    product.min_price_cents !== product.max_price_cents

  return (
    <article className="group relative">
      <Link href={`/products/${product.slug}`} className="block rounded-2xl">
        <div className="relative aspect-[0.88] overflow-hidden rounded-2xl bg-sand">
          <Image
            src={product.image_url ?? '/placeholder.svg'}
            alt={product.image_alt || product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            loading={priority ? 'eager' : 'lazy'}
            className={cn(
              'object-cover transition-transform duration-500 motion-safe:group-hover:scale-105',
              !product.in_stock && 'opacity-75',
            )}
          />
          {(product.badge || !product.in_stock) && (
            <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
              {!product.in_stock && (
                <span className="rounded-full bg-espresso/85 px-3 py-1 text-[10px] font-semibold tracking-wider text-cream uppercase">
                  Sold out
                </span>
              )}
              {product.badge && (
                <span className="rounded-full bg-cream/90 px-3 py-1 text-[10px] font-semibold tracking-wider text-espresso uppercase">
                  {product.badge}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 pt-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <h3 className="text-sm leading-5 font-semibold transition-colors group-hover:text-clay">{product.name}</h3>
            {product.category_name && <p className="mt-0.5 text-xs text-muted-foreground">{product.category_name}</p>}
          </div>
          <Price
            cents={product.min_price_cents}
            compareAtCents={hasPriceRange ? null : product.compare_at_price_cents}
            currency={currency}
            from={hasPriceRange}
            className="shrink-0 text-sm sm:justify-end sm:text-right"
          />
        </div>

        {product.review_count > 0 && (
          <StarRating rating={product.rating_average ?? 0} count={product.review_count} size="sm" className="mt-1.5" />
        )}
      </Link>

      {showWishlist && (
        <WishlistButton
          productId={product.id}
          productName={product.name}
          initialWishlisted={wishlisted}
          className="absolute top-3 right-3"
        />
      )}
    </article>
  )
}
