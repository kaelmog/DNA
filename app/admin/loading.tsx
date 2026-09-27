import { Skeleton } from '@/components/ui/misc'

/** Shown while any admin page loads: a title bar, a row of tiles and a content block. */
export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" className="grid gap-6">
      <span className="sr-only">Loading…</span>
      <div className="grid gap-2">
        <Skeleton className="h-9 w-48 sm:h-10" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl sm:h-28" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  )
}
