'use client'

import { useRouter } from 'next/navigation'
import { useOptimistic, useTransition } from 'react'

import { Select } from '@/components/ui/input'
import { SORT_OPTIONS, type SortOption } from '@/lib/constants'

import { shopHref, type ShopFilters } from './search-params'

/**
 * Sort dropdown. Changing it replaces the URL (keeping category and search,
 * back to page 1). The optimistic value shows the new choice immediately while
 * the server renders the re-sorted products.
 */
export function SortSelect({ filters }: { filters: ShopFilters }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [sort, setOptimisticSort] = useOptimistic(filters.sort)

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as SortOption
    startTransition(() => {
      setOptimisticSort(next)
      router.replace(shopHref({ category: filters.category, q: filters.q, sort: next }), { scroll: false })
    })
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="shop-sort" className="text-sm whitespace-nowrap text-muted-foreground">
        Sort by
      </label>
      <Select id="shop-sort" value={sort} onChange={handleChange} aria-busy={isPending} className="w-auto min-w-0 sm:min-w-48">
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  )
}
