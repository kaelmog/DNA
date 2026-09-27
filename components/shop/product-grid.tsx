import { ProductCard } from '@/components/shop/product-card'
import { PRODUCT_GRID_CLASSES } from '@/components/shop/product-grid-layout'
import type { ProductListing } from '@/lib/types'

interface ProductGridProps {
  products: ProductListing[]
  /** Ids on the visitor's wishlist, so hearts render filled. */
  wishlistIds?: string[]
  /** Rendered instead of the grid when there are no products. */
  emptyState?: React.ReactNode
  /** How many leading cards load their image eagerly (above the fold). */
  priorityCount?: number
}

/** Responsive product grid: 2 columns on phones, 3 on tablets, 4 on desktops. */
export function ProductGrid({ products, wishlistIds = [], emptyState = null, priorityCount = 0 }: ProductGridProps) {
  if (products.length === 0) return <>{emptyState}</>

  const saved = new Set(wishlistIds)

  return (
    <ul className={PRODUCT_GRID_CLASSES}>
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} wishlisted={saved.has(product.id)} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  )
}
