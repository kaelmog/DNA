import 'server-only'

import { emailLayout, escapeHtml } from '@/lib/email'
import { siteUrl } from '@/lib/env'
import { formatMoney, formatOrderNumber } from '@/lib/format'
import type { OrderWithItems, ShippingAddress, StoreSettings } from '@/lib/types'

/**
 * "Your order is on its way" email, sent when an admin marks an order as
 * shipped. Every value that came from a person or the database is escaped.
 */

// Inline styles only: most email clients ignore <style> tags and CSS classes.
const MUTED = 'color:#71665c;'
const BUTTON =
  'display:inline-block;background:#332720;color:#f8f5ef;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600;'

/** Tracking links are validated as https on save; this re-checks before putting one in an href. */
function safeTrackingUrl(url: string | null) {
  if (!url) return null
  try {
    return new URL(url).protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

function trackingHtml(order: OrderWithItems) {
  const trackingUrl = safeTrackingUrl(order.tracking_url)
  const details = [
    order.carrier ? `Carrier: <strong>${escapeHtml(order.carrier)}</strong>` : '',
    order.tracking_number ? `Tracking number: <strong>${escapeHtml(order.tracking_number)}</strong>` : '',
  ].filter(Boolean)

  if (!details.length && !trackingUrl) return ''

  return `
    <p style="margin:0 0 8px;">${details.join('<br>')}</p>
    ${trackingUrl ? `<p style="margin:16px 0 24px;"><a href="${escapeHtml(trackingUrl)}" style="${BUTTON}">Track your package</a></p>` : ''}`
}

function itemsHtml(order: OrderWithItems) {
  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #ded8cf;">
          ${escapeHtml(item.product_name)}
          ${item.variant_title ? `<br><span style="${MUTED}font-size:13px;">${escapeHtml(item.variant_title)}</span>` : ''}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #ded8cf;text-align:right;white-space:nowrap;">
          × ${escapeHtml(item.quantity)}
        </td>
      </tr>`,
    )
    .join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;font-size:14px;">${rows}</table>`
}

function addressHtml(address: ShippingAddress | null) {
  if (!address) return ''
  const lines = [
    address.name,
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(', '),
    address.country,
  ].filter(Boolean)

  return `
    <p style="margin:0 0 4px;font-weight:600;">Shipping to</p>
    <p style="margin:0 0 24px;${MUTED}">${lines.map((line) => escapeHtml(line)).join('<br>')}</p>`
}

export function orderShippedEmail(order: OrderWithItems, settings: StoreSettings): { subject: string; html: string } {
  const orderNumber = formatOrderNumber(order.order_number)
  const greeting = order.customer_name ? `Hi ${escapeHtml(order.customer_name.split(' ')[0])},` : 'Hi there,'
  const support = settings.support_email
    ? `Questions? Reply to this email or write to <a href="mailto:${escapeHtml(settings.support_email)}" style="color:#a45d3b;">${escapeHtml(settings.support_email)}</a>.`
    : 'Questions? Just reply to this email.'

  const body = `
    <p style="margin:0 0 16px;">${greeting}</p>
    <p style="margin:0 0 16px;">Good news: order <strong>${escapeHtml(orderNumber)}</strong> has left the studio and is on its way to you.</p>
    ${trackingHtml(order)}
    ${itemsHtml(order)}
    ${addressHtml(order.shipping_address)}
    <p style="margin:0 0 16px;${MUTED}">Order total: ${escapeHtml(formatMoney(order.total_cents, order.currency))}</p>
    <p style="margin:0 0 16px;">
      <a href="${escapeHtml(`${siteUrl}/account/orders`)}" style="color:#a45d3b;">View your orders</a>
      <span style="${MUTED}font-size:13px;">(checked out as a guest? Create an account with this email address to see your order history.)</span>
    </p>
    <p style="margin:0;${MUTED}font-size:13px;">${support}</p>`

  return {
    subject: `Your ${settings.store_name} order ${orderNumber} is on its way`,
    html: emailLayout('Your order is on its way', body),
  }
}
