/**
 * The shopping cart, stored in the browser's localStorage so guests can shop
 * without an account. Components read it through the `useCart()` hook.
 *
 * Prices stored here are only for display. The checkout server action always
 * re-reads prices and stock from the database.
 */
import { MAX_CART_QUANTITY } from '@/lib/constants'

export interface CartLine {
  variantId: string
  productId: string
  slug: string
  name: string
  /** null for single-variant products. */
  variantTitle: string | null
  imageUrl: string | null
  unitPriceCents: number
  quantity: number
  /** Stock limit when the line was added; null = not tracked. */
  maxQuantity: number | null
}

const STORAGE_KEY = 'knotted-cart-v1'
const EMPTY: CartLine[] = []

let cachedLines: CartLine[] | null = null
const listeners = new Set<() => void>()

function clampQuantity(quantity: number, maxQuantity: number | null) {
  const limit = Math.min(MAX_CART_QUANTITY, maxQuantity ?? MAX_CART_QUANTITY)
  return Math.max(0, Math.min(Math.floor(quantity), limit))
}

function isCartLine(value: unknown): value is CartLine {
  const line = value as CartLine
  return (
    typeof line === 'object' &&
    line !== null &&
    typeof line.variantId === 'string' &&
    typeof line.productId === 'string' &&
    typeof line.name === 'string' &&
    typeof line.unitPriceCents === 'number' &&
    typeof line.quantity === 'number'
  )
}

function readLines(): CartLine[] {
  if (cachedLines) return cachedLines
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    cachedLines = Array.isArray(parsed) ? parsed.filter(isCartLine) : []
  } catch {
    cachedLines = []
  }
  return cachedLines
}

function writeLines(lines: CartLine[]) {
  cachedLines = lines.filter((line) => line.quantity > 0)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedLines))
  } catch {
    // Storage can be unavailable (private mode, quota). The cart still works for this page view.
  }
  listeners.forEach((listener) => listener())
}

export const cartStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      cachedLines = null // another tab changed the cart
      listener()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  },

  getSnapshot: readLines,

  /** The server has no cart; this keeps server and first client render identical. */
  getServerSnapshot: () => EMPTY,

  /** Adds a line or increases its quantity. Returns the resulting quantity. */
  add(line: Omit<CartLine, 'quantity'>, quantity = 1) {
    const lines = readLines()
    const existing = lines.find((item) => item.variantId === line.variantId)
    const nextQuantity = clampQuantity((existing?.quantity ?? 0) + quantity, line.maxQuantity)
    writeLines(
      existing
        ? lines.map((item) => (item.variantId === line.variantId ? { ...item, ...line, quantity: nextQuantity } : item))
        : [...lines, { ...line, quantity: nextQuantity }],
    )
    return nextQuantity
  },

  setQuantity(variantId: string, quantity: number) {
    writeLines(
      readLines().map((item) =>
        item.variantId === variantId ? { ...item, quantity: clampQuantity(quantity, item.maxQuantity) } : item,
      ),
    )
  },

  remove(variantId: string) {
    writeLines(readLines().filter((item) => item.variantId !== variantId))
  },

  /** Replaces lines, e.g. after refreshing prices and stock from the server. */
  replace(lines: CartLine[]) {
    writeLines(lines)
  },

  clear() {
    writeLines([])
  },
}
