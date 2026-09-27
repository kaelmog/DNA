import 'server-only'

import { cache } from 'react'

import { PAGE_SIZE, type SortOption } from '@/lib/constants'
import { DEMO_CATEGORIES, DEMO_PRODUCTS, toDemoListing } from '@/lib/demo-data'
import { isSupabaseConfigured } from '@/lib/env'
import { createPublicClient } from '@/lib/supabase/public'
import type { Category, ProductDetail, ProductImage, ProductListing, ProductVariant } from '@/lib/types'

/**
 * Storefront catalog queries. They use the anonymous client, so Row Level
 * Security only returns active products and categories. When Supabase is not
 * configured they return the demo catalog from lib/demo-data.ts.
 */

const LISTING_COLUMNS =
  'id, name, slug, description, status, is_featured, badge, tags, category_id, category_name, category_slug, ' +
  'min_price_cents, max_price_cents, compare_at_price_cents, total_inventory, variant_count, in_stock, ' +
  'image_url, image_alt, rating_average, review_count, created_at, updated_at'

export interface ListingQuery {
  /** Category slug. */
  category?: string
  search?: string
  sort?: SortOption
  /** 1-based page number. */
  page?: number
  pageSize?: number
  featured?: boolean
  excludeIds?: string[]
}

export interface ListingPage {
  items: ProductListing[]
  total: number
  page: number
  pageCount: number
}

