import { Star } from 'lucide-react'
import Link from 'next/link'

import { ProductThumbnail } from '@/components/admin/products/product-thumbnail'
import { StatusBadge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { PRODUCT_STATUS } from '@/lib/constants'
import type { AdminProductListItem } from '@/lib/data/admin/catalog'
import { formatDate, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

const editHref = (product: AdminProductListItem) => `/admin/products/${product.id}`

function priceLabel(product: AdminProductListItem, currency: string) {
  const { min_price_cents: min, max_price_cents: max } = product
  if (min === null || max === null) return 'No price'
  return min === max ? formatMoney(min, currency) : `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`
}

/** Stock summary from the listing view (it only counts active variants). */
function inventoryLabel(product: AdminProductListItem): { text: string; className?: string } {
  if (product.variant_count === 0) return { text: 'No active variants', className: 'text-warning' }
  if (product.total_inventory === null) return { text: 'Untracked', className: 'text-muted-foreground' }
  if (product.total_inventory === 0) return { text: 'Out of stock', className: 'text-destructive' }
  return { text: `${product.total_inventory} in stock` }
}

function FeaturedMark() {
  return (
    <span title="Featured on the home page" className="inline-flex text-clay">
      <Star className="size-3.5 fill-current" aria-hidden="true" />
      <span className="sr-only">Featured</span>
    </span>
  )
}

/** Product list: tappable cards on phones, a table from md up. */
export function ProductsTable({ products, currency }: { products: AdminProductListItem[]; currency: string }) {
  return (
    <>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card md:hidden">
        {products.map((product) => {
          const inventory = inventoryLabel(product)
          return (
            <li key={product.id}>
              <Link href={editHref(product)} className="flex gap-3 p-4 hover:bg-muted/40">
                <ProductThumbnail src={product.image_url} alt={product.image_alt || product.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex min-w-0 items-center gap-1.5 font-medium">
                      <span className="truncate">{product.name}</span>
                      {product.is_featured && <FeaturedMark />}
                    </p>
                    <StatusBadge meta={PRODUCT_STATUS[product.status]} />
                  </div>
                  <p className="mt-0.5 text-sm tabular-nums">{priceLabel(product, currency)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <span className={inventory.className}>{inventory.text}</span>
                    {product.category_name && <> · {product.category_name}</>}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="hidden md:block">
        <Table>
          <THead>
            <tr>
              <TH>Product</TH>
              <TH>Status</TH>
              <TH>Category</TH>
              <TH>Price</TH>
              <TH>Inventory</TH>
              <TH>Updated</TH>
              <TH>
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {products.map((product) => {
              const inventory = inventoryLabel(product)
              return (
                <TR key={product.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <ProductThumbnail src={product.image_url} alt={product.image_alt || product.name} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5">
                          <Link href={editHref(product)} className="max-w-64 truncate font-medium hover:text-clay hover:underline">
                            {product.name}
                          </Link>
                          {product.is_featured && <FeaturedMark />}
                        </p>
                        <p className="max-w-64 truncate text-xs text-muted-foreground">/{product.slug}</p>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <StatusBadge meta={PRODUCT_STATUS[product.status]} />
                  </TD>
                  <TD className={cn(!product.category_name && 'text-muted-foreground')}>
                    {product.category_name ?? 'None'}
                  </TD>
                  <TD className="whitespace-nowrap tabular-nums">{priceLabel(product, currency)}</TD>
                  <TD className={cn('whitespace-nowrap', inventory.className)}>{inventory.text}</TD>
                  <TD className="whitespace-nowrap text-muted-foreground">{formatDate(product.updated_at)}</TD>
                  <TD className="text-right">
                    <Link
                      href={editHref(product)}
                      className={buttonVariants({ variant: 'outline', size: 'sm' })}
                      aria-label={`Edit ${product.name}`}
                    >
                      Edit
                    </Link>
                  </TD>
                </TR>
              )
            })}
          </TBody>
        </Table>
      </div>
    </>
  )
}
