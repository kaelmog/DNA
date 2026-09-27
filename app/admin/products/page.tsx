import { Package, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import {
  ProductFilters,
  productListParams,
  type ProductListFilters,
} from '@/components/admin/products/product-filters'
import { ProductsTable } from '@/components/admin/products/products-table'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/misc'
import { Pagination } from '@/components/ui/pagination'
import { requireAdmin } from '@/lib/auth'
import { getAdminProducts, getAllCategories, toProductStatusFilter } from '@/lib/data/admin/catalog'
import { getStoreSettings } from '@/lib/data/settings'
import { pluralize } from '@/lib/format'
import { uuidField } from '@/lib/validation'

export const metadata: Metadata = {
  title: 'Products',
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

const firstValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

/** Turns untrusted query-string values into known filters. */
function parseFilters(params: Awaited<SearchParams>): ProductListFilters & { page: number } {
  const category = firstValue(params.category)
  const page = Number.parseInt(firstValue(params.page) ?? '1', 10)
  return {
    search: (firstValue(params.q) ?? '').trim().slice(0, 100),
    status: toProductStatusFilter(firstValue(params.status)),
    categoryId: category && uuidField.safeParse(category).success ? category : undefined,
    lowStock: firstValue(params.stock) === 'low',
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin()

  const filters = parseFilters(await searchParams)
  const [result, categories, settings] = await Promise.all([
    getAdminProducts(filters),
    getAllCategories(),
    getStoreSettings(),
  ])
  const hasFilters = Boolean(filters.search || filters.categoryId || filters.lowStock || filters.status !== 'all')

  return (
    <>
      <AdminPageHeader
        title="Products"
        description={
          result.total > 0
            ? `${pluralize(result.total, 'product')}${hasFilters ? ` ${result.total === 1 ? 'matches' : 'match'} these filters` : ' in your catalog'}.`
            : 'Everything you sell, including drafts and archived pieces.'
        }
        actions={
          <Link href="/admin/products/new" className={buttonVariants({ variant: 'accent' })}>
            <Plus aria-hidden="true" /> New product
          </Link>
        }
      />

      <ProductFilters filters={filters} categories={categories} />

      {result.items.length > 0 ? (
        <>
          <ProductsTable products={result.items} currency={settings.currency} />
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            basePath="/admin/products"
            searchParams={productListParams(filters)}
            className="mt-6"
          />
        </>
      ) : hasFilters || filters.page > 1 ? (
        <EmptyState
          icon={<Package />}
          title="No products match"
          description="Try a different search, status or category."
          action={
            <Link href="/admin/products" className={buttonVariants({ variant: 'outline' })}>
              Clear filters
            </Link>
          }
        />
      ) : (
        <EmptyState
          icon={<Package />}
          title="No products yet"
          description="Add your first piece with photos, prices and stock. It stays a draft until you publish it."
          action={
            <Link href="/admin/products/new" className={buttonVariants({ variant: 'accent' })}>
              <Plus aria-hidden="true" /> New product
            </Link>
          }
        />
      )}
    </>
  )
}
