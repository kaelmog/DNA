/**
 * Demo catalog shown while Supabase is not configured, so the storefront can be
 * previewed before setup. It mirrors supabase/seed.sql. Once the Supabase env
 * vars are set, this file is no longer used for the catalog.
 */
import type { Category, ProductDetail, ProductListing, StoreSettings } from '@/lib/types'

const CREATED = '2026-01-01T00:00:00.000Z'

/** Fallback settings (also used if the settings row cannot be read). */
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 1,
  store_name: 'Knotted Studio',
  tagline: 'Thoughtful hand-knotted macrame for softer spaces.',
  support_email: null,
  support_phone: null,
  business_address: null,
  announcement_text: 'Free shipping on orders over $100 · Hand-knotted in small batches',
  currency: 'usd',
  flat_shipping_cents: 800,
  free_shipping_threshold_cents: 10000,
  allowed_shipping_countries: ['US'],
  low_stock_threshold: 3,
  stripe_tax_enabled: false,
  instagram_url: null,
  pinterest_url: null,
  facebook_url: null,
  tiktok_url: null,
  updated_at: CREATED,
}

function category(n: number, name: string, slug: string, description: string): Category {
  return {
    id: `00000000-0000-4000-8000-00000000000${n}`,
    name,
    slug,
    description,
    image_url: null,
    position: n,
    is_active: true,
    created_at: CREATED,
    updated_at: CREATED,
  }
}

export const DEMO_CATEGORIES: Category[] = [
  category(1, 'Wall hangings', 'wall-hangings', 'Statement pieces that soften a wall.'),
  category(2, 'Plant hangers', 'plant-hangers', 'Hand-knotted cradles for your leafy friends.'),
  category(3, 'Mini weavings', 'mini-weavings', 'Small woven accents for shelves and nurseries.'),
  category(4, 'Small goods', 'small-goods', 'Keychains, coasters and little everyday knots.'),
]

interface DemoVariant {
  title: string
  sku: string
  price: number
  compareAt?: number
  stock: number
  tracked?: boolean
}

function product(
  n: number,
  data: {
    name: string
    slug: string
    categoryIndex: number
    description: string
    details: string
    featured: boolean
    badge: string | null
    tags: string[]
    image: string
    alt: string
    variants: DemoVariant[]
  },
): ProductDetail {
  const id = `00000000-0000-4000-9000-00000000000${n}`
  const cat = DEMO_CATEGORIES[data.categoryIndex]
  return {
    id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    details: data.details,
    category_id: cat.id,
    status: 'active',
    is_featured: data.featured,
    badge: data.badge,
    tags: data.tags,
    seo_title: null,
    seo_description: null,
    created_at: `2026-01-0${n}T00:00:00.000Z`,
    updated_at: CREATED,
    category: { id: cat.id, name: cat.name, slug: cat.slug },
    images: [
      {
        id: `00000000-0000-4000-a000-00000000000${n}`,
        product_id: id,
        url: data.image,
        storage_path: null,
        alt_text: data.alt,
        position: 0,
        created_at: CREATED,
      },
    ],
    variants: data.variants.map((variant, index) => ({
      id: `00000000-0000-4000-b000-0000000000${n}${index}`,
      product_id: id,
      title: variant.title,
      sku: variant.sku,
      price_cents: variant.price,
      compare_at_price_cents: variant.compareAt ?? null,
      inventory_quantity: variant.stock,
      track_inventory: variant.tracked ?? true,
      weight_grams: null,
      position: index,
      is_active: true,
      created_at: CREATED,
      updated_at: CREATED,
    })),
  }
}

