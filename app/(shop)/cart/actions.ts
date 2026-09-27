'use server'

import { NOT_CONFIGURED_MESSAGE } from '@/lib/actions'
import { getCurrentUser } from '@/lib/auth'
import { findUsableDiscount } from '@/lib/checkout/discounts'
import { releaseAbandonedCheckout } from '@/lib/checkout/release-checkout'
import { discountCodeSchema, sanitizeVariantIds } from '@/lib/checkout/schemas'
import type { DiscountResult } from '@/lib/checkout/types'
import { getCartVariants, type CartVariantInfo } from '@/lib/data/catalog'
import { getStoreSettings } from '@/lib/data/settings'
import { isStripeConfigured, isSupabaseAdminConfigured } from '@/lib/env.server'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { uuidField } from '@/lib/validation'

/**
 * Cart server actions. The cart itself lives in the browser, so these are
 * read-mostly helpers. Guests can use all of them; nothing here trusts a
 * price or total from the browser.
 */

/** Live prices and stock for the variants in the bag (public catalog data). */
export async function refreshCart(variantIds: unknown): Promise<CartVariantInfo[]> {
  const ids = sanitizeVariantIds(variantIds)
  if (!ids.length) return []
  return getCartVariants(ids)
}

/**
 * Checks a discount code so the cart can show an estimate. Only a valid code
 * reveals its rule; checkout validates the code again against the real subtotal.
 */
export async function applyDiscountCode(code: unknown, subtotalCents: unknown): Promise<DiscountResult> {
  if (!isSupabaseAdminConfigured) return { ok: false, message: NOT_CONFIGURED_MESSAGE }

  const ip = await getClientIp()
  // Tight limit: this endpoint could otherwise be used to guess codes.
  if (!(await rateLimit(`discount:${ip}`, 10, 600))) {
    return { ok: false, message: 'Too many attempts. Please wait a few minutes and try again.' }
  }

  const parsedCode = discountCodeSchema.safeParse(code)
  if (!parsedCode.success) return { ok: false, message: parsedCode.error.issues[0]?.message ?? 'Enter a valid code.' }

  const subtotal = typeof subtotalCents === 'number' && Number.isInteger(subtotalCents) && subtotalCents >= 0 ? subtotalCents : 0
  const settings = await getStoreSettings()
  const lookup = await findUsableDiscount(parsedCode.data, subtotal, settings.currency)
  if (!lookup.ok) return lookup

  const { discount } = lookup
  return {
    ok: true,
    code: discount.code,
    discount_type: discount.discount_type,
    value: discount.value,
    message: `Code ${discount.code} applied.`,
  }
}

/**
 * Runs when the shopper returns from Stripe with "back". Releases the stock
 * held by that unpaid checkout right away (see lib/checkout/release-checkout.ts).
 * Returns true when stock was released, so the cart knows to refresh.
 */
export async function releaseCheckout(orderId: unknown): Promise<boolean> {
  if (!isSupabaseAdminConfigured || !isStripeConfigured) return false

  const parsedId = uuidField.safeParse(orderId)
  if (!parsedId.success) return false

  const ip = await getClientIp()
  if (!(await rateLimit(`release:${ip}`, 20, 600))) return false

  const user = await getCurrentUser()
  return releaseAbandonedCheckout(parsedId.data, user?.id ?? null)
}
