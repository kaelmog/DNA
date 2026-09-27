/**
 * Types shared by the cart UI (client) and the checkout server code.
 * This file has no runtime code, so client components can import it safely.
 */
import type { ActionState } from '@/lib/actions'
import type { DiscountType, StoreSettings } from '@/lib/types'

/**
 * How the storefront takes orders, decided on the server from the env vars:
 * - 'stripe': the cart sends shoppers to Stripe's hosted checkout,
 * - 'manual': no Stripe keys yet, so /checkout collects the address and the
 *   owner arranges payment by email (see lib/checkout/manual-payment.ts),
 * - 'unavailable': the database secret key is missing, so no orders can be placed.
 */
export type CheckoutMode = 'stripe' | 'manual' | 'unavailable'

/** The store settings the cart needs to estimate totals. */
export type CartPricingSettings = Pick<
  StoreSettings,
  'currency' | 'flat_shipping_cents' | 'free_shipping_threshold_cents' | 'stripe_tax_enabled'
>

/** One cart line as sent to `startCheckout`. Prices are never sent: the server reads them. */
export interface CheckoutLineInput {
  variantId: string
  quantity: number
}

export interface CheckoutRequest {
  lines: CheckoutLineInput[]
  discountCode?: string | null
  note?: string | null
}

/**
 * Result of `startCheckout`. On success the browser goes to Stripe's hosted page.
 * `field: 'discountCode'` tells the cart to drop the applied code.
 */
export type CheckoutResult = { ok: true; url: string } | { ok: false; message: string; field?: 'discountCode' }

/** A discount code the shopper applied in the cart (only the rule, never usage limits). */
export interface AppliedDiscount {
  code: string
  discount_type: DiscountType
  value: number
}

export type DiscountResult = ({ ok: true; message: string } & AppliedDiscount) | { ok: false; message: string }

/** What the manual checkout form sends to `placeOrder`. Prices are never sent. */
export interface ManualOrderInput extends CheckoutRequest {
  contact: { email: string; fullName: string; phone?: string | null }
  shipping: {
    line1: string
    line2?: string | null
    city: string
    state?: string | null
    postalCode: string
    /** Two-letter code, e.g. "US". */
    country: string
  }
  /** Honeypot: people never see it, so it must stay empty. */
  website?: string
}

/**
 * Result of `placeOrder`. Field errors are keyed by the input names above
 * ("email", "line1", "country"...). On success the browser goes to the
 * confirmation page for `orderId`.
 */
export interface PlaceOrderState extends ActionState {
  orderId?: string
  /** The applied discount code was rejected, so the browser should forget it. */
  discountRejected?: boolean
}

/** A shipping country option for the checkout form. */
export interface CheckoutCountry {
  code: string
  name: string
}
