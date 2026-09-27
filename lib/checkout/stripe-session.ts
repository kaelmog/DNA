import 'server-only'

import type Stripe from 'stripe'

import { FALLBACK_SHIPPING_COUNTRY, validCountryCodes } from '@/lib/checkout/countries'
import type { PricedLine } from '@/lib/checkout/order-steps'
import { siteUrl } from '@/lib/env'
import type { OrderTotals } from '@/lib/pricing'
import { absoluteUrl } from '@/lib/seo'
import { getStripe } from '@/lib/stripe'
import type { StoreSettings } from '@/lib/types'

type AllowedCountry = Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry

/** Stripe requires at least 30 minutes; the extra minute absorbs clock differences. */
const SESSION_LIFETIME_SECONDS = 31 * 60

export interface StripeSessionInput {
  order: { id: string; order_number: number }
  lines: PricedLine[]
  totals: OrderTotals
  shippingMethod: string
  discountCode: string | null
  settings: Pick<StoreSettings, 'currency' | 'allowed_shipping_countries' | 'stripe_tax_enabled'>
  /** Stripe customer for signed-in shoppers, otherwise their email (or nothing for guests). */
  customerId: string | null
  customerEmail: string | null
}

/** Stripe can only show product images it can download: absolute, public https URLs. */
function stripeImages(imageUrl: string | null) {
  if (!imageUrl) return undefined
  try {
    const url = new URL(absoluteUrl(imageUrl))
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    return url.protocol === 'https:' && !isLocal ? [url.toString()] : undefined
  } catch {
    return undefined
  }
}

/** Two-letter country codes from store settings. Falls back to US so a typo never blocks checkout. */
function shippingCountries(codes: string[]): AllowedCountry[] {
  const valid = validCountryCodes(codes)
  if (valid.length) return valid as AllowedCountry[]
  console.warn('[checkout] no valid shipping countries in store settings, defaulting to US')
  return [FALLBACK_SHIPPING_COUNTRY as AllowedCountry]
}

/**
 * The discount was already validated and calculated by us, so Stripe gets a
 * one-off fixed-amount coupon for exactly that amount. This keeps Stripe's
 * total identical to the order total we stored.
 */
async function createOneOffCoupon(input: StripeSessionInput) {
  const coupon = await getStripe().coupons.create(
    {
      amount_off: input.totals.discountCents,
      currency: input.settings.currency,
      duration: 'once',
      max_redemptions: 1,
      name: input.discountCode ?? 'Discount',
    },
    { idempotencyKey: `coupon-${input.order.id}` },
  )
  return coupon.id
}

/**
 * Creates the hosted Stripe Checkout page for a pending order. Every amount
 * comes from the database via `input.lines` and `input.totals`.
 */
export async function createStripeCheckoutSession(input: StripeSessionInput) {
  const { order, settings, totals } = input
  const currency = settings.currency
  const taxBehavior = settings.stripe_tax_enabled ? ('exclusive' as const) : undefined

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = input.lines.map(({ variant, quantity }) => ({
    quantity,
    price_data: {
      currency,
      unit_amount: variant.priceCents,
      tax_behavior: taxBehavior,
      product_data: {
        name: variant.variantTitle ? `${variant.productName} – ${variant.variantTitle}` : variant.productName,
        images: stripeImages(variant.imageUrl),
        metadata: { variant_id: variant.variantId },
      },
    },
  }))

  const discounts = totals.discountCents > 0 ? [{ coupon: await createOneOffCoupon(input) }] : undefined

  const customerFields: Pick<Stripe.Checkout.SessionCreateParams, 'customer' | 'customer_update' | 'customer_email'> =
    input.customerId
      ? // Saving the shipping address on the customer is required for Stripe Tax and handy for repeat orders.
        { customer: input.customerId, customer_update: { shipping: 'auto' } }
      : { customer_email: input.customerEmail ?? undefined }

  return getStripe().checkout.sessions.create(
    {
      mode: 'payment',
      line_items: lineItems,
      discounts,
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            display_name: input.shippingMethod,
            fixed_amount: { amount: totals.shippingCents, currency },
            tax_behavior: taxBehavior,
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 7 },
            },
          },
        },
      ],
      shipping_address_collection: { allowed_countries: shippingCountries(settings.allowed_shipping_countries) },
      phone_number_collection: { enabled: true },
      automatic_tax: { enabled: settings.stripe_tax_enabled },
      ...customerFields,
      client_reference_id: order.id,
      metadata: { order_id: order.id, order_number: String(order.order_number) },
      payment_intent_data: { metadata: { order_id: order.id } },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      // The order id lets the cart release this reservation right away instead of after expiry.
      cancel_url: `${siteUrl}/cart?checkout=cancelled&order=${order.id}`,
      expires_at: Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS,
    },
    { idempotencyKey: `checkout-${order.id}` },
  )
}

/** Best effort: makes an open session unpayable (for example when saving it failed). */
export async function expireStripeSession(sessionId: string) {
  try {
    await getStripe().checkout.sessions.expire(sessionId)
    return true
  } catch (error) {
    console.error('[checkout] could not expire session', error instanceof Error ? error.message : error)
    return false
  }
}
