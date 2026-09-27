import { Skeleton } from '@/components/ui/misc'

/** Shaped like the categories page: a list of cards and the "New category" card. */
export default function CategoriesLoading() {
  return (
    <div role="status" aria-live="polite" className="grid gap-6">
      <span className="sr-only">Loading categories…</span>
      <div className="grid gap-2">
        <Skeleton className="h-9 w-48 sm:h-10" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="grid gap-3 lg:col-span-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  )
}
