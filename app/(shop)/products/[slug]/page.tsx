import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs, type BreadcrumbItem } from '@/components/shop/breadcrumbs'
import { AddToCartForm } from '@/components/shop/product/add-to-cart-form'
import { ProductDetails } from '@/components/shop/product/product-details'
import { ProductGallery } from '@/components/shop/product/product-gallery'
import { ProductJsonLd } from '@/components/shop/product/product-json-ld'
import { ReviewsSection, type ReviewViewer } from '@/components/shop/product/reviews-section'
import { ProductGrid } from '@/components/shop/product-grid'
import { StarRating } from '@/components/shop/star-rating'
import { Container } from '@/components/ui/misc'
import { getCurrentProfile, getCurrentUser } from '@/lib/auth'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/constants'
import { getProductBySlug, getRelatedProducts } from '@/lib/data/catalog'
import { getApprovedReviews, getMyReview, getReviewSummary } from '@/lib/data/reviews'
import { getStoreSettings } from '@/lib/data/settings'
import { getWishlistProductIds } from '@/lib/data/wishlist'
import { isSupabaseConfigured } from '@/lib/env'
import { truncate } from '@/lib/format'
import { absoluteUrl } from '@/lib/seo'
import type { ProductDetail } from '@/lib/types'

import { submitReview } from './actions'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Product not found', robots: { index: false, follow: false } }

  const title = product.seo_title || product.name
  const description =
    product.seo_description || truncate(product.description.replace(/\s+/g, ' ').trim(), 160) || SITE_DESCRIPTION
  const path = `/products/${product.slug}`
  const image = product.images[0]

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_US',
      url: path,
      title,
      description,
      images: image ? [{ url: absoluteUrl(image.url), alt: image.alt_text || product.name }] : (await parent).openGraph?.images,
    },
  }
}

/** Decides which review UI the visitor sees: demo note, sign-in link, their review status, or the form. */
async function getReviewViewer(product: ProductDetail): Promise<ReviewViewer> {
  if (!isSupabaseConfigured) return { kind: 'demo' }

  const [user, profile, myReview] = await Promise.all([getCurrentUser(), getCurrentProfile(), getMyReview(product.id)])
  if (!user) return { kind: 'signed-out', loginHref: `/login?next=${encodeURIComponent(`/products/${product.slug}`)}` }
  if (myReview) return { kind: 'reviewed', review: myReview }
  return {
    kind: 'can-review',
    defaultName: profile?.full_name ?? '',
    action: submitReview.bind(null, product.id, product.slug),
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const [settings, wishlistIds, reviews, summary, viewer, related] = await Promise.all([
    getStoreSettings(),
    getWishlistProductIds(),
    getApprovedReviews(product.id),
    getReviewSummary(product.id),
    getReviewViewer(product),
    getRelatedProducts(product),
  ])

  const productPath = `/products/${product.slug}`
  const categoryHref = product.category ? `/shop?category=${encodeURIComponent(product.category.slug)}` : null
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    ...(product.category && categoryHref ? [{ label: product.category.name, href: categoryHref }] : []),
    { label: product.name, href: productPath },
  ]

  return (
    <>
      <ProductJsonLd product={product} brand={settings.store_name} currency={settings.currency} summary={summary} />

      <Container className="pt-2 pb-4 sm:pt-4">
        <Breadcrumbs items={breadcrumbs} />

        <div className="mt-3 grid grid-cols-1 gap-8 lg:mt-6 lg:grid-cols-2 lg:gap-14">
          <ProductGallery images={product.images} productName={product.name} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              {product.category && categoryHref && (
                <Link href={categoryHref} className="eyebrow inline-flex min-h-10 items-center hover:underline">
                  {product.category.name}
                </Link>
              )}
              {product.badge && (
                <span className="rounded-full bg-sand px-3 py-1 text-[10px] font-semibold tracking-wider text-espresso uppercase">
                  {product.badge}
                </span>
              )}
            </div>

            <h1 className="mt-1 font-serif text-4xl leading-tight tracking-tight wrap-break-word sm:text-5xl">{product.name}</h1>

            <a
              href="#reviews"
              className="mt-2 inline-flex min-h-10 items-center text-sm text-muted-foreground transition-colors hover:text-clay"
            >
              {summary.count > 0 && summary.average !== null ? (
                <StarRating rating={summary.average} count={summary.count} />
              ) : (
                'No reviews yet'
              )}
            </a>

            <div className="mt-5">
              <AddToCartForm
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  imageUrl: product.images[0]?.url ?? null,
                }}
                variants={product.variants.map((variant) => ({
                  id: variant.id,
                  title: variant.title,
                  price_cents: variant.price_cents,
                  compare_at_price_cents: variant.compare_at_price_cents,
                  inventory_quantity: variant.inventory_quantity,
                  track_inventory: variant.track_inventory,
                }))}
                currency={settings.currency}
                lowStockThreshold={settings.low_stock_threshold}
                initialWishlisted={wishlistIds.includes(product.id)}
              />
            </div>

            {product.description && (
              <p className="mt-8 text-base leading-7 whitespace-pre-line wrap-anywhere text-muted-foreground">
                {product.description}
              </p>
            )}

            <div className="mt-8">
              <ProductDetails details={product.details} settings={settings} />
            </div>
          </div>
        </div>

        <div className="mt-14 sm:mt-20">
          <ReviewsSection reviews={reviews} summary={summary} viewer={viewer} />
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="border-t border-border py-14 sm:py-20">
            <p className="eyebrow mb-2">Keep browsing</p>
            <h2 id="related-heading" className="mb-8 font-serif text-3xl tracking-tight sm:text-4xl">
              You may also like
            </h2>
            <ProductGrid products={related} wishlistIds={wishlistIds} />
          </section>
        )}
      </Container>
    </>
  )
}
