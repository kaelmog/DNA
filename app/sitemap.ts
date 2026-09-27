import type { MetadataRoute } from 'next'

import { DEMO_CATEGORIES, DEMO_PRODUCTS } from '@/lib/demo-data'
import { isSupabaseConfigured } from '@/lib/env'
import { absoluteUrl } from '@/lib/seo'
import { createPublicClient } from '@/lib/supabase/public'

// Regenerate at most once an hour, so new products show up without a redeploy.
export const revalidate = 3600

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>

const STATIC_ROUTES: { path: string; changeFrequency: ChangeFrequency; priority: number }[] = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/shop', changeFrequency: 'daily', priority: 0.9 },
  { path: '/custom', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/about', changeFrequency: 'yearly', priority: 0.6 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/shipping-returns', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
]

interface ProductEntry {
  slug: string
  updated_at: string
  image_url: string | null
}

interface CategoryEntry {
  slug: string
  updated_at: string
}

/** Active products and categories: from Supabase when configured, otherwise the demo catalog. */
async function getCatalogEntries(): Promise<{ products: ProductEntry[]; categories: CategoryEntry[] }> {
  if (!isSupabaseConfigured) {
    return {
      products: DEMO_PRODUCTS.map((product) => ({
        slug: product.slug,
        updated_at: product.updated_at,
        image_url: product.images[0]?.url ?? null,
      })),
      categories: DEMO_CATEGORIES,
    }
  }

  const supabase = createPublicClient()
  const [products, categories] = await Promise.all([
    supabase
      .from('product_listings')
      .select('slug, updated_at, image_url')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(5000)
      .overrideTypes<ProductEntry[], { merge: false }>(),
    supabase
      .from('categories')
      .select('slug, updated_at')
      .eq('is_active', true)
      .order('position')
      .overrideTypes<CategoryEntry[], { merge: false }>(),
  ])

  if (products.error) console.error('[sitemap] products query failed', products.error.message)
  if (categories.error) console.error('[sitemap] categories query failed', categories.error.message)

  return { products: products.data ?? [], categories: categories.data ?? [] }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await getCatalogEntries()

  return [
    ...STATIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
      url: absoluteUrl(path),
      changeFrequency,
      priority,
    })),
    ...categories.map((category) => ({
      url: absoluteUrl(`/shop?category=${encodeURIComponent(category.slug)}`),
      lastModified: category.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: absoluteUrl(`/products/${encodeURIComponent(product.slug)}`),
      lastModified: product.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      images: product.image_url ? [absoluteUrl(product.image_url)] : undefined,
    })),
  ]
}
