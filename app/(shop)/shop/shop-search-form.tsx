import { Search } from 'lucide-react'
import Form from 'next/form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import type { ShopFilters } from './search-params'

/**
 * GET search form. next/form turns the submit into a client-side navigation to
 * /shop?q=..., and hidden inputs keep the current category and sort.
 */
export function ShopSearchForm({ filters }: { filters: ShopFilters }) {
  return (
    <Form action="/shop" role="search" className="flex w-full gap-2 sm:max-w-md">
      {filters.category && <input type="hidden" name="category" value={filters.category} />}
      {filters.sort !== 'newest' && <input type="hidden" name="sort" value={filters.sort} />}
      <label htmlFor="shop-search" className="sr-only">
        Search products
      </label>
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          // Remount when the query changes elsewhere (header search, "Clear filters") so the box stays in sync.
          key={filters.q ?? ''}
          id="shop-search"
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Search the collection"
          maxLength={100}
          autoComplete="off"
          className="pl-10"
        />
      </div>
      <Button type="submit" variant="outline">
        Search
      </Button>
    </Form>
  )
}
