import { getCurrentProfile } from '@/lib/auth'
import { getSubscribedForExport } from '@/lib/data/admin/subscribers'

/**
 * GET /admin/subscribers/export: every subscribed address as a CSV download.
 * Route handlers are not protected by the admin layout, so the role is checked
 * here; everyone else gets the same 404 as the rest of the admin area.
 */

/** Spreadsheet apps run cells starting with these characters as formulas ("CSV injection"). */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/

/** One CSV cell: formula-like values get a leading quote, then RFC 4180 quoting where needed. */
function csvCell(value: string) {
  const safe = FORMULA_TRIGGER.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

function toCsv(rows: string[][]) {
  // The byte order mark makes Excel read the file as UTF-8.
  return `﻿${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`
}

export async function GET() {
  const profile = await getCurrentProfile()
  if (profile?.role !== 'admin') return new Response('Not found', { status: 404 })

  const subscribers = await getSubscribedForExport()
  if (!subscribers) {
    return new Response('The subscriber list could not be exported. Please try again.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const csv = toCsv([
    ['email', 'source', 'subscribed_at'],
    ...subscribers.map((subscriber) => [subscriber.email, subscriber.source ?? '', subscriber.created_at]),
  ])
  const today = new Date().toISOString().slice(0, 10)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="subscribers-${today}.csv"`,
      // Personal data: never store it in a shared cache.
      'Cache-Control': 'private, no-store',
    },
  })
}
