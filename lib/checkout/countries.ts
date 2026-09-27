/**
 * Shipping countries from store settings. Pure helpers shared by the Stripe
 * session, the manual checkout form and its server-side validation, so the
 * form never offers a country the server would refuse.
 */
import { COUNTRY_CODE_PATTERN } from '@/lib/checkout/rules'

/** Used when the settings list no valid code, so a typo never blocks checkout. */
export const FALLBACK_SHIPPING_COUNTRY = 'US'

/** Clean, unique two-letter codes ("us " -> "US"). May be empty. */
export function validCountryCodes(codes: readonly string[]): string[] {
  const cleaned = codes.map((code) => code.trim().toUpperCase()).filter((code) => COUNTRY_CODE_PATTERN.test(code))
  return [...new Set(cleaned)]
}

/** The countries the store ships to, falling back to the US when none are valid. */
export function shippingCountryCodes(codes: readonly string[]): string[] {
  const valid = validCountryCodes(codes)
  return valid.length ? valid : [FALLBACK_SHIPPING_COUNTRY]
}

/** "DE" -> "Germany". Falls back to the code when the runtime has no region names. */
export function countryName(code: string, locale = 'en') {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}
