import { Skeleton } from '@/components/ui/misc'

/** Placeholder for account pages while their data loads (the header and tabs stay visible). */
export default function AccountLoading() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your account…</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  )
}
