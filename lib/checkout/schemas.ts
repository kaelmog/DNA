/**
 * Validation for cart and checkout input. Everything that arrives from the
 * browser goes through these schemas before it touches the database or Stripe.
 */
import { z } from 'zod'

import {
  COUNTRY_CODE_PATTERN,
  DISCOUNT_CODE_PATTERN,
  MAX_CHECKOUT_LINES,
  MAX_ORDER_NOTE_LENGTH,
  normalizeDiscountCode,
  PHONE_PATTERN,
} from '@/lib/checkout/rules'
import { MAX_CART_QUANTITY } from '@/lib/constants'
import { emailField, optionalText, requiredText, uuidField } from '@/lib/validation'

const INVALID_CODE_MESSAGE = 'That doesn’t look like a valid code.'

export const discountCodeSchema = z
  .string({ error: 'Enter a discount code.' })
  .transform(normalizeDiscountCode)
  .pipe(z.string().regex(DISCOUNT_CODE_PATTERN, INVALID_CODE_MESSAGE))

/** Optional code: missing or blank becomes null. */
const optionalDiscountCodeSchema = z
  .string()
  .nullish()
  .transform((value) => (value ? normalizeDiscountCode(value) : null))
  .refine((value) => value === null || DISCOUNT_CODE_PATTERN.test(value), INVALID_CODE_MESSAGE)

export const checkoutRequestSchema = z.object({
  lines: z
    .array(
      z.object({
        variantId: uuidField,
        quantity: z
          .number()
          .int()
          .min(1, 'Quantity must be at least 1.')
          .max(MAX_CART_QUANTITY, `You can buy up to ${MAX_CART_QUANTITY} of each item.`),
      }),
    )
    .min(1, 'Your bag is empty.')
    .max(MAX_CHECKOUT_LINES, `A single order can hold up to ${MAX_CHECKOUT_LINES} different items.`),
  discountCode: optionalDiscountCodeSchema,
  note: z
    .string()
    .trim()
    .max(MAX_ORDER_NOTE_LENGTH, `Order notes must be ${MAX_ORDER_NOTE_LENGTH} characters or fewer.`)
    .nullish()
    .transform((value) => value || null),
})

export type ParsedCheckoutRequest = z.infer<typeof checkoutRequestSchema>

/**
 * Manual-payment order: the bag plus contact details and a shipping address.
 * Lengths match the `orders` columns. Whether the store ships to `country` is
 * checked on the server against the store settings (see manual-order.ts).
 */
export const manualOrderSchema = checkoutRequestSchema.extend({
  contact: z.object({
    email: emailField,
    fullName: requiredText('Full name', 120),
    phone: optionalText(40).refine((phone) => phone === null || PHONE_PATTERN.test(phone), 'Enter a valid phone number.'),
  }),
  shipping: z.object({
    line1: requiredText('Address', 200),
    line2: optionalText(200),
    city: requiredText('City', 100),
    state: optionalText(100),
    postalCode: requiredText('Postal code', 20),
    country: z
      .string({ error: 'Choose a country.' })
      .trim()
      .toUpperCase()
      .regex(COUNTRY_CODE_PATTERN, 'Choose a country.'),
  }),
})

export type ParsedManualOrder = z.infer<typeof manualOrderSchema>

/**
 * Flattens manual-order issues to the form's field names: contact.email ->
 * "email", shipping.postalCode -> "postalCode", lines.0.quantity -> "lines".
 */
export function manualOrderFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const [section, field] = issue.path
    const nested = (section === 'contact' || section === 'shipping') && field !== undefined
    const key = String(nested ? field : (section ?? 'form'))
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message]
  }
  return fieldErrors
}

/** Cart refresh input: keep only well-formed ids (anything else is treated as "not found"). */
export function sanitizeVariantIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const ids = value.filter((id): id is string => typeof id === 'string' && uuidField.safeParse(id).success)
  return [...new Set(ids)].slice(0, MAX_CHECKOUT_LINES * 2)
}

/** Stripe Checkout Session ids look like "cs_test_a1B2..." or "cs_live_...". */
export function isCheckoutSessionId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 255 && /^cs_[A-Za-z0-9_]+$/.test(value)
}
