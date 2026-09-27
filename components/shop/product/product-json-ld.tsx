import { JsonLd } from '@/components/seo/json-ld'
import type { ReviewSummary } from '@/lib/data/reviews'
import { absoluteUrl } from '@/lib/seo'
import type { ProductDetail } from '@/lib/types'

interface ProductJsonLdProps {
  product: ProductDetail
  brand: string
  currency: string
  summary: ReviewSummary
}

/** schema.org prices are decimal strings in the main currency unit: 4600 cents -> "46.00". */
function toSchemaPrice(cents: number) {
  return (cents / 100).toFixed(2)
}

/**
 * Product structured data so search results can show price, stock and rating.
 * One price becomes an Offer; several prices become an AggregateOffer.
 */
export function ProductJsonLd({ product, brand, currency, summary }: ProductJsonLdProps) {
  const url = absoluteUrl(`/products/${product.slug}`)
  const prices = product.variants.map((variant) => variant.price_cents)
  const inStock = product.variants.some((variant) => !variant.track_inventory || variant.inventory_quantity > 0)
  const availability = inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
  const priceCurrency = currency.toUpperCase()
  const lowPrice = Math.min(...prices)
  const highPrice = Math.max(...prices)

  const offers =
    prices.length === 0
      ? undefined
      : lowPrice === highPrice
        ? { '@type': 'Offer', price: toSchemaPrice(lowPrice), priceCurrency, availability, url, itemCondition: 'https://schema.org/NewCondition' }
        : {
            '@type': 'AggregateOffer',
            lowPrice: toSchemaPrice(lowPrice),
            highPrice: toSchemaPrice(highPrice),
            offerCount: prices.length,
            priceCurrency,
            availability,
            url,
          }

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.seo_description || product.description,
        image: product.images.map((image) => absoluteUrl(image.url)),
        sku: product.variants[0]?.sku ?? undefined,
        url,
        brand: { '@type': 'Brand', name: brand },
        ...(product.category ? { category: product.category.name } : {}),
        ...(offers ? { offers } : {}),
        ...(summary.count > 0 && summary.average !== null
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: summary.average,
                reviewCount: summary.count,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      }}
    />
  )
}
