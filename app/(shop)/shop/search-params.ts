import { SORT_OPTIONS, type SortOption } from '@/lib/constants'

/** Raw query string values as Next.js passes them to the page. */
export type RawShopSearchParams = Record<string, string | string[] | undefined>

export interface ShopFilters {
  /** Category slug (not yet checked against real categories). */
  category?: string
  q?: string
  sort: SortOption
  page: number
}

const MAX_QUERY_LENGTH = 100
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SORT_VALUES = new Set<string>(SORT_OPTIONS.map((option) => option.value))

/** `?a=1&a=2` arrives as an array; only the first value counts. */
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function isSortOption(value: string | undefined): value is SortOption {
  return value !== undefined && SORT_VALUES.has(value)
}

/**
 * Turns untrusted query params into safe filters: unknown sorts fall back to
 * "newest", the page is a whole number from 1, and the search text is trimmed
 * and capped so it cannot grow the database query without limit.
 */
export function parseShopFilters(raw: RawShopSearchParams): ShopFilters {
  const category = first(raw.category)?.trim().toLowerCase()
  const q = first(raw.q)?.trim().slice(0, MAX_QUERY_LENGTH).trim()
  const sort = first(raw.sort)
  const page = first(raw.page)

  return {
    category: category && category.length <= 80 && SLUG_PATTERN.test(category) ? category : undefined,
    q: q || undefined,
    sort: isSortOption(sort) ? sort : 'newest',
    page: page && /^\d{1,6}$/.test(page) ? Math.max(1, Number(page)) : 1,
  }
}

/** Builds a /shop URL from filters, leaving out defaults so URLs stay short and canonical. */
export function shopHref(filters: Partial<ShopFilters>) {
  const params = new URLSearchParams()
  if (filters.category) params.set('category', filters.category)
  if (filters.q) params.set('q', filters.q)
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort)
  if (filters.page && filters.page > 1) params.set('page', String(filters.page))
  const query = params.toString()
  return query ? `/shop?${query}` : '/shop'
}
