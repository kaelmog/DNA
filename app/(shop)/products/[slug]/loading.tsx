import { Container, Skeleton } from '@/components/ui/misc'

/** Shown while a product page loads; mirrors the gallery + info layout. */
export default function ProductLoading() {
  return (
    <Container className="pt-2 pb-16 sm:pt-4">
      <p role="status" className="sr-only">
        Loading product…
      </p>
      <div aria-hidden="true">
        <Skeleton className="my-3.5 h-3 w-48" />
        <div className="mt-3 grid grid-cols-1 gap-8 lg:mt-6 lg:grid-cols-2 lg:gap-14">
          <div className="grid gap-3 sm:gap-4">
            <Skeleton className="aspect-[4/5] rounded-3xl" />
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="aspect-square" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="mt-3 h-3 w-24" />
            <Skeleton className="mt-5 h-11 w-3/4" />
            <Skeleton className="mt-4 h-4 w-32" />
            <Skeleton className="mt-8 h-8 w-28" />
            <div className="mt-6 flex flex-wrap gap-2">
              <Skeleton className="h-11 w-32" />
              <Skeleton className="h-11 w-32" />
            </div>
            <div className="mt-6 flex gap-3">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="size-12 rounded-full" />
            </div>
            <div className="mt-8 grid gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}