export const DEMO_PRODUCTS: ProductDetail[] = [
  product(1, {
    name: 'Sol Wall Hanging',
    slug: 'sol-wall-hanging',
    categoryIndex: 0,
    description:
      'A sun-warmed statement piece knotted from soft natural cotton and hung on reclaimed driftwood. Sol brings texture and calm to living rooms, bedrooms and entryways.',
    details:
      'Materials: 100% natural cotton cord, reclaimed wood dowel\nSize: approx. 24 × 36 in (61 × 91 cm)\nCare: dust gently or use a hairdryer on the cool setting',
    featured: true,
    badge: 'Bestseller',
    tags: ['wall', 'cotton', 'boho'],
    image: '/macrame-hero.png',
    alt: 'Cream macrame wall hanging on a terracotta wall',
    variants: [
      { title: 'Medium (24 × 36 in)', sku: 'KS-SOL-M', price: 12800, stock: 6 },
      { title: 'Large (30 × 48 in)', sku: 'KS-SOL-L', price: 16800, stock: 3 },
    ],
  }),
  product(2, {
    name: 'Haven Plant Hanger',
    slug: 'haven-plant-hanger',
    categoryIndex: 1,
    description:
      'A sturdy, hand-knotted hanger that cradles pots up to 8 inches wide. Hang it by a sunny window and let your plants take centre stage.',
    details:
      'Materials: 5 mm cotton rope, wooden ring\nLength: approx. 40 in (102 cm)\nFits pots up to 8 in (20 cm) wide. Pot not included.',
    featured: true,
    badge: 'New',
    tags: ['plants', 'cotton'],
    image: '/macrame-planter.png',
    alt: 'Macrame plant hanger holding a leafy plant',
    variants: [
      { title: 'Natural', sku: 'KS-HAV-NAT', price: 4600, stock: 12 },
      { title: 'Terracotta', sku: 'KS-HAV-TER', price: 4600, stock: 8 },
    ],
  }),
  product(3, {
    name: 'Mara Rainbow',
    slug: 'mara-rainbow',
    categoryIndex: 2,
    description:
      'A cheerful mini rainbow in terracotta, sand and blush tones. Perfect for nurseries, shelves and little nooks.',
    details: 'Materials: cotton cord and wool blend\nSize: approx. 8 × 6 in (20 × 15 cm)',
    featured: true,
    badge: 'Limited',
    tags: ['rainbow', 'nursery', 'gift'],
    image: '/macrame-rainbow.png',
    alt: 'Mini macrame rainbow in warm earthy tones',
    variants: [{ title: 'Default', sku: 'KS-MARA', price: 3800, compareAt: 4400, stock: 5 }],
  }),
  product(4, {
    name: 'Little Knot Keychain',
    slug: 'little-knot-keychain',
    categoryIndex: 3,
    description:
      'A tiny knotted keychain with a brass ring. A thoughtful little gift or a sweet treat for yourself.',
    details: 'Materials: cotton cord, brass key ring\nLength: approx. 5 in (13 cm)',
    featured: false,
    badge: null,
    tags: ['gift', 'accessory'],
    image: '/macrame-keychain.png',
    alt: 'Small macrame keychain with a brass ring',
    variants: [{ title: 'Default', sku: 'KS-KEY', price: 1800, stock: 0, tracked: false }],
  }),
]

/** Builds a product_listings-shaped row from a demo product. */
export function toDemoListing(detail: ProductDetail): ProductListing {
  const prices = detail.variants.map((variant) => variant.price_cents)
  const compareAt = detail.variants.map((variant) => variant.compare_at_price_cents ?? 0)
  const tracked = detail.variants.filter((variant) => variant.track_inventory)
  return {
    id: detail.id,
    name: detail.name,
    slug: detail.slug,
    description: detail.description,
    status: detail.status,
    is_featured: detail.is_featured,
    badge: detail.badge,
    tags: detail.tags,
    category_id: detail.category_id,
    category_name: detail.category?.name ?? null,
    category_slug: detail.category?.slug ?? null,
    min_price_cents: Math.min(...prices),
    max_price_cents: Math.max(...prices),
    compare_at_price_cents: Math.max(...compareAt) || null,
    total_inventory: tracked.length ? tracked.reduce((sum, variant) => sum + variant.inventory_quantity, 0) : null,
    variant_count: detail.variants.length,
    in_stock: detail.variants.some((variant) => !variant.track_inventory || variant.inventory_quantity > 0),
    image_url: detail.images[0]?.url ?? null,
    image_alt: detail.images[0]?.alt_text ?? null,
    rating_average: null,
    review_count: 0,
    created_at: detail.created_at,
    updated_at: detail.updated_at,
  }
}
