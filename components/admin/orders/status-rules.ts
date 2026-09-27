import { ADMIN_ORDER_STATUSES } from '@/lib/constants'
import type { OrderStatus } from '@/lib/types'

/**
 * Which statuses an admin may move an order to. Used by the status form (to
 * show only valid options) and by the server action (to enforce them), so the
 * two can never disagree.
 *
 * - Unpaid (pending) orders can be cancelled here, or marked as paid with the
 *   dedicated "Mark as paid" action (see canMarkAsPaid), which also counts the
 *   discount redemption. The status form never sets "paid" on them directly.
 * - Refunded orders are final; refunds are managed in Stripe.
 * - A cancelled order can be reopened only if it was paid before
 *   (the database takes the returned stock again).
 */
export function allowedStatusTargets(current: OrderStatus, wasPaid: boolean): OrderStatus[] {
  if (current === 'pending') return ['cancelled']
  if (current === 'refunded') return []
  if (current === 'cancelled') return wasPaid ? ADMIN_ORDER_STATUSES.filter((status) => status !== 'cancelled') : []
  return ADMIN_ORDER_STATUSES.filter((status) => status !== current)
}

/** Only orders still awaiting payment can be confirmed as paid by hand. */
export function canMarkAsPaid(current: OrderStatus) {
  return current === 'pending'
}

/** Explains why an order's status cannot be changed (or changed to a given status). */
export function statusChangeBlockedReason(current: OrderStatus, wasPaid: boolean) {
  if (current === 'pending') {
    return 'This order is awaiting payment. Use “Mark as paid” once the money arrives, or cancel it here.'
  }
  if (current === 'refunded') return 'Refunded orders are final. Manage refunds in your Stripe dashboard.'
  if (current === 'cancelled' && !wasPaid) return 'This order was never paid, so it cannot be reopened.'
  return 'That status change is not allowed for this order.'
}

/** Statuses from which "mark as shipped" makes sense (shipped = re-send the tracking email). */
export const SHIPPABLE_STATUSES: OrderStatus[] = ['paid', 'processing', 'shipped']
