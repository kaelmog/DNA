/**
 * Demo catalog: two extra categories and twelve products tagged 'demo'.
 * Images reuse the static photos in /public (storage_path null), so the reset
 * never has to delete files from Storage for them.
 */
import { DEMO_TAG, unwrap } from './db.mjs'
import { demoId, toIso } from './random.mjs'

export const DEMO_CATEGORIES = [
  {
    slug: 'table-textiles',
    name: 'Table textiles',
    description: 'Coasters and table runners for slow, cozy meals.',
    position: 5,
  },
  {
    slug: 'gift-sets',
    name: 'Gift sets',
    description: 'Ready-to-give boxes of little knotted things.',
    position: 6,
  },
]

/** The launch products from seed.sql. Demo orders use them too, but never modify them. */
export const STARTER_PRODUCTS = {
  'sol-wall-hanging': { popularity: 3 },
  'haven-plant-hanger': { popularity: 4 },
  'mara-rainbow': { popularity: 3 },
  'little-knot-keychain': { popularity: 4, smallItem: true },
}

const IMAGE = {
  hero: '/macrame-hero.png',
  planter: '/macrame-planter.png',
  rainbow: '/macrame-rainbow.png',
  keychain: '/macrame-keychain.png',
}

/**
 * createdDaysAgo keeps orders realistic: a product only appears in orders
 * placed after it was listed (and before it was retired, for archived ones).
 * popularity weights how often it lands in demo orders (drives the bestsellers).
 */
