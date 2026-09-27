import 'server-only'

import { checkDiscountCode } from '@/lib/pricing'
import { createAdminClient } from '@/lib/supabase/admin'
import type { DiscountCode } from '@/lib/types'

export type DiscountLookup = { ok: true; discount: DiscountCode } | { ok: false; message: string }

const UNKNOWN_CODE_MESSAGE = 'That code isn’t valid. Please check the spelling.'

/**
 * Loads a discount code and checks it against the cart subtotal.
 * Uses the secret-key client because visitors cannot read `discount_codes`
 * (otherwise anyone could list every code). `code` must already be normalised.
 */
export async function findUsableDiscount(code: string, subtotalCents: number, currency: string): Promise<DiscountLookup> {
  const { data, error } = await createAdminClient()
    .from('discount_codes')
    .select('*')
    .eq('code', code)
    .maybeSingle<DiscountCode>()

  if (error) {
    console.error('[discounts] lookup failed', error.message)
    return { ok: false, message: 'We couldn’t check that code right now. Please try again.' }
  }
  if (!data) return { ok: false, message: UNKNOWN_CODE_MESSAGE }

  const check = checkDiscountCode(data, subtotalCents, currency)
  if (!check.valid) return { ok: false, message: check.reason }
  return { ok: true, discount: data }
}
