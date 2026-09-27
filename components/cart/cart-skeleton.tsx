import { Skeleton } from '@/components/ui/misc'

/** Placeholder shown until the cart has been read from localStorage. */
export function CartSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start xl:gap-14" aria-hidden="true">
      <div className="divide-y divide-border">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex gap-4 py-5 sm:gap-5">
            <Skeleton className="aspect-[4/5] w-20 shrink-0 sm:w-24" />
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="mt-auto h-10 w-32" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-96 rounded-3xl" />
    </div>
  )
}
