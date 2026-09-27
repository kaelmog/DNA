'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Price } from '@/components/shop/price'
import { QuantityStepper } from '@/components/shop/product/quantity-stepper'
import { getStockInfo, type StockInfo } from '@/components/shop/product/stock'
import { VariantPicker } from '@/components/shop/product/variant-picker'
import { WishlistButton } from '@/components/shop/wishlist-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import type { ProductVariant } from '@/lib/types'
import { cn } from '@/lib/utils'

export type PurchasableVariant = Pick<
  ProductVariant,
  'id' | 'title' | 'price_cents' | 'compare_at_price_cents' | 'inventory_quantity' | 'track_inventory'
>

interface AddToCartFormProps {
  product: { id: string; slug: string; name: string; imageUrl: string | null }
  /** Active variants in display order. */
  variants: PurchasableVariant[]
  currency: string
  lowStockThreshold: number
  initialWishlisted: boolean
}

const STOCK_TONE_CLASSES: Record<StockInfo['tone'], string> = {
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
  danger: 'text-destructive',
}

/**
 * Purchase panel: price, variant choice, stock message, quantity and "Add to bag".
 * The cart lives in the browser; prices here are for display only and are
 * re-checked on the server at checkout.
 */
export function AddToCartForm({ product, variants, currency, lowStockThreshold, initialWishlisted }: AddToCartFormProps) {
  const router = useRouter()
  const cart = useCart()
  // Start on the first variant that can actually be bought.
  const [variantId, setVariantId] = useState(
    () => (variants.find((variant) => getStockInfo(variant, lowStockThreshold).available) ?? variants[0])?.id,
  )
  const [quantity, setQuantity] = useState(1)

  const wishlistButton = (
    <WishlistButton
      productId={product.id}
      productName={product.name}
      initialWishlisted={initialWishlisted}
      className="size-12 border border-input bg-card shadow-none hover:bg-accent"
    />
  )

  const variant = variants.find((item) => item.id === variantId) ?? variants[0]
  if (!variant) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted px-4 py-3">
        <p className="text-sm text-muted-foreground">This piece is currently unavailable.</p>
        {wishlistButton}
      </div>
    )
  }

  const stock = getStockInfo(variant, lowStockThreshold)
  const compareAt = variant.compare_at_price_cents
  const savePercent = compareAt && compareAt > variant.price_cents ? Math.round((1 - variant.price_cents / compareAt) * 100) : 0
  const variantTitle = variants.length === 1 || variant.title === 'Default' ? null : variant.title

  function selectVariant(nextId: string) {
    const next = variants.find((item) => item.id === nextId)
    if (!next) return
    setVariantId(nextId)
    // Keep the chosen quantity within the new variant's stock.
    const max = getStockInfo(next, lowStockThreshold).maxQuantity
    setQuantity((current) => Math.max(1, Math.min(current, max)))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!stock.available) return

    const inBagBefore = cart.lines.find((line) => line.variantId === variant.id)?.quantity ?? 0
    const inBagAfter = cart.add(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantTitle,
        imageUrl: product.imageUrl,
        unitPriceCents: variant.price_cents,
        maxQuantity: variant.track_inventory ? variant.inventory_quantity : null,
      },
      quantity,
    )

    if (inBagAfter <= inBagBefore) {
      toast.info('Your bag already holds the most we can sell of this piece.')
      return
    }

    setQuantity(1)
    toast.success('Added to your bag', {
      description: `${product.name}${variantTitle ? ` · ${variantTitle}` : ''} × ${inBagAfter - inBagBefore}`,
      action: { label: 'View bag', onClick: () => router.push('/cart') },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Price
          cents={variant.price_cents}
          compareAtCents={compareAt}
          currency={currency}
          className="text-2xl font-medium tracking-tight"
        />
        {savePercent > 0 && (
          <Badge className="bg-clay/10 font-semibold text-clay-dark ring-clay/20">Save {savePercent}%</Badge>
        )}
      </div>

      {variants.length > 1 && (
        <VariantPicker
          options={variants.map((item) => ({
            id: item.id,
            title: item.title,
            soldOut: !getStockInfo(item, lowStockThreshold).available,
          }))}
          value={variant.id}
          onChange={selectVariant}
        />
      )}

      <div className="grid gap-3">
        <p aria-live="polite" className={cn('flex items-center gap-2 text-sm font-medium', STOCK_TONE_CLASSES[stock.tone])}>
          <span className="size-2 rounded-full bg-current" aria-hidden="true" />
          {stock.label}
        </p>

        <div className="flex items-center gap-3">
          <QuantityStepper
            value={quantity}
            max={Math.max(1, stock.maxQuantity)}
            onChange={setQuantity}
            disabled={!stock.available}
          />
          <Button type="submit" size="lg" className="h-12 min-w-0 flex-1" disabled={!stock.available}>
            {stock.available ? 'Add to bag' : 'Sold out'}
          </Button>
          {wishlistButton}
        </div>
      </div>
    </form>
  )
}
