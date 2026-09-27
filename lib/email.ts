import 'server-only'

import { siteUrl } from '@/lib/env'
import { isEmailConfigured, serverEnv } from '@/lib/env.server'

export interface EmailMessage {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

/**
 * Sends an email through Resend's HTTP API. When RESEND_API_KEY / EMAIL_FROM
 * are missing it logs and returns false instead of throwing, so a missing email
 * setup never breaks checkout or forms.
 */
export async function sendEmail(message: EmailMessage) {
  if (!isEmailConfigured) {
    console.info(`[email] skipped (not configured): "${message.subject}"`)
    return false
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serverEnv.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: serverEnv.emailFrom,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo,
      }),
    })
    if (!response.ok) {
      console.error('[email] send failed', response.status, await response.text())
      return false
    }
    return true
  } catch (error) {
    console.error('[email] send failed', error)
    return false
  }
}

/** Sends to ADMIN_NOTIFICATION_EMAIL if it is set. */
export async function notifyAdmin(subject: string, html: string, replyTo?: string) {
  if (!serverEnv.adminNotificationEmail) return false
  return sendEmail({ to: serverEnv.adminNotificationEmail, subject, html, replyTo })
}

/** Escapes user-provided text before putting it in email HTML. */
export function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Wraps email body HTML in a simple, email-client-safe branded layout.
 * `bodyHtml` must already be escaped wherever it contains user input.
 */
export function emailLayout(title: string, bodyHtml: string) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f8f5ef;font-family:Helvetica,Arial,sans-serif;color:#2d2925;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px;">
          <tr><td style="font-family:Georgia,serif;font-size:28px;color:#332720;padding-bottom:24px;">knotted<span style="color:#b86e4a;">.</span></td></tr>
          <tr><td style="font-family:Georgia,serif;font-size:22px;color:#332720;padding-bottom:16px;">${escapeHtml(title)}</td></tr>
          <tr><td style="font-size:15px;line-height:1.6;">${bodyHtml}</td></tr>
          <tr><td style="padding-top:32px;font-size:12px;color:#8b7e72;">
            <a href="${siteUrl}" style="color:#a45d3b;">${siteUrl.replace(/^https?:\/\//, '')}</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}
