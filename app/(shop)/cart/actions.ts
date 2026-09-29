'use server'

import { NOT_CONFIGURED_MESSAGE } from '@/lib/actions'
import { getCurrentUser } from '@/lib/auth'
import type { CartLine } from '@/lib/cart-store'
import { findUsableDiscount } from '@/lib/checkout/discounts'
import { releaseAbandonedCheckout } from '@/lib/checkout/release-checkout'
import { MAX_SAVED_CART_LINES } from '@/lib/checkout/rules'
import { discountCodeSchema, sanitizeVariantIds, savedCartSchema } from '@/lib/checkout/schemas'
import type { DiscountResult } from '@/lib/checkout/types'
import { getCartVariants, type CartVariantInfo } from '@/lib/data/catalog'
import { getStoreSettings } from '@/lib/data/settings'
import { isSupabaseConfigured } from '@/lib/env'
import { isStripeConfigured, isSupabaseAdminConfigured } from '@/lib/env.server'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { uuidField } from '@/lib/validation'

/**
 * Cart server actions. The bag lives in the browser; for signed-in shoppers
 * it is also saved on their account (cart_items). Guests can use everything
 * except the account bag; nothing here trusts a price or total from the browser.
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

/**
 * The signed-in shopper's saved bag, with live product details and prices.
 * Returns null when nobody is signed in or the bag could not be read, so the
 * browser keeps what it has. Pieces that were unpublished or deleted are left out.
 */
export async function getAccountCart(): Promise<CartLine[] | null> {
  if (!isSupabaseConfigured) return null
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cart_items')
    .select('variant_id, quantity')
    .eq('user_id', user.id)
    .order('created_at')
    .limit(MAX_SAVED_CART_LINES)
    .overrideTypes<{ variant_id: string; quantity: number }[], { merge: false }>()

  if (error) {
    console.error('[cart] could not load saved bag', error.code ?? error.message)
    return null
  }

  const variants = new Map((await getCartVariants(data.map((row) => row.variant_id))).map((info) => [info.variantId, info]))
  return data.flatMap((row) => {
    const info = variants.get(row.variant_id)
    if (!info) return []
    return {
      variantId: info.variantId,
      productId: info.productId,
      slug: info.slug,
      name: info.productName,
      variantTitle: info.variantTitle,
      imageUrl: info.imageUrl,
      unitPriceCents: info.priceCents,
      maxQuantity: info.maxQuantity,
      quantity: row.quantity,
    }
  })
}

/**
 * Replaces the signed-in shopper's saved bag with the bag in their browser.
 * Only variant ids and quantities are stored. Returns false when nothing was saved.
 */
export async function saveAccountCart(lines: unknown): Promise<boolean> {
  if (!isSupabaseConfigured) return false
  const user = await getCurrentUser()
  if (!user) return false

  const parsed = savedCartSchema.safeParse(lines)
  if (!parsed.success) return false

  // One row per variant: save_cart cannot upsert the same row twice.
  const quantities = new Map(parsed.data.map((line) => [line.variantId, line.quantity]))
  const supabase = await createClient()
  const { error } = await supabase.rpc('save_cart', {
    p_items: [...quantities].map(([variant_id, quantity]) => ({ variant_id, quantity })),
  })

  if (error) {
    console.error('[cart] could not save bag', error.code ?? error.message)
    return false
  }
  return true
}
