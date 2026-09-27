import { Skeleton } from '@/components/ui/misc'

/** Shaped like the product list: title, status tabs, filters and rows. */
export default function ProductsLoading() {
  return (
    <div role="status" aria-live="polite" className="grid gap-6">
      <span className="sr-only">Loading products…</span>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-2">
          <Skeleton className="h-9 w-40 sm:h-10" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-11 w-36" />
      </div>
      <Skeleton className="h-12 w-72 max-w-full" />
      <Skeleton className="h-11" />
      <div className="grid gap-px overflow-hidden rounded-2xl border border-border">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-none" />
        ))}
      </div>
    </div>
  )
}
