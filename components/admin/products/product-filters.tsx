import { Search, X } from 'lucide-react'
import Form from 'next/form'
import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/field'
import { Input, Select } from '@/components/ui/input'
import type { ProductStatusFilter } from '@/lib/data/admin/catalog'
import type { Category } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface ProductListFilters {
  search: string
  status: ProductStatusFilter
  categoryId?: string
  lowStock: boolean
}

const STATUS_TABS: { value: ProductStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Drafts' },
  { value: 'archived', label: 'Archived' },
]

/** Query-string values for the product list; empty values are dropped. Page is always reset. */
export function productListParams(filters: ProductListFilters): Record<string, string | undefined> {
  return {
    q: filters.search || undefined,
    status: filters.status === 'all' ? undefined : filters.status,
    category: filters.categoryId,
    stock: filters.lowStock ? 'low' : undefined,
  }
}

export function productListHref(filters: ProductListFilters) {
  const params = new URLSearchParams()
  Object.entries(productListParams(filters)).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  const query = params.toString()
  return query ? `/admin/products?${query}` : '/admin/products'
}

/** Status tabs plus a search/category form. Works without JavaScript (plain GET form). */
export function ProductFilters({ filters, categories }: { filters: ProductListFilters; categories: Category[] }) {
  const hasFilters = Boolean(filters.search || filters.categoryId || filters.lowStock || filters.status !== 'all')

  return (
    <div className="mb-6 grid gap-4">
      <nav aria-label="Filter by status" className="-mx-1 overflow-x-auto px-1">
        <ul className="flex w-max gap-1 rounded-xl bg-muted p-1">
          {STATUS_TABS.map((tab) => {
            const active = filters.status === tab.value
            return (
              <li key={tab.value}>
                <Link
                  href={productListHref({ ...filters, status: tab.value })}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium transition-colors',
                    active ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <Form action="/admin/products" className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {filters.status !== 'all' && <input type="hidden" name="status" value={filters.status} />}
        {filters.lowStock && <input type="hidden" name="stock" value="low" />}

        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="product-search" className="sr-only">
            Search products
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="product-search"
              type="search"
              name="q"
              defaultValue={filters.search}
              placeholder="Search by name or description"
              maxLength={100}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-1.5 sm:w-56">
          <Label htmlFor="product-category" className="sr-only">
            Category
          </Label>
          <Select id="product-category" name="category" defaultValue={filters.categoryId ?? ''}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.is_active ? '' : ' (hidden)'}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex gap-2">
          <button type="submit" className={buttonVariants({ variant: 'default', className: 'flex-1 sm:flex-none' })}>
            Apply
          </button>
          {hasFilters && (
            <Link href="/admin/products" className={buttonVariants({ variant: 'ghost', className: 'flex-1 sm:flex-none' })}>
              Clear
            </Link>
          )}
        </div>
      </Form>

      {filters.lowStock && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          Showing products with low stock only.
          <Link
            href={productListHref({ ...filters, lowStock: false })}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 font-medium text-clay hover:underline"
          >
            <X className="size-4" aria-hidden="true" /> Show all stock levels
          </Link>
        </p>
      )}
    </div>
  )
}
