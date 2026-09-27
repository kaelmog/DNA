import 'server-only'

import { after } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { shippingCountryCodes } from '@/lib/checkout/countries'
import { cancelPendingOrder, getOrderWithItems } from '@/lib/checkout/orders'
import { errorMessage, prepareOrder, reservePendingOrder } from '@/lib/checkout/order-steps'
import type { ParsedManualOrder } from '@/lib/checkout/schemas'
import { getStoreSettings } from '@/lib/data/settings'
import { notifyAdmin, sendEmail } from '@/lib/email'
import { adminNewOrderEmail, orderReceivedEmail } from '@/lib/emails/order-emails'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Order, ShippingAddress } from '@/lib/types'

/**
 * Places an order without taking payment (manual-payment mode, no Stripe):
 *   1-3. price the bag, validate the discount and reserve stock in a pending
 *        order (shared with Stripe Checkout, see order-steps.ts),
 *   4.   save the contact details and shipping address on that order,
 *   5.   email the customer ("order received" + payment instructions) and the owner.
 * The order stays 'pending' (awaiting payment) with no Stripe session until the
 * owner marks it as paid in the admin area.
 */

const GENERIC_ERROR = 'We couldn’t place your order. Please try again in a moment.'

export type ManualOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; message: string; field?: 'discountCode' | 'country' }

type CustomerDetails = Pick<
  Order,
  'email' | 'customer_name' | 'phone' | 'shipping_address' | 'shipping_method' | 'customer_note'
>

function toShippingAddress({ contact, shipping }: ParsedManualOrder): ShippingAddress {
  return {
    name: contact.fullName,
    line1: shipping.line1,
    line2: shipping.line2,
    city: shipping.city,
    state: shipping.state,
    postal_code: shipping.postalCode,
    country: shipping.country,
  }
}

/** create_pending_order only stores the basics, so the rest is written right after it. */
async function saveCustomerDetails(orderId: string, details: CustomerDetails) {
  const { error } = await createAdminClient().from('orders').update(details).eq('id', orderId)
  if (error) console.error('[checkout] saving manual order details failed', orderId, error.message)
  return !error
}

/** An order without an address cannot be shipped: cancel it so the trigger returns the stock. */
async function releaseOrder(orderId: string) {
  try {
    await cancelPendingOrder(orderId, 'Order details could not be saved')
  } catch (error) {
    console.error('[checkout] could not release reserved stock', orderId, errorMessage(error))
  }
}

/** "Order received" to the customer and a heads-up to the owner. Never throws. */
async function sendOrderReceivedEmails(orderId: string) {
  try {
    const [order, settings] = await Promise.all([getOrderWithItems(orderId), getStoreSettings()])
    if (!order) return

    if (order.email) {
      const received = orderReceivedEmail(order, settings)
      await sendEmail({ to: order.email, ...received, replyTo: settings.support_email ?? undefined })
    }
    const notification = adminNewOrderEmail(order, settings)
    await notifyAdmin(notification.subject, notification.html, order.email ?? undefined)
  } catch (error) {
    console.error('[checkout] manual order emails failed', orderId, errorMessage(error))
  }
}

export async function placeManualOrder(request: ParsedManualOrder): Promise<ManualOrderResult> {
  const settings = await getStoreSettings()
  if (!shippingCountryCodes(settings.allowed_shipping_countries).includes(request.shipping.country)) {
    return { ok: false, message: 'Sorry, we don’t ship to that country yet.', field: 'country' }
  }

  const preparedStep = await prepareOrder(request, settings)
  if (!preparedStep.ok) return preparedStep
  const prepared = preparedStep.value

  // The signed-in account (if any) owns the order; guests' orders are linked
  // to their account later by email (see handle_auth_user_change in schema.sql).
  const user = await getCurrentUser()
  const orderStep = await reservePendingOrder(
    {
      order: prepared,
      currency: settings.currency,
      note: request.note,
      buyer: { userId: user?.id ?? null, email: request.contact.email },
    },
    GENERIC_ERROR,
  )
  if (!orderStep.ok) return orderStep
  const orderId = orderStep.value.id

  // From here on stock is reserved: a failure must cancel the order to release it.
  const saved = await saveCustomerDetails(orderId, {
    email: request.contact.email,
    customer_name: request.contact.fullName,
    phone: request.contact.phone,
    shipping_address: toShippingAddress(request),
    shipping_method: prepared.shippingMethod,
    customer_note: request.note,
  })
  if (!saved) {
    await releaseOrder(orderId)
    return { ok: false, message: GENERIC_ERROR }
  }

  // Emails go out after the response, so a slow or failing email service never fails the order.
  after(() => sendOrderReceivedEmails(orderId))
  return { ok: true, orderId }
}
