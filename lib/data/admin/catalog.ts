import 'server-only'

import { cache } from 'react'

import { ADMIN_PAGE_SIZE } from '@/lib/constants'
import { getStoreSettings } from '@/lib/data/settings'
import { isSupabaseConfigured } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import type { Category, ProductDetail, ProductImage, ProductListing, ProductVariant } from '@/lib/types'
import { uuidField } from '@/lib/validation'

/**
 * Catalog queries for the admin area. They run as the signed-in admin, so Row
 * Level Security (is_admin()) returns drafts, archived products and hidden
 * categories too. Callers must call requireAdmin() first.
 */

type ServerClient = Awaited<ReturnType<typeof createClient>>

export const PRODUCT_STATUS_FILTERS = ['all', 'active', 'draft', 'archived'] as const
export type ProductStatusFilter = (typeof PRODUCT_STATUS_FILTERS)[number]

export interface AdminProductFilters {
  search?: string
  status?: ProductStatusFilter
  categoryId?: string
  /** Only products with at least one active, tracked variant at or below the low-stock threshold. */
  lowStock?: boolean
  /** 1-based page number. */
  page?: number
}

/** The columns of the product_listings view that the admin list shows. */
export type AdminProductListItem = Pick<
  ProductListing,
  | 'id'
  | 'name'
  | 'slug'
  | 'status'
  | 'is_featured'
  | 'category_id'
  | 'category_name'
  | 'min_price_cents'
  | 'max_price_cents'
  | 'total_inventory'
  | 'variant_count'
  | 'image_url'
  | 'image_alt'
  | 'updated_at'
>

export interface AdminProductPage {
  items: AdminProductListItem[]
  total: number
  page: number
  pageCount: number
}

export interface CategoryWithCount extends Category {
  product_count: number
}

const LIST_COLUMNS =
  'id, name, slug, status, is_featured, category_id, category_name, min_price_cents, max_price_cents, ' +
  'total_inventory, variant_count, image_url, image_alt, updated_at'

/** Escapes LIKE wildcards so a search for "50%" matches literally. */
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`)
}

/** Ids of products that have an active, tracked variant at or below the store's low-stock threshold. */
async function getLowStockProductIds(supabase: ServerClient): Promise<string[]> {
  const { low_stock_threshold } = await getStoreSettings()
  const { data, error } = await supabase
    .from('product_variants')
    .select('product_id')
    .eq('track_inventory', true)
    .eq('is_active', true)
    .lte('inventory_quantity', low_stock_threshold)
    .limit(500)
    .overrideTypes<{ product_id: string }[], { merge: false }>()

  if (error) {
    console.error('[admin-catalog] low-stock lookup failed', error.message)
    return []
  }
  return [...new Set(data.map((row) => row.product_id))]
}

/** Paginated product list for /admin/products, newest changes first. */
export async function getAdminProducts(filters: AdminProductFilters = {}): Promise<AdminProductPage> {
  const page = Math.max(1, Math.floor(filters.page ?? 1))
  const empty: AdminProductPage = { items: [], total: 0, page, pageCount: 1 }
  if (!isSupabaseConfigured) return empty

  const supabase = await createClient()

  // The view has no stock-per-variant column, so resolve the low-stock filter to ids first.
  let lowStockIds: string[] | null = null
  if (filters.lowStock) {
    lowStockIds = await getLowStockProductIds(supabase)
    if (!lowStockIds.length) return empty
  }

  const from = (page - 1) * ADMIN_PAGE_SIZE
  let query = supabase.from('product_listings').select(LIST_COLUMNS, { count: 'exact' })

  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters.search) query = query.ilike('search_text', `%${escapeLike(filters.search.toLowerCase())}%`)
  if (lowStockIds) query = query.in('id', lowStockIds)

  const { data, count, error } = await query
    .order('updated_at', { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1)
    .overrideTypes<AdminProductListItem[], { merge: false }>()

  if (error) {
    // Also reached when ?page is past the last page (PostgREST answers "range not satisfiable").
    console.error('[admin-catalog] getAdminProducts failed', error.message)
    return empty
  }

  const total = count ?? data.length
  return {
    items: data.map((row) => ({
      ...row,
      total_inventory: row.total_inventory === null ? null : Number(row.total_inventory),
      variant_count: Number(row.variant_count ?? 0),
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  }
}

type ProductDetailRow = Omit<ProductDetail, 'images' | 'variants'> & {
  images: ProductImage[] | null
  variants: ProductVariant[] | null
}

const byPosition = <T extends { position: number; created_at: string }>(a: T, b: T) =>
  a.position - b.position || a.created_at.localeCompare(b.created_at)

/**
 * One product for the editor, with every variant (inactive ones included) and
 * every image, both sorted by position. Cached per request so the page and its
 * metadata share one query.
 */
export const getAdminProduct = cache(async (id: string): Promise<ProductDetail | null> => {
  if (!isSupabaseConfigured || !uuidField.safeParse(id).success) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id, name, slug), images:product_images(*), variants:product_variants(*)')
    .eq('id', id)
    .maybeSingle<ProductDetailRow>()

  if (error) console.error('[admin-catalog] getAdminProduct failed', error.message)
  if (!data) return null

  return {
    ...data,
    images: [...(data.images ?? [])].sort(byPosition),
    variants: [...(data.variants ?? [])].sort(byPosition),
  }
})

/** Every category, hidden ones included, in display order. Cached per request. */
export const getAllCategories = cache(async (): Promise<Category[]> => {
  if (!isSupabaseConfigured) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('position')
    .order('name')
    .overrideTypes<Category[], { merge: false }>()

  if (error) {
    console.error('[admin-catalog] getAllCategories failed', error.message)
    return []
  }
  return data
})

type CategoryCountRow = Category & { products: { count: number }[] | null }

/** Every category with how many products (any status) it holds. */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  if (!isSupabaseConfigured) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*, products(count)')
    .order('position')
    .order('name')
    .overrideTypes<CategoryCountRow[], { merge: false }>()

  if (error) {
    console.error('[admin-catalog] getCategoriesWithCounts failed', error.message)
    return []
  }
  return data.map(({ products, ...category }) => ({
    ...category,
    product_count: Number(products?.[0]?.count ?? 0),
  }))
}

/** Narrows an untrusted ?status value to a known filter. */
export function toProductStatusFilter(value: string | undefined): ProductStatusFilter {
  return PRODUCT_STATUS_FILTERS.includes(value as ProductStatusFilter) ? (value as ProductStatusFilter) : 'all'
}

