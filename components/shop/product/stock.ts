import { MAX_CART_QUANTITY } from '@/lib/constants'
import type { ProductVariant } from '@/lib/types'

export type StockVariant = Pick<ProductVariant, 'inventory_quantity' | 'track_inventory'>

export interface StockInfo {
  label: string
  tone: 'success' | 'warning' | 'info' | 'danger'
  available: boolean
  /** Most a shopper can add in one go: the cart limit, or less when stock is low. */
  maxQuantity: number
}

/** Availability message and purchase limit for one variant. */
export function getStockInfo(variant: StockVariant, lowStockThreshold: number): StockInfo {
  if (!variant.track_inventory) {
    return { label: 'Made to order', tone: 'info', available: true, maxQuantity: MAX_CART_QUANTITY }
  }

  const stock = Math.max(0, variant.inventory_quantity)
  if (stock === 0) return { label: 'Sold out', tone: 'danger', available: false, maxQuantity: 0 }

  const maxQuantity = Math.min(MAX_CART_QUANTITY, stock)
  if (stock <= lowStockThreshold) return { label: `Only ${stock} left`, tone: 'warning', available: true, maxQuantity }
  return { label: 'In stock', tone: 'success', available: true, maxQuantity }
}
