import type { Metadata } from 'next'

import { CategoryTiles } from '@/components/shop/home/category-tiles'
import { CustomWorkCta } from '@/components/shop/home/custom-work-cta'
import { FeaturedProducts } from '@/components/shop/home/featured-products'
import { Hero } from '@/components/shop/home/hero'
import { StoreJsonLd } from '@/components/shop/home/store-json-ld'
import { StorySection } from '@/components/shop/home/story-section'
import { TrustStrip } from '@/components/shop/home/trust-strip'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/constants'
import { getCategories, getProductListings } from '@/lib/data/catalog'
import { getStoreSettings } from '@/lib/data/settings'
import { getWishlistProductIds } from '@/lib/data/wishlist'

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} — Handmade Macrame Wall Hangings & Plant Hangers` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
}

const HOME_PRODUCT_COUNT = 8

/** Featured pieces, or the newest ones when nothing is marked as featured yet. */
async function getHomeProducts() {
  const featured = await getProductListings({ featured: true, pageSize: HOME_PRODUCT_COUNT })
  if (featured.items.length > 0) return featured.items
  const newest = await getProductListings({ pageSize: HOME_PRODUCT_COUNT })
  return newest.items
}

export default async function HomePage() {
  const [products, categories, settings, wishlistIds] = await Promise.all([
    getHomeProducts(),
    getCategories(),
    getStoreSettings(),
    getWishlistProductIds(),
  ])

  return (
    <>
      <StoreJsonLd settings={settings} />
      <Hero />
      <TrustStrip settings={settings} />
      <FeaturedProducts products={products} wishlistIds={wishlistIds} />
      <CategoryTiles categories={categories} />
      <CustomWorkCta />
      <StorySection />
    </>
  )
}
