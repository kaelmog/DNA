import 'server-only'

import type { CheckoutMode } from '@/lib/checkout/types'
import { isStripeConfigured, isSupabaseAdminConfigured } from '@/lib/env.server'

/**
 * Manual payments: until Stripe keys are added, customers place their order on
 * /checkout without paying, and the owner emails them payment details. The
 * owner then uses "Mark as paid" on the order in the admin area.
 *
 * STORE OWNER: edit the sentences below to describe how you take payment. They
 * appear on the checkout page, on the order confirmation page and in the
 * "we have received your order" email. Each string becomes its own paragraph.
 */
export const MANUAL_PAYMENT_INSTRUCTIONS: string[] = [
  'No payment is taken on this website yet.',
  'After you place your order we will email you within one business day with payment details (bank transfer or PayPal).',
  'Your pieces are reserved for you for 7 days while we wait for payment.',
  'We ship as soon as payment is received.',
]

/** One short line shown under the checkout button in the bag. Keep it in line with the text above. */
export const MANUAL_PAYMENT_SUMMARY = 'Pay by bank transfer or PayPal after ordering.'

/** True when orders are paid outside the website because Stripe is not configured. */
export function isManualPaymentMode() {
  return !isStripeConfigured
}

/** Which checkout the storefront offers. Server-only: the cart page passes the result to the browser. */
export function getCheckoutMode(): CheckoutMode {
  if (!isSupabaseAdminConfigured) return 'unavailable'
  return isManualPaymentMode() ? 'manual' : 'stripe'
}