export const DEMO_PRODUCTS = [
  {
    slug: 'luna-moon-hanging',
    name: 'Luna Moon Hanging',
    category: 'wall-hangings',
    status: 'active',
    featured: true,
    badge: 'New',
    tags: ['wall', 'moon', 'boho'],
    createdDaysAgo: 21,
    popularity: 3,
    image: { url: IMAGE.hero, alt: 'Cream macrame hanging with long fringe against a warm terracotta wall' },
    description:
      'A crescent moon knotted in soft cream cotton with a cascade of hand-combed fringe. Luna glows quietly above a bed, a reading nook or a nursery wall.',
    details:
      'Materials: 100% recycled cotton cord, brass ring\nSize: Small approx. 12 × 18 in (30 × 46 cm), Large approx. 18 × 28 in (46 × 71 cm)\nCare: dust gently and refresh the fringe with a wide-tooth comb',
    variants: [
      { title: 'Small (12 × 18 in)', sku: 'DEMO-LUNA-S', price: 6400, stock: 7, weight: 350 },
      { title: 'Large (18 × 28 in)', sku: 'DEMO-LUNA-L', price: 9600, stock: 2, weight: 600 },
    ],
  },
  {
    slug: 'solstice-large-wall-piece',
    name: 'Solstice Large Wall Piece',
    category: 'wall-hangings',
    status: 'active',
    featured: false,
    badge: 'Made to order',
    tags: ['wall', 'statement', 'made-to-order'],
    createdDaysAgo: 95,
    popularity: 1,
    bulky: true,
    image: { url: IMAGE.hero, alt: 'Large layered macrame wall piece in natural cotton on a sunlit wall' },
    description:
      'Our largest statement piece: layered spirals and sunburst rows, knotted by hand over about three days. Every Solstice is made to order for your wall.',
    details:
      'Materials: 5 mm natural cotton rope, 42 in oak dowel\nSize: approx. 36 × 60 in (91 × 152 cm)\nLead time: ships in 2–3 weeks\nCare: dust gently or use a hairdryer on the cool setting',
    variants: [
      { title: 'Natural', sku: 'DEMO-SOLS-NAT', price: 24000, stock: 0, tracked: false, weight: 2200 },
      { title: 'Oat & clay', sku: 'DEMO-SOLS-CLAY', price: 24000, stock: 0, tracked: false, weight: 2200 },
    ],
  },
  {
    slug: 'ember-tassel-mirror',
    name: 'Ember Tassel Mirror',
    category: 'wall-hangings',
    status: 'draft',
    featured: false,
    badge: null,
    tags: ['wall', 'mirror'],
    createdDaysAgo: 6,
    popularity: 0,
    image: { url: IMAGE.hero, alt: 'Cream macrame wall piece with rust-colored tassels' },
    description:
      'A round mirror framed in a halo of knotted cotton and rust-colored tassels. Coming soon, once the first batch has been photographed.',
    details: 'Materials: cotton cord, 10 in (25 cm) round mirror\nSize: approx. 18 in (46 cm) across',
    variants: [{ title: 'Default', sku: 'DEMO-EMBER', price: 11200, stock: 3, weight: 1400 }],
  },
  {
    slug: 'willow-double-plant-hanger',
    name: 'Willow Double Plant Hanger',
    category: 'plant-hangers',
    status: 'active',
    featured: true,
    badge: 'Bestseller',
    tags: ['plants', 'cotton'],
    createdDaysAgo: 110,
    popularity: 5,
    image: { url: IMAGE.planter, alt: 'Two-tier macrame plant hanger holding leafy green plants' },
    description:
      'Two cradles on one line, so a trailing pothos and a little fern can share the same sunny window. Knotted from thick, soft cotton that holds its shape.',
    details:
      'Materials: 5 mm cotton rope, wooden ring\nLength: approx. 52 in (132 cm)\nFits two pots up to 6 in (15 cm) wide. Pots not included.',
    variants: [
      { title: 'Natural', sku: 'DEMO-WIL-NAT', price: 5800, stock: 9, weight: 450 },
      { title: 'Sage', sku: 'DEMO-WIL-SAGE', price: 5800, stock: 4, weight: 450 },
      { title: 'Terracotta', sku: 'DEMO-WIL-TER', price: 6200, stock: 1, weight: 450 },
    ],
  },
  {
    slug: 'nest-hanging-basket',
    name: 'Nest Hanging Basket',
    category: 'plant-hangers',
    status: 'active',
    featured: false,
    badge: null,
    tags: ['plants', 'kitchen'],
    createdDaysAgo: 80,
    popularity: 2,
    image: { url: IMAGE.planter, alt: 'Open-weave macrame hanging basket in natural cotton' },
    description:
      'A deep, open-weave basket for fruit, trailing plants or a bundle of dried flowers. Hang it in the kitchen and win back a little counter space.',
    details:
      'Materials: 4 mm cotton cord, wooden ring\nSize: basket approx. 10 in (25 cm) wide, total drop 34 in (86 cm)\nHolds up to 8 lb (3.5 kg)',
    variants: [{ title: 'Default', sku: 'DEMO-NEST', price: 7200, compareAt: 8400, stock: 3, weight: 500 }],
  },
  {
    slug: 'pebble-mini-weave',
    name: 'Pebble Mini Weave',
    category: 'mini-weavings',
    status: 'active',
    featured: false,
    badge: null,
    tags: ['mini', 'nursery', 'gift'],
    createdDaysAgo: 70,
    popularity: 2,
    image: { url: IMAGE.rainbow, alt: 'Small woven wall piece in warm sand and blush tones' },
    description:
      'A palm-sized weaving with a smooth pebble shape and a soft, looped texture. Lovely propped on a shelf or hung in a row of three.',
    details: 'Materials: wool blend and cotton cord, brass rod\nSize: approx. 6 × 8 in (15 × 20 cm)',
    variants: [
      { title: 'Sand', sku: 'DEMO-PEB-SAND', price: 3200, stock: 10, weight: 120 },
      { title: 'Blush', sku: 'DEMO-PEB-BLUSH', price: 3200, stock: 6, weight: 120 },
    ],
  },
  {
    slug: 'sage-feather-trio',
    name: 'Sage Feather Trio',
    category: 'mini-weavings',
    status: 'active',
    featured: false,
    badge: null,
    tags: ['mini', 'feathers', 'gift'],
    createdDaysAgo: 100,
    popularity: 2,
    image: { url: IMAGE.rainbow, alt: 'Soft macrame accents in muted sage, cream and sand' },
    description:
      "Three macrame feathers in sage, cream and sand, brushed out by hand until they're soft as real plumes. Pinned in a cluster, they make a gentle, airy accent.",
    details:
      'Materials: single-twist cotton string, fabric stiffener\nSize: each feather approx. 3 × 9 in (8 × 23 cm)\nCare: brush gently with a fine comb to refresh',
    variants: [{ title: 'Default', sku: 'DEMO-FEATHER', price: 4400, compareAt: 5200, stock: 0, weight: 90 }],
  },
  {
    slug: 'dune-fringe-runner',
    name: 'Dune Fringe Runner',
    category: 'table-textiles',
    status: 'active',
    featured: true,
    badge: 'New',
    tags: ['table', 'runner'],
    createdDaysAgo: 28,
    popularity: 2,
    image: { url: IMAGE.hero, alt: 'Natural cotton macrame with long, even fringe' },
    description:
      'A slim table runner knotted in a wave pattern and finished with long, swingy fringe. Dune makes an everyday table feel like a slow Sunday lunch.',
    details:
      'Materials: 3 mm cotton string\nSize: 12 in (30 cm) wide; 72 or 90 in (183 or 229 cm) long including fringe\nCare: hand wash cold, dry flat',
    variants: [
      { title: '72 in', sku: 'DEMO-DUNE-72', price: 8800, stock: 5, weight: 400 },
      { title: '90 in', sku: 'DEMO-DUNE-90', price: 10800, stock: 2, weight: 500 },
    ],
  },
  {
    slug: 'terra-coaster-set',
    name: 'Terra Coaster Set',
    category: 'table-textiles',
    status: 'active',
    featured: false,
    badge: 'Bestseller',
    tags: ['table', 'coasters', 'gift'],
    createdDaysAgo: 105,
    popularity: 5,
    smallItem: true,
    image: { url: IMAGE.keychain, alt: 'Small hand-knotted cotton pieces in natural tones' },
    description:
      'Round, tightly knotted coasters that soak up drips and look lovely doing it. Sold in sets and tied with a cotton bow, ready to give.',
    details:
      'Materials: 3 mm cotton string\nSize: each coaster approx. 4.5 in (11 cm) across\nCare: hand wash cold, reshape and dry flat',
    variants: [
      { title: 'Set of 4 · Natural', sku: 'DEMO-TERRA-4N', price: 2600, stock: 18, weight: 160 },
      { title: 'Set of 4 · Terracotta', sku: 'DEMO-TERRA-4T', price: 2600, stock: 12, weight: 160 },
      { title: 'Set of 6 · Natural', sku: 'DEMO-TERRA-6N', price: 3600, stock: 8, weight: 240 },
    ],
  },
  {
    slug: 'harbor-knot-garland',
    name: 'Harbor Knot Garland',
    category: 'small-goods',
    status: 'archived',
    featured: false,
    badge: null,
    tags: ['garland', 'seasonal'],
    createdDaysAgo: 115,
    retiredDaysAgo: 35,
    popularity: 2,
    image: { url: IMAGE.keychain, alt: 'Knotted cotton cord with small wooden details' },
    description:
      'A string of chunky square knots and wooden beads for mantels, shelves and doorways. Our summer-market garland, resting until next season.',
    details: 'Materials: cotton cord, unfinished wooden beads\nLength: approx. 60 in (152 cm)',
    variants: [{ title: 'Default', sku: 'DEMO-HARBOR', price: 3400, stock: 4, weight: 200 }],
  },
  {
    slug: 'meadow-gift-box',
    name: 'Meadow Gift Box',
    category: 'gift-sets',
    status: 'active',
    featured: true,
    badge: 'Limited',
    tags: ['gift', 'set'],
    createdDaysAgo: 45,
    popularity: 2,
    image: { url: IMAGE.rainbow, alt: 'Mini macrame weaving in warm earthy tones, part of a gift set' },
    description:
      'A mini weaving, a pair of coasters and a little knot keychain, tucked into a kraft box with tissue and a handwritten note. The easiest thoughtful gift.',
    details:
      'Classic: Pebble mini weave, 2 Terra coasters, Little Knot keychain\nDeluxe: everything in Classic plus a mini plant hanger\nBox: approx. 10 × 8 × 3 in (25 × 20 × 8 cm)',
    variants: [
      { title: 'Classic', sku: 'DEMO-MEADOW-C', price: 6800, stock: 6, weight: 500 },
      { title: 'Deluxe', sku: 'DEMO-MEADOW-D', price: 9800, compareAt: 11200, stock: 4, weight: 800 },
    ],
  },
  {
    slug: 'cove-bookmark-set',
    name: 'Cove Bookmark Set',
    category: 'gift-sets',
    status: 'active',
    featured: false,
    badge: null,
    tags: ['gift', 'books'],
    createdDaysAgo: 60,
    popularity: 3,
    smallItem: true,
    image: { url: IMAGE.keychain, alt: 'Small knotted cotton piece with a soft tassel' },
    description:
      'Three slim knotted bookmarks with tasseled ends, in ocean-inspired blues and sand. A small gift for the reader in your life (or for you).',
    details: 'Materials: cotton string\nSize: each approx. 1.5 × 10 in (4 × 25 cm) including tassel\nSet of 3',
    variants: [{ title: 'Default', sku: 'DEMO-COVE', price: 1400, stock: 15, weight: 40 }],
  },
]

