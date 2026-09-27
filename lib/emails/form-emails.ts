import 'server-only'

import { emailLayout, escapeHtml } from '@/lib/email'
import { siteUrl } from '@/lib/env'
import { formatDate, formatMoney, truncate } from '@/lib/format'
import type { ContactMessage, CustomRequest } from '@/lib/types'

/**
 * Emails sent by the public forms (custom requests and contact messages).
 * Every value typed by a visitor goes through escapeHtml().
 */

export interface EmailContent {
  subject: string
  html: string
}

export type CustomRequestEmailData = Pick<
  CustomRequest,
  | 'customer_name'
  | 'customer_email'
  | 'phone'
  | 'request_type'
  | 'budget_cents'
  | 'preferred_colors'
  | 'dimensions'
  | 'deadline'
  | 'description'
  | 'reference_image_path'
>

export type ContactEmailData = Pick<ContactMessage, 'name' | 'email' | 'subject' | 'message'>

const labelStyle = 'padding:6px 12px 6px 0;color:#8b7e72;vertical-align:top;white-space:nowrap;'
const valueStyle = 'padding:6px 0;vertical-align:top;'
const buttonStyle =
  'display:inline-block;background:#332720;color:#f8f5ef;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;'

/** A two-column table of label/value rows. Rows with an empty value are skipped. */
function detailsTable(rows: [label: string, value: string | null | undefined][]) {
  const body = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="${labelStyle}">${escapeHtml(label)}</td><td style="${valueStyle}">${escapeHtml(value)}</td></tr>`,
    )
    .join('')
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;margin:8px 0 20px;">${body}</table>`
}

/** Escapes a long message and keeps its line breaks. */
function paragraphText(value: string) {
  return `<p style="white-space:pre-wrap;background:#f8f5ef;border-radius:12px;padding:16px;margin:0 0 24px;">${escapeHtml(value)}</p>`
}

/** Subjects are a single line; collapse any line breaks a visitor typed. */
function subjectText(value: string, maxLength: number) {
  return truncate(value.replace(/\s+/g, ' ').trim(), maxLength)
}

function adminButton(path: string, label: string) {
  return `<p style="margin:0;"><a href="${siteUrl}${path}" style="${buttonStyle}">${escapeHtml(label)}</a></p>`
}

/** Notification to the shop owner about a new made-to-order request. */
export function customRequestAdminEmail(request: CustomRequestEmailData): EmailContent {
  const html = emailLayout(
    'New custom request',
    `<p style="margin:0 0 8px;">${escapeHtml(request.customer_name)} sent a custom request. Reply to this email to answer them directly.</p>
    ${detailsTable([
      ['Name', request.customer_name],
      ['Email', request.customer_email],
      ['Phone', request.phone],
      ['Request', request.request_type],
      ['Budget', request.budget_cents ? formatMoney(request.budget_cents, 'usd') : null],
      ['Colours / mood', request.preferred_colors],
      ['Size', request.dimensions],
      ['Needed by', request.deadline ? formatDate(`${request.deadline}T12:00:00Z`) : null],
      ['Reference image', request.reference_image_path ? 'Attached (view it in the admin area)' : null],
    ])}
    ${paragraphText(request.description)}
    ${adminButton('/admin/requests', 'Open custom requests')}`,
  )

  return {
    subject: `New custom request: ${subjectText(request.request_type, 60)} from ${subjectText(request.customer_name, 60)}`,
    html,
  }
}

/**
 * Only the first name, limited to letters, so the public form cannot be used
 * to send arbitrary text to someone else's inbox.
 */
function safeFirstName(name: string) {
  const firstWord = name.trim().split(/\s+/)[0] ?? ''
  // Letters from any alphabet plus ' and -. ASCII digits and punctuation are dropped, so no links.
  const cleaned = firstWord.replace(/[^A-Za-z'\-À-￿]/g, '').slice(0, 30)
  return cleaned || 'there'
}

/** Short "we received your request" note to the customer. */
export function customRequestCustomerEmail(name: string): EmailContent {
  const html = emailLayout(
    'We received your custom request',
    `<p style="margin:0 0 16px;">Hi ${escapeHtml(safeFirstName(name))},</p>
    <p style="margin:0 0 16px;">Thank you for telling us about your idea. We read every request personally and will get back to you within 2–3 business days with thoughts, a timeline and a quote.</p>
    <p style="margin:0 0 16px;">If you think of anything else, simply reply to this email.</p>
    <p style="margin:0;">Warmly,<br />Knotted Studio</p>`,
  )
  return { subject: 'We received your custom request', html }
}

/** Notification to the shop owner about a new contact form message. */
export function contactAdminEmail(message: ContactEmailData): EmailContent {
  const html = emailLayout(
    'New contact message',
    `<p style="margin:0 0 8px;">Reply to this email to answer ${escapeHtml(message.name)} directly.</p>
    ${detailsTable([
      ['Name', message.name],
      ['Email', message.email],
      ['Subject', message.subject],
    ])}
    ${paragraphText(message.message)}
    ${adminButton('/admin/messages', 'Open messages')}`,
  )

  return {
    subject: `New message: ${subjectText(message.subject || `from ${message.name}`, 80)}`,
    html,
  }
}
