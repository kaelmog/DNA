import 'server-only'

import { findUsableDiscount } from '@/lib/checkout/discounts'
import type { CheckoutLineInput } from '@/lib/checkout/types'
import { MAX_CART_QUANTITY } from '@/lib/constants'
import { getCartVariants, type CartVariantInfo } from '@/lib/data/catalog'
import { calculateTotals, type OrderTotals, type ShippingSettings } from '@/lib/pricing'
import { createAdminClient } from '@/lib/supabase/admin'
import type { DiscountCode, Order } from '@/lib/types'

/**
 * The steps every way of placing an order shares (Stripe Checkout and manual
 * payment):
 *   1. merge repeated lines and re-read every price and stock level from the
 *      database (never trust the browser),
 *   2. validate the discount code and compute totals with lib/pricing.ts,
 *   3. create a pending order, which reserves stock atomically (create_pending_order).
 * Once step 3 succeeds the caller owns the reservation: if anything after it
 * fails, it must cancel the order so the database trigger returns the stock.
 */

export interface PricedLine {
  variant: CartVariantInfo
  quantity: number
}

/** `field: 'discountCode'` tells the shopper's browser to drop the applied code. */
export type StepFailure = { ok: false; message: string; field?: 'discountCode' }
export type Step<T> = { ok: true; value: T } | StepFailure

export interface PreparedOrder {
  lines: PricedLine[]
  totals: OrderTotals
  /** The code to store on the order, or null when there is none or it saves nothing. */
  discountCode: string | null
  shippingMethod: string
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function describe(variant: { productName: string; variantTitle: string | null }) {
  return variant.variantTitle ? `“${variant.productName}” (${variant.variantTitle})` : `“${variant.productName}”`
}

/** Combines repeated variant ids into one line each. */
function mergeLines(lines: CheckoutLineInput[]) {
  const quantities = new Map<string, number>()
  for (const line of lines) {
    quantities.set(line.variantId, (quantities.get(line.variantId) ?? 0) + line.quantity)
  }
  return quantities
}

/** Pairs each requested line with its live database price, checking availability and stock. */
async function priceLines(quantities: Map<string, number>): Promise<Step<PricedLine[]>> {
  const variants = await getCartVariants([...quantities.keys()])
  const byId = new Map(variants.map((variant) => [variant.variantId, variant]))
  const priced: PricedLine[] = []

  for (const [variantId, quantity] of quantities) {
    const variant = byId.get(variantId)
    if (!variant) {
      return { ok: false, message: 'One of the items in your bag is no longer available. Please review your bag.' }
    }
    if (!variant.available) {
      return { ok: false, message: `${describe(variant)} is no longer available. Please remove it from your bag.` }
    }
    if (quantity > MAX_CART_QUANTITY) {
      return { ok: false, message: `You can buy up to ${MAX_CART_QUANTITY} of ${describe(variant)}.` }
    }
    if (variant.maxQuantity !== null && quantity > variant.maxQuantity) {
      return { ok: false, message: `Only ${variant.maxQuantity} of ${describe(variant)} left in stock. Please update your bag.` }
    }
    priced.push({ variant, quantity })
  }
  return { ok: true, value: priced }
}

async function loadDiscount(code: string | null, subtotalCents: number, currency: string): Promise<Step<DiscountCode | null>> {
  if (!code) return { ok: true, value: null }
  const lookup = await findUsableDiscount(code, subtotalCents, currency)
  return lookup.ok ? { ok: true, value: lookup.discount } : { ok: false, message: lookup.message, field: 'discountCode' }
}

/** Steps 1 and 2: live prices, a validated discount and the order totals. */
export async function prepareOrder(
  request: { lines: CheckoutLineInput[]; discountCode: string | null },
  settings: ShippingSettings & { currency: string },
): Promise<Step<PreparedOrder>> {
  const pricedStep = await priceLines(mergeLines(request.lines))
  if (!pricedStep.ok) return pricedStep
  const lines = pricedStep.value

  const subtotalCents = lines.reduce((sum, line) => sum + line.variant.priceCents * line.quantity, 0)
  const discountStep = await loadDiscount(request.discountCode, subtotalCents, settings.currency)
  if (!discountStep.ok) return discountStep
  const discount = discountStep.value

  const totals = calculateTotals(subtotalCents, settings, discount)
  return {
    ok: true,
    value: {
      lines,
      totals,
      discountCode: totals.discountCents > 0 && discount ? discount.code : null,
      shippingMethod: totals.shippingCents === 0 ? 'Free shipping' : 'Standard shipping',
    },
  }
}

/**
 * Turns create_pending_order errors ("INSUFFICIENT_STOCK:<variant id>") into
 * friendly messages. Returns null for errors the shopper cannot act on.
 */
function describeReservationError(message: string, lines: PricedLine[]) {
  const match = /(INSUFFICIENT_STOCK|VARIANT_UNAVAILABLE):([0-9a-f-]{36})/i.exec(message)
  const variant = match ? lines.find((line) => line.variant.variantId === match[2])?.variant : undefined
  const name = variant ? describe(variant) : 'One of the items in your bag'

  if (match?.[1] === 'INSUFFICIENT_STOCK') return `Sorry, ${name} just sold out or has fewer left than you asked for.`
  if (match?.[1] === 'VARIANT_UNAVAILABLE') return `Sorry, ${name} is no longer available.`
  if (message.includes('EMPTY_CART')) return 'Your bag is empty.'
  return null
}

export interface ReserveInput {
  order: PreparedOrder
  currency: string
  note: string | null
  /** Resolved on the server: the signed-in user (if any) and the email to contact. */
  buyer: { userId: string | null; email: string | null }
}

/**
 * Step 3: creates the pending order and reserves its stock in one database
 * transaction. `fallbackMessage` is shown for unexpected database errors.
 */
export async function reservePendingOrder(
  input: ReserveInput,
  fallbackMessage: string,
): Promise<Step<Pick<Order, 'id' | 'order_number'>>> {
  const { lines, totals, discountCode, shippingMethod } = input.order
  const { data, error } = await createAdminClient()
    .rpc('create_pending_order', {
      p_order: {
        user_id: input.buyer.userId,
        email: input.buyer.email,
        currency: input.currency,
        subtotal_cents: totals.subtotalCents,
        discount_cents: totals.discountCents,
        shipping_cents: totals.shippingCents,
        tax_cents: 0, // Stripe Tax (when enabled) adds tax; the webhook stores the final amount.
        total_cents: totals.totalCents,
        discount_code: discountCode,
        shipping_method: shippingMethod,
        customer_note: input.note,
      },
      p_items: lines.map(({ variant, quantity }) => ({
        variant_id: variant.variantId,
        product_name: variant.productName,
        variant_title: variant.variantTitle,
        sku: variant.sku,
        image_url: variant.imageUrl,
        unit_price_cents: variant.priceCents,
        quantity,
      })),
    })
    .single<Pick<Order, 'id' | 'order_number'>>()

  if (error || !data) {
    const message = error?.message ?? 'no order returned'
    const friendly = describeReservationError(message, lines)
    if (!friendly) console.error('[checkout] create_pending_order failed', message)
    return { ok: false, message: friendly ?? fallbackMessage }
  }
  return { ok: true, value: data }
}
