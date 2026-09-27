import { Skeleton } from '@/components/ui/misc'

/** Placeholder shown until the bag has been read from localStorage. */
export function CheckoutSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start xl:gap-14" aria-hidden="true">
      <Skeleton className="h-14 rounded-3xl lg:col-start-2 lg:row-start-1 lg:h-96" />
      <div className="grid gap-10 lg:col-start-1 lg:row-start-1">
        {[0, 1, 2].map((section) => (
          <div key={section} className="grid gap-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-11 sm:col-span-2" />
              <Skeleton className="h-11" />
              <Skeleton className="h-11" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
