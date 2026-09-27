'use server'

import { revalidatePath } from 'next/cache'

import { actionError, actionSuccess, NOT_CONFIGURED_MESSAGE } from '@/lib/actions'
import { createCheckout } from '@/lib/checkout/create-checkout'
import { getCheckoutMode } from '@/lib/checkout/manual-payment'
import { placeManualOrder } from '@/lib/checkout/manual-order'
import { checkoutRequestSchema, manualOrderFieldErrors, manualOrderSchema } from '@/lib/checkout/schemas'
import type { CheckoutResult, PlaceOrderState } from '@/lib/checkout/types'
import { isStripeConfigured, isSupabaseAdminConfigured } from '@/lib/env.server'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

/**
 * Starts Stripe Checkout for the shopper's bag and returns the hosted page URL.
 * Guests are welcome, so there is no sign-in requirement; the signed-in user
 * (if any) is read on the server inside createCheckout. Only variant ids,
 * quantities, a code and a note are accepted: prices always come from the database.
 */
export async function startCheckout(input: unknown): Promise<CheckoutResult> {
  if (!isSupabaseAdminConfigured) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  if (!isStripeConfigured) {
    return { ok: false, message: 'Payments are not set up yet. The store owner needs to add Stripe keys (see /todo).' }
  }

  const ip = await getClientIp()
  if (!(await rateLimit(`checkout:${ip}`, 20, 600))) {
    return { ok: false, message: 'Too many checkout attempts. Please wait a few minutes and try again.' }
  }

  const parsed = checkoutRequestSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const field = issue?.path[0] === 'discountCode' ? 'discountCode' : undefined
    return { ok: false, message: issue?.message ?? 'Please review your bag and try again.', field }
  }

  return createCheckout(parsed.data)
}

const PLACE_ORDER_ERROR = 'We couldn’t place your order. Please try again in a moment.'

/** Bots fill every input they find, including the hidden "website" field people never see. */
function isHoneypotFilled(input: unknown) {
  const website = typeof input === 'object' && input !== null ? (input as { website?: unknown }).website : undefined
  return typeof website === 'string' && website.length > 0
}

/** Problems with the bag or the code are not tied to an input, so they become the main message. */
function validationMessage(fieldErrors: Record<string, string[]>) {
  return fieldErrors.lines?.[0] ?? fieldErrors.discountCode?.[0] ?? 'Please check the highlighted fields.'
}

/**
 * Places an order without taking payment (manual-payment mode, Stripe not
 * configured). Guests are welcome; the signed-in user (if any) is read on the
 * server. The browser only sends variant ids, quantities, a code, a note and
 * the address: prices, totals and the buyer are always worked out here.
 */
export async function placeOrder(input: unknown): Promise<PlaceOrderState> {
  const mode = getCheckoutMode()
  if (mode === 'unavailable') return actionError(NOT_CONFIGURED_MESSAGE)
  if (mode !== 'manual') return actionError('Please check out from your bag.')

  const ip = await getClientIp()
  if (!(await rateLimit(`order:${ip}`, 10, 600))) {
    return actionError('Too many order attempts. Please wait a few minutes and try again.')
  }

  if (isHoneypotFilled(input)) return actionError(PLACE_ORDER_ERROR)

  const parsed = manualOrderSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = manualOrderFieldErrors(parsed.error)
    return { ...actionError(validationMessage(fieldErrors), fieldErrors), discountRejected: Boolean(fieldErrors.discountCode) }
  }

  const result = await placeManualOrder(parsed.data)
  if (!result.ok) {
    const fieldErrors = result.field === 'country' ? { country: [result.message] } : undefined
    return { ...actionError(result.message, fieldErrors), discountRejected: result.field === 'discountCode' }
  }

  // New pending order and less stock: refresh the admin views that list them.
  revalidatePath('/admin')
  revalidatePath('/admin/orders')
  return { ...actionSuccess('Order placed.'), orderId: result.orderId }
}
