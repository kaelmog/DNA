import 'server-only'

import { MANUAL_PAYMENT_INSTRUCTIONS } from '@/lib/checkout/manual-payment'
import { emailLayout, escapeHtml } from '@/lib/email'
import { siteUrl } from '@/lib/env'
import { formatDate, formatMoney, formatOrderNumber } from '@/lib/format'
import type { OrderWithItems, ShippingAddress, StoreSettings } from '@/lib/types'

/**
 * Order emails: the confirmation once an order is paid (Stripe webhook or the
 * admin's "Mark as paid"), the "order received" note for manual-payment
 * orders, and the owner's new-order heads-up.
 * Every dynamic value goes through escapeHtml(), including values we wrote
 * ourselves, because product names and addresses originate from people.
 * Inline styles only: most email clients ignore <style> blocks.
 */

interface EmailContent {
  subject: string
  html: string
}

const MUTED = 'color:#8b7e72;'
const CELL = 'padding:10px 0;border-bottom:1px solid #ded8cf;vertical-align:top;'
const LINK = 'color:#a45d3b;'

function paragraph(html: string) {
  return `<p style="margin:0 0 16px;">${html}</p>`
}

function heading(text: string) {
  return `<p style="margin:24px 0 8px;font-weight:bold;">${escapeHtml(text)}</p>`
}

function button(href: string, label: string) {
  return `<p style="margin:24px 0;"><a href="${escapeHtml(href)}" style="display:inline-block;background:#332720;color:#f8f5ef;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;">${escapeHtml(label)}</a></p>`
}

function itemsTable(order: OrderWithItems) {
  const rows = order.items
    .map((item) => {
      const variant = item.variant_title ? `<br><span style="font-size:13px;${MUTED}">${escapeHtml(item.variant_title)}</span>` : ''
      return `<tr>
        <td style="${CELL}">${escapeHtml(item.product_name)}${variant}</td>
        <td style="${CELL}text-align:center;white-space:nowrap;">× ${escapeHtml(item.quantity)}</td>
        <td style="${CELL}text-align:right;white-space:nowrap;">${escapeHtml(formatMoney(item.total_cents, order.currency))}</td>
      </tr>`
    })
    .join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">${rows}</table>`
}