/** Adds the demo categories that do not exist yet. Returns how many were created. */
export async function ensureDemoCategories(db) {
  const existing = unwrap(
    await db.from('categories').select('slug').in('slug', DEMO_CATEGORIES.map((category) => category.slug)),
    'load categories',
  )
  const existingSlugs = new Set(existing.map((row) => row.slug))
  const missing = DEMO_CATEGORIES.filter((category) => !existingSlugs.has(category.slug))
  if (missing.length > 0) unwrap(await db.from('categories').insert(missing), 'insert demo categories')
  return missing.length
}

/** Inserts the demo products with their variants and images. */
export async function insertDemoProducts(db, clock) {
  const categories = unwrap(await db.from('categories').select('id, slug'), 'load categories')
  const categoryIds = new Map(categories.map((category) => [category.slug, category.id]))

  const productRows = []
  const variantRows = []
  const imageRows = []

  for (const product of DEMO_PRODUCTS) {
    const productId = demoId(`product:${product.slug}`)
    const createdAt = toIso(clock.daysAgo(product.createdDaysAgo))
    const updatedAt = toIso(clock.daysAgo(product.retiredDaysAgo ?? product.createdDaysAgo))

    productRows.push({
      id: productId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      details: product.details,
      category_id: categoryIds.get(product.category) ?? null,
      status: product.status,
      is_featured: product.featured,
      badge: product.badge,
      tags: [DEMO_TAG, ...product.tags],
      created_at: createdAt,
      updated_at: updatedAt,
    })

    product.variants.forEach((variant, position) => {
      variantRows.push({
        id: demoId(`variant:${variant.sku}`),
        product_id: productId,
        title: variant.title,
        sku: variant.sku,
        price_cents: variant.price,
        compare_at_price_cents: variant.compareAt ?? null,
        inventory_quantity: variant.stock,
        track_inventory: variant.tracked ?? true,
        weight_grams: variant.weight,
        position,
        created_at: createdAt,
        updated_at: updatedAt,
      })
    })

    imageRows.push({
      id: demoId(`image:${product.slug}`),
      product_id: productId,
      url: product.image.url,
      storage_path: null,
      alt_text: product.image.alt,
      position: 0,
      created_at: createdAt,
    })
  }

  unwrap(await db.from('products').insert(productRows), 'insert demo products')
  unwrap(await db.from('product_variants').insert(variantRows), 'insert demo variants')
  unwrap(await db.from('product_images').insert(imageRows), 'insert demo images')
  return { products: productRows.length, variants: variantRows.length, images: imageRows.length }
}

