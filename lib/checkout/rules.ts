/**
 * Checkout limits and formats shared by the cart (client) and the server.
 * Kept dependency-free so it adds almost nothing to the browser bundle.
 */

/** Same rule as the `discount_codes.code` check constraint in supabase/schema.sql. */
export const DISCOUNT_CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/

/** Matches the `orders.customer_note` length limit. */
export const MAX_ORDER_NOTE_LENGTH = 1000

/** Different items allowed in one order. */
export const MAX_CHECKOUT_LINES = 50

/** ISO 3166-1 alpha-2 country code, as stored in `store_settings.allowed_shipping_countries`. */
export const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/

/** Same loose rule as the account profile form: digits, spaces and + ( ) . - */
export const PHONE_PATTERN = /^[+()\d\s.-]{6,40}$/

/** Normalises what the shopper typed ("  summer10 " -> "SUMMER10"). */
export function normalizeDiscountCode(value: string) {
  return value.trim().toUpperCase()
}
