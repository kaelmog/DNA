/**
 * Brings the browser cart in line with live prices and stock from the server.
 * Pure function (no React, no I/O) so it is easy to reason about and test.
 */
import type { CartLine } from '@/lib/cart-store'
import { MAX_CART_QUANTITY } from '@/lib/constants'
import type { CartVariantInfo } from '@/lib/data/catalog'
import { formatMoney } from '@/lib/format'

export interface CartReconciliation {
  /** Updated lines to store. Unavailable lines are kept so the shopper sees what happened. */
  lines: CartLine[]
  /** Variant ids that no longer exist, were unpublished or sold out. They are excluded from checkout. */
  unavailableIds: string[]
  /** Human-readable explanations of price and quantity changes. */
  notices: string[]
  /** True when `lines` differs from the input and should be written back. */
  changed: boolean
}

export function lineLabel(line: Pick<CartLine, 'name' | 'variantTitle'>) {
  return line.variantTitle ? `${line.name} (${line.variantTitle})` : line.name
}

/** Highest quantity the shopper may choose for a line. */
export function lineQuantityLimit(maxQuantity: number | null) {
  return Math.min(MAX_CART_QUANTITY, maxQuantity ?? MAX_CART_QUANTITY)
}

function isSameLine(a: CartLine, b: CartLine) {
  return (
    a.productId === b.productId &&
    a.slug === b.slug &&
    a.name === b.name &&
    a.variantTitle === b.variantTitle &&
    a.imageUrl === b.imageUrl &&
    a.unitPriceCents === b.unitPriceCents &&
    a.quantity === b.quantity &&
    a.maxQuantity === b.maxQuantity
  )
}

export function reconcileCart(lines: CartLine[], variants: CartVariantInfo[], currency: string): CartReconciliation {
  const byId = new Map(variants.map((variant) => [variant.variantId, variant]))
  const unavailableIds: string[] = []
  const notices: string[] = []
  let changed = false

  const nextLines = lines.map((line) => {
    const info = byId.get(line.variantId)
    if (!info || !info.available) {
      unavailableIds.push(line.variantId)
      return line
    }

    const limit = lineQuantityLimit(info.maxQuantity)
    const next: CartLine = {
      ...line,
      productId: info.productId,
      slug: info.slug,
      name: info.productName,
      variantTitle: info.variantTitle,
      imageUrl: info.imageUrl,
      unitPriceCents: info.priceCents,
      maxQuantity: info.maxQuantity,
      // `available` guarantees at least one in stock, so a line never drops to zero here.
      quantity: Math.max(1, Math.min(line.quantity, limit)),
    }

    const label = lineLabel(next)
    if (next.unitPriceCents !== line.unitPriceCents) {
      notices.push(
        `The price of ${label} changed from ${formatMoney(line.unitPriceCents, currency)} to ${formatMoney(next.unitPriceCents, currency)}.`,
      )
    }
    if (next.quantity < line.quantity) {
      notices.push(`Only ${next.quantity} of ${label} can be ordered right now, so we updated your bag.`)
    }

    if (!isSameLine(line, next)) changed = true
    return next
  })

  return { lines: nextLines, unavailableIds, notices, changed }
}

/**
 * Combines the bag a shopper filled as a guest with the bag saved on their
 * account, when they sign in. The same piece in both is added up, within the
 * per-item and stock limits; a line never shrinks below what the account had.
 */
export function mergeCartLines(accountLines: CartLine[], guestLines: CartLine[]): CartLine[] {
  const merged = new Map(accountLines.map((line) => [line.variantId, line]))
  for (const guestLine of guestLines) {
    const accountLine = merged.get(guestLine.variantId)
    if (!accountLine) {
      merged.set(guestLine.variantId, guestLine)
      continue
    }
    const combined = Math.min(accountLine.quantity + guestLine.quantity, lineQuantityLimit(accountLine.maxQuantity))
    merged.set(guestLine.variantId, { ...accountLine, quantity: Math.max(accountLine.quantity, combined) })
  }
  return [...merged.values()]
}