/** Escapes LIKE wildcards so a search for "50%" matches literally. */
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`)
}

/** Normalizes numeric columns that PostgREST may return as strings (numeric/bigint). */
function normalizeListing(row: ProductListing): ProductListing {
  return {
    ...row,
    rating_average: row.rating_average === null ? null : Number(row.rating_average),
    review_count: Number(row.review_count ?? 0),
    variant_count: Number(row.variant_count ?? 0),
    total_inventory: row.total_inventory === null ? null : Number(row.total_inventory),
  }
}

function sortListings(items: ProductListing[], sort: SortOption) {
  const sorted = [...items]
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => (a.min_price_cents ?? 0) - (b.min_price_cents ?? 0))
    case 'price-desc':
      return sorted.sort((a, b) => (b.min_price_cents ?? 0) - (a.min_price_cents ?? 0))
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    default:
      return sorted.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
}

function demoListings(query: ListingQuery): ListingPage {
  const pageSize = query.pageSize ?? PAGE_SIZE
  const page = Math.max(1, query.page ?? 1)
  const search = query.search?.trim().toLowerCase()
  const filtered = DEMO_PRODUCTS.map(toDemoListing).filter(
    (item) =>
      (!query.category || item.category_slug === query.category) &&
      (!query.featured || item.is_featured) &&
      (!query.excludeIds?.includes(item.id)) &&
      (!search || `${item.name} ${item.description}`.toLowerCase().includes(search)),
  )
  const sorted = sortListings(filtered, query.sort ?? 'newest')
  return {
    items: sorted.slice((page - 1) * pageSize, page * pageSize),
    total: sorted.length,
    page,
    pageCount: Math.max(1, Math.ceil(sorted.length / pageSize)),
  }
}

/** Paginated, filterable product list for /shop, the home page and related products. */
export async function getProductListings(query: ListingQuery = {}): Promise<ListingPage> {
  if (!isSupabaseConfigured) return demoListings(query)

  const pageSize = query.pageSize ?? PAGE_SIZE
  const page = Math.max(1, query.page ?? 1)
  const from = (page - 1) * pageSize

  let request = createPublicClient()
    .from('product_listings')
    .select(LISTING_COLUMNS, { count: 'exact' })
    .eq('status', 'active')

  if (query.category) request = request.eq('category_slug', query.category)
  if (query.featured) request = request.eq('is_featured', true)
  if (query.search?.trim()) request = request.ilike('search_text', `%${escapeLike(query.search.trim().toLowerCase())}%`)
  if (query.excludeIds?.length) request = request.not('id', 'in', `(${query.excludeIds.join(',')})`)

  switch (query.sort ?? 'newest') {
    case 'price-asc':
      request = request.order('min_price_cents', { ascending: true, nullsFirst: false })
      break
    case 'price-desc':
      request = request.order('min_price_cents', { ascending: false, nullsFirst: false })
      break
    case 'name':
      request = request.order('name', { ascending: true })
      break
    default:
      request = request.order('created_at', { ascending: false })
  }

  const { data, count, error } = await request.range(from, from + pageSize - 1).overrideTypes<ProductListing[], { merge: false }>()
  if (error) {
    console.error('[catalog] getProductListings failed', error.message)
    return { items: [], total: 0, page, pageCount: 1 }
  }

  const total = count ?? data.length
  return {
    items: data.map(normalizeListing),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  }
}

/** Active categories in display order. */
export const getCategories = cache(async (): Promise<Category[]> => {
  if (!isSupabaseConfigured) return DEMO_CATEGORIES

  const { data, error } = await createPublicClient()
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('position')
    .order('name')
    .overrideTypes<Category[], { merge: false }>()

  if (error) {
    console.error('[catalog] getCategories failed', error.message)
    return []
  }
  return data
})

type ProductDetailRow = Omit<ProductDetail, 'images' | 'variants'> & {
  images: ProductImage[] | null
  variants: ProductVariant[] | null
}

/** A single active product with category, sorted images and sorted active variants. Cached per request. */
export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  if (!isSupabaseConfigured) return DEMO_PRODUCTS.find((product) => product.slug === slug) ?? null

  const { data, error } = await createPublicClient()
    .from('products')
    .select('*, category:categories(id, name, slug), images:product_images(*), variants:product_variants(*)')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle<ProductDetailRow>()

  if (error) console.error('[catalog] getProductBySlug failed', error.message)
  if (!data) return null

  return {
    ...data,
    images: [...(data.images ?? [])].sort((a, b) => a.position - b.position),
    variants: [...(data.variants ?? [])]
      .filter((variant) => variant.is_active)
      .sort((a, b) => a.position - b.position),
  }
})

/** Up to `limit` other products, preferring the same category. */
export async function getRelatedProducts(product: Pick<ProductDetail, 'id' | 'category'>, limit = 4) {
  const sameCategory = product.category
    ? await getProductListings({ category: product.category.slug, excludeIds: [product.id], pageSize: limit })
    : { items: [] as ProductListing[] }

  if (sameCategory.items.length >= limit) return sameCategory.items

  const others = await getProductListings({
    excludeIds: [product.id, ...sameCategory.items.map((item) => item.id)],
    pageSize: limit - sameCategory.items.length,
  })
  return [...sameCategory.items, ...others.items]
}

/** Live price and availability for a cart line. */
export interface CartVariantInfo {
  variantId: string
  productId: string
  slug: string
  productName: string
  variantTitle: string | null
  sku: string | null
  imageUrl: string | null
  priceCents: number
  compareAtPriceCents: number | null
  /** False when the product/variant was removed, unpublished or sold out. */
  available: boolean
  /** Maximum purchasable quantity, or null when stock is not tracked. */
  maxQuantity: number | null
}

interface VariantRow {
  id: string
  title: string
  sku: string | null
  price_cents: number
  compare_at_price_cents: number | null
  inventory_quantity: number
  track_inventory: boolean
  is_active: boolean
  product: { id: string; name: string; slug: string; status: string; images: { url: string; position: number }[] | null } | null
}

/**
 * Current prices and stock for the given variant ids. Unknown or unpublished
 * variants are simply missing from the result. Used by the cart and checkout;
 * prices always come from here, never from the browser.
 */
export async function getCartVariants(variantIds: string[]): Promise<CartVariantInfo[]> {
  const ids = [...new Set(variantIds)].slice(0, 100)
  if (!ids.length) return []

  if (!isSupabaseConfigured) {
    return DEMO_PRODUCTS.flatMap((product) =>
      product.variants
        .filter((variant) => ids.includes(variant.id))
        .map((variant) => toCartVariantInfo({ ...variant, product: { ...product, images: product.images } })),
    )
  }

  const { data, error } = await createPublicClient()
    .from('product_variants')
    .select(
      'id, title, sku, price_cents, compare_at_price_cents, inventory_quantity, track_inventory, is_active, ' +
        'product:products!inner(id, name, slug, status, images:product_images(url, position))',
    )
    .in('id', ids)
    .overrideTypes<VariantRow[], { merge: false }>()

  if (error) {
    console.error('[catalog] getCartVariants failed', error.message)
    return []
  }
  return data.filter((row) => row.product).map(toCartVariantInfo)
}

function toCartVariantInfo(row: VariantRow): CartVariantInfo {
  const product = row.product!
  const image = [...(product.images ?? [])].sort((a, b) => a.position - b.position)[0]
  const maxQuantity = row.track_inventory ? Math.max(0, row.inventory_quantity) : null
  return {
    variantId: row.id,
    productId: product.id,
    slug: product.slug,
    productName: product.name,
    variantTitle: row.title === 'Default' ? null : row.title,
    sku: row.sku,
    imageUrl: image?.url ?? null,
    priceCents: row.price_cents,
    compareAtPriceCents: row.compare_at_price_cents,
    available: row.is_active && product.status === 'active' && (maxQuantity === null || maxQuantity > 0),
    maxQuantity,
  }
}