function totalsTable(order: OrderWithItems) {
  const money = (cents: number) => formatMoney(cents, order.currency)
  const rows: [string, string][] = [['Subtotal', money(order.subtotal_cents)]]
  if (order.discount_cents > 0) {
    rows.push([order.discount_code ? `Discount (${order.discount_code})` : 'Discount', `−${money(order.discount_cents)}`])
  }
  rows.push(['Shipping', order.shipping_cents > 0 ? money(order.shipping_cents) : 'Free'])
  if (order.tax_cents > 0) rows.push(['Tax', money(order.tax_cents)])

  const lines = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 0;${MUTED}">${escapeHtml(label)}</td><td style="padding:4px 0;text-align:right;">${escapeHtml(value)}</td></tr>`,
    )
    .join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:8px;">
    ${lines}
    <tr><td style="padding:10px 0 0;font-weight:bold;">Total</td><td style="padding:10px 0 0;text-align:right;font-weight:bold;">${escapeHtml(money(order.total_cents))}</td></tr>
  </table>`
}

function addressLines(address: ShippingAddress | null) {
  if (!address) return paragraph(`<span style="${MUTED}">No shipping address was provided.</span>`)
  const cityLine = [address.city, address.state, address.postal_code].filter(Boolean).join(', ')
  const lines = [address.name, address.line1, address.line2, cityLine, address.country].filter(Boolean)
  return paragraph(lines.map((line) => escapeHtml(line)).join('<br>'))
}

function firstName(order: OrderWithItems) {
  return order.customer_name?.trim().split(/\s+/)[0] ?? ''
}

function greeting(order: OrderWithItems) {
  const name = firstName(order)
  return paragraph(`Hi${name ? ` ${escapeHtml(name)}` : ''},`)
}

function orderLine(order: OrderWithItems, date: string) {
  return paragraph(
    `<span style="${MUTED}">Order</span> <strong>${escapeHtml(formatOrderNumber(order.order_number))}</strong> · <span style="${MUTED}">${escapeHtml(
      formatDate(date),
    )}</span>`,
  )
}

function noteSection(order: OrderWithItems, title: string) {
  return order.customer_note ? heading(title) + paragraph(escapeHtml(order.customer_note)) : ''
}

function supportLine(settings: StoreSettings) {
  const supportEmail = settings.support_email
  return paragraph(
    supportEmail
      ? `Questions? Just reply to this email or write to <a href="mailto:${escapeHtml(supportEmail)}" style="${LINK}">${escapeHtml(supportEmail)}</a>.`
      : 'Questions? Just reply to this email.',
  )
}

function signOff(settings: StoreSettings) {
  return paragraph(`With love,<br>${escapeHtml(settings.store_name)}`)
}

/** Receipt-style confirmation for the customer, sent once the order is paid. */
export function orderConfirmationEmail(order: OrderWithItems, settings: StoreSettings): EmailContent {
  const number = formatOrderNumber(order.order_number)

  const body = [
    greeting(order),
    paragraph(
      'Thank you for your order. Your payment went through and we are getting everything ready. ' +
        'Each piece is knotted or finished by hand, so we will email you again with tracking details as soon as it ships.',
    ),
    orderLine(order, order.paid_at ?? order.created_at),
    itemsTable(order),
    totalsTable(order),
    heading('Shipping to'),
    addressLines(order.shipping_address),
    noteSection(order, 'Your note'),
    order.user_id ? button(`${siteUrl}/account/orders/${order.id}`, 'View your order') : '',
    supportLine(settings),
    signOff(settings),
  ].join('')

  return {
    subject: `Your ${settings.store_name} order ${number} is confirmed`,
    html: emailLayout(`Thank you for your order ${number}`, body),
  }
}

/**
 * Sent right after a manual-payment order is placed: the order is reserved but
 * not paid yet, so it repeats how payment works (MANUAL_PAYMENT_INSTRUCTIONS).
 */
export function orderReceivedEmail(order: OrderWithItems, settings: StoreSettings): EmailContent {
  const number = formatOrderNumber(order.order_number)
  const accountStep = order.user_id
    ? button(`${siteUrl}/account/orders/${order.id}`, 'View your order')
    : paragraph(
        `<a href="${escapeHtml(`${siteUrl}/signup`)}" style="${LINK}">Create an account</a> with this email address to follow this order and future ones.`,
      )

  const body = [
    greeting(order),
    paragraph(
      'Thank you for your order. We have received it and set your pieces aside for you. ' +
        'Nothing has been charged yet: here is how payment works.',
    ),
    heading('How to pay'),
    MANUAL_PAYMENT_INSTRUCTIONS.map((instruction) => paragraph(escapeHtml(instruction))).join(''),
    orderLine(order, order.created_at),
    itemsTable(order),
    totalsTable(order),
    heading('Shipping to'),
    addressLines(order.shipping_address),
    noteSection(order, 'Your note'),
    accountStep,
    supportLine(settings),
    signOff(settings),
  ].join('')

  return {
    subject: `We have received your ${settings.store_name} order ${number}`,
    html: emailLayout(`Thank you for your order ${number}`, body),
  }
}

/**
 * Heads-up for the store owner with everything needed to fulfil the order.
 * Manual-payment orders arrive unpaid, so the email says what to do next.
 */
export function adminNewOrderEmail(order: OrderWithItems, settings: StoreSettings): EmailContent {
  const number = formatOrderNumber(order.order_number)
  const total = formatMoney(order.total_cents, order.currency)
  const awaitingPayment = order.status === 'pending'
  const contact = [
    order.customer_name ? escapeHtml(order.customer_name) : null,
    order.email ? `<a href="mailto:${escapeHtml(order.email)}" style="${LINK}">${escapeHtml(order.email)}</a>` : null,
    order.phone ? escapeHtml(order.phone) : null,
  ]
    .filter(Boolean)
    .join('<br>')

  const intro = awaitingPayment
    ? paragraph(
        `A new order was just placed on ${escapeHtml(settings.store_name)} and is <strong>awaiting payment</strong>. ` +
          'Email the customer your payment details, then use “Mark as paid” on the order once the money arrives.',
      )
    : paragraph(`A new order was just paid on ${escapeHtml(settings.store_name)}.`)

  const body = [
    intro,
    paragraph(`<strong>${escapeHtml(number)}</strong> · ${escapeHtml(total)} · ${escapeHtml(order.shipping_method ?? 'Shipping')}`),
    heading('Customer'),
    paragraph(contact || `<span style="${MUTED}">No contact details</span>`),
    heading('Ship to'),
    addressLines(order.shipping_address),
    noteSection(order, 'Customer note'),
    heading('Items'),
    itemsTable(order),
    totalsTable(order),
    button(`${siteUrl}/admin/orders/${order.id}`, 'Open order in admin'),
  ].join('')

  return {
    subject: `New order ${number} · ${total}${awaitingPayment ? ' · awaiting payment' : ''}`,
    html: emailLayout(`New order ${number}`, body),
  }
}
