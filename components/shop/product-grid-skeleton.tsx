import { PRODUCT_GRID_CLASSES } from '@/components/shop/product-grid-layout'
import { Skeleton } from '@/components/ui/misc'

/** Placeholder cards shaped like <ProductGrid> while products load. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={PRODUCT_GRID_CLASSES} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          <Skeleton className="aspect-[0.88] rounded-2xl" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/3" />
        </div>
      ))}
    </div>
  )
}
