/**
 * Pricing rules in one place. Pure functions, so the cart page (estimate) and
 * the checkout server action (source of truth) always agree.
 * Tax is calculated by Stripe at checkout when enabled in store settings.
 */
import { formatMoney } from '@/lib/format'
import type { DiscountCode, StoreSettings } from '@/lib/types'

export type ShippingSettings = Pick<StoreSettings, 'flat_shipping_cents' | 'free_shipping_threshold_cents'>
export type DiscountRule = Pick<DiscountCode, 'discount_type' | 'value'>

export interface OrderTotals {
  subtotalCents: number
  discountCents: number
  shippingCents: number
  totalCents: number
}

export function calculateDiscount(subtotalCents: number, discount: DiscountRule | null | undefined) {
  if (!discount || subtotalCents <= 0) return 0
  const amount =
    discount.discount_type === 'percentage'
      ? Math.round((subtotalCents * discount.value) / 100)
      : discount.value
  return Math.min(amount, subtotalCents)
}

/** Flat rate, free once the (discounted) subtotal reaches the threshold. Empty carts ship free. */
export function calculateShipping(discountedSubtotalCents: number, settings: ShippingSettings) {
  if (discountedSubtotalCents <= 0) return 0
  const threshold = settings.free_shipping_threshold_cents
  if (threshold !== null && discountedSubtotalCents >= threshold) return 0
  return settings.flat_shipping_cents
}

export function calculateTotals(
  subtotalCents: number,
  settings: ShippingSettings,
  discount?: DiscountRule | null,
): OrderTotals {
  const discountCents = calculateDiscount(subtotalCents, discount)
  const shippingCents = calculateShipping(subtotalCents - discountCents, settings)
  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: subtotalCents - discountCents + shippingCents,
  }
}

/** How much more the shopper needs to spend for free shipping, or null if not applicable. */
export function amountUntilFreeShipping(discountedSubtotalCents: number, settings: ShippingSettings) {
  const threshold = settings.free_shipping_threshold_cents
  if (threshold === null || discountedSubtotalCents >= threshold) return null
  return threshold - discountedSubtotalCents
}

export type DiscountCheck = { valid: true } | { valid: false; reason: string }

/** Checks whether a discount code can be used on a cart with this subtotal. */
export function checkDiscountCode(
  code: DiscountCode,
  subtotalCents: number,
  currency = 'usd',
  now = new Date(),
): DiscountCheck {
  if (!code.is_active) return { valid: false, reason: 'This code is no longer active.' }
  if (code.starts_at && new Date(code.starts_at) > now) return { valid: false, reason: 'This code is not active yet.' }
  if (code.ends_at && new Date(code.ends_at) <= now) return { valid: false, reason: 'This code has expired.' }
  if (code.max_redemptions !== null && code.times_redeemed >= code.max_redemptions) {
    return { valid: false, reason: 'This code has reached its usage limit.' }
  }
  if (subtotalCents < code.min_subtotal_cents) {
    return {
      valid: false,
      reason: `Spend ${formatMoney(code.min_subtotal_cents, currency)} or more to use this code.`,
    }
  }
  return { valid: true }
}
