import { ProductGridSkeleton } from '@/components/shop/product-grid-skeleton'
import { Container, Skeleton } from '@/components/ui/misc'

/** Shown while the shop page fetches products. */
export default function ShopLoading() {
  return (
    <Container className="py-8 sm:py-12">
      <p role="status" className="sr-only">
        Loading products…
      </p>
      <div aria-hidden="true">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 h-10 w-64 max-w-full sm:h-12" />
        <div className="mt-8 flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-28 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="mt-6 mb-8 flex flex-col gap-4 lg:flex-row lg:justify-between">
          <Skeleton className="h-11 w-full sm:max-w-md" />
          <Skeleton className="h-11 w-full sm:w-64" />
        </div>
      </div>
      <ProductGridSkeleton />
    </Container>
  )
}