/**
 * Loads the sellable products demo orders can contain: the starter products
 * plus active or archived demo products, in a fixed order so reruns match.
 */
export async function loadProductPool(db) {
  const orderedSlugs = [...Object.keys(STARTER_PRODUCTS), ...DEMO_PRODUCTS.map((product) => product.slug)]
  const rows = unwrap(
    await db
      .from('products')
      .select(
        'id, slug, name, status, category:categories(slug), images:product_images(url, position), variants:product_variants(id, title, sku, price_cents, position, is_active)',
      )
      .in('slug', orderedSlugs)
      .in('status', ['active', 'archived']),
    'load product pool',
  )

  const demoBySlug = new Map(DEMO_PRODUCTS.map((product) => [product.slug, product]))

  return rows
    .map((row) => {
      const meta = demoBySlug.get(row.slug) ?? STARTER_PRODUCTS[row.slug]
      const images = [...row.images].sort((a, b) => a.position - b.position)
      const variants = row.variants
        .filter((variant) => variant.is_active)
        .sort((a, b) => a.position - b.position)
        .map((variant) => ({ id: variant.id, title: variant.title, sku: variant.sku, priceCents: variant.price_cents }))
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        status: row.status,
        categorySlug: row.category?.slug ?? null,
        imageUrl: images[0]?.url ?? null,
        variants,
        popularity: meta.popularity,
        smallItem: Boolean(meta.smallItem),
        bulky: Boolean(meta.bulky),
        createdDaysAgo: meta.createdDaysAgo ?? Infinity,
        retiredDaysAgo: meta.retiredDaysAgo ?? 0,
      }
    })
    .filter((product) => product.variants.length > 0 && product.popularity > 0)
    .sort((a, b) => orderedSlugs.indexOf(a.slug) - orderedSlugs.indexOf(b.slug))
}
