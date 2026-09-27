import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ProductGrid } from '@/components/shop/product-grid'
import { buttonVariants } from '@/components/ui/button'
import { Container, EmptyState, PageHeading } from '@/components/ui/misc'
import { Pagination } from '@/components/ui/pagination'
import { SITE_NAME } from '@/lib/constants'
import { getCategories, getProductListings } from '@/lib/data/catalog'
import { getWishlistProductIds } from '@/lib/data/wishlist'
import { pluralize } from '@/lib/format'
import type { Category } from '@/lib/types'

import { CategoryPills } from './category-pills'
import { parseShopFilters, shopHref, type RawShopSearchParams, type ShopFilters } from './search-params'
import { ShopSearchForm } from './shop-search-form'
import { SortSelect } from './sort-select'

interface ShopPageProps {
  searchParams: Promise<RawShopSearchParams>
}

/** Parses the query and keeps the category only when it matches a real, active category. */
async function resolveFilters(searchParams: Promise<RawShopSearchParams>) {
  const [raw, categories] = await Promise.all([searchParams, getCategories()])
  const parsed = parseShopFilters(raw)
  const category = categories.find((item) => item.slug === parsed.category) ?? null
  const filters: ShopFilters = { ...parsed, category: category?.slug }
  return { filters, category, categories }
}

function pageTitle(filters: ShopFilters, category: Category | null) {
  if (filters.q) return `Search results for “${filters.q}”`
  return category?.name ?? 'All pieces'
}

export async function generateMetadata({ searchParams }: ShopPageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { filters, category } = await resolveFilters(searchParams)
  const title = pageTitle(filters, category)
  const description =
    category?.description ?? 'Browse hand-knotted macrame wall hangings, plant hangers and small goods, made in small batches.'
  const canonical = category ? shopHref({ category: category.slug }) : '/shop'

  return {
    title,
    description,
    alternates: { canonical },
    // Search result pages are thin duplicates of the catalog, so keep them out of the index.
    ...(filters.q ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_US',
      url: canonical,
      title,
      description,
      images: (await parent).openGraph?.images,
    },
  }
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { filters, category, categories } = await resolveFilters(searchParams)
  const [listing, wishlistIds] = await Promise.all([
    getProductListings({ category: filters.category, search: filters.q, sort: filters.sort, page: filters.page }),
    getWishlistProductIds(),
  ])

  // A page number past the end (old link, edited URL) goes to the last real page.
  if (listing.total > 0 && filters.page > listing.pageCount) {
    redirect(shopHref({ ...filters, page: listing.pageCount }))
  }

  const hasFilters = Boolean(filters.category || filters.q)

  return (
    <Container className="py-8 sm:py-12">
      <PageHeading
        eyebrow={filters.q && category ? `In ${category.name}` : 'The collection'}
        // A long search term without spaces must wrap instead of widening the page on phones.
        title={<span className="wrap-anywhere">{pageTitle(filters, category)}</span>}
        description={!filters.q ? category?.description : undefined}
        className="mb-6 sm:mb-8"
      />

      <CategoryPills categories={categories} filters={filters} />

      <div className="mt-5 mb-8 flex flex-col gap-4 sm:mt-6 lg:flex-row lg:items-center lg:justify-between">
        <ShopSearchForm filters={filters} />
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {pluralize(listing.total, 'piece')}
          </p>
          <SortSelect filters={filters} />
        </div>
      </div>

      <h2 className="sr-only">Products</h2>
      <ProductGrid
        products={listing.items}
        wishlistIds={wishlistIds}
        priorityCount={4}
        emptyState={
          <EmptyState
            title={hasFilters ? 'No pieces match' : 'No pieces yet'}
            description={
              hasFilters
                ? 'Try a different search or browse the whole collection.'
                : 'New pieces are being knotted right now. Please check back soon.'
            }
            action={
              hasFilters && (
                <Link href="/shop" className={buttonVariants({ variant: 'outline' })}>
                  Clear filters
                </Link>
              )
            }
          />
        }
      />

      <Pagination
        page={listing.page}
        pageCount={listing.pageCount}
        basePath="/shop"
        searchParams={{
          category: filters.category,
          q: filters.q,
          sort: filters.sort === 'newest' ? undefined : filters.sort,
        }}
      />
    </Container>
  )
}
