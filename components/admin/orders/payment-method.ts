import type { Order } from '@/lib/types'

/**
 * How an order is paid. Orders placed while Stripe is not set up have no
 * Checkout Session: the customer pays another way (bank transfer, cash...)
 * and the owner confirms it with "Mark as paid".
 */
export type PaymentMethod = 'manual' | 'stripe'

export function orderPaymentMethod(
  order: Pick<Order, 'stripe_checkout_session_id' | 'stripe_payment_intent_id'>,
): PaymentMethod {
  return order.stripe_checkout_session_id || order.stripe_payment_intent_id ? 'stripe' : 'manual'
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  manual: 'Manual payment',
  stripe: 'Card (Stripe)',
}
