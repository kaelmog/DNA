import Link from 'next/link'

import type { Category } from '@/lib/types'
import { cn } from '@/lib/utils'

import { shopHref, type ShopFilters } from './search-params'

interface CategoryPillsProps {
  categories: Category[]
  filters: ShopFilters
}

/**
 * Category filter links. On phones the row scrolls sideways inside itself: the
 * negative margin lets it reach the screen edges without widening the page.
 * Search text and sort order are kept when switching category; the page resets.
 */
export function CategoryPills({ categories, filters }: CategoryPillsProps) {
  const pills = [{ slug: undefined, name: 'All pieces' }, ...categories]

  return (
    <nav aria-label="Categories">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        {pills.map((pill) => {
          const isActive = pill.slug === filters.category
          return (
            <li key={pill.slug ?? 'all'} className="shrink-0">
              <Link
                href={shopHref({ category: pill.slug, q: filters.q, sort: filters.sort })}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-10 items-center rounded-full border px-4 text-sm whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-espresso bg-espresso text-cream'
                    : 'border-input text-muted-foreground hover:border-clay hover:text-foreground',
                )}
              >
                {pill.name}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
