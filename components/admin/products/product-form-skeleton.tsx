import { Skeleton } from '@/components/ui/misc'

/** Loading placeholder shaped like the product editor: content cards left, settings cards right. */
export function ProductFormSkeleton() {
  return (
    <div role="status" aria-live="polite" className="grid gap-6">
      <span className="sr-only">Loading product…</span>
      <div className="grid gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-64 max-w-full sm:h-10" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid content-start gap-6 lg:col-span-2">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
        <div className="grid content-start gap-6">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
