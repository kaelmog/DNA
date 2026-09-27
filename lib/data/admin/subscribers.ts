import 'server-only'

import { ADMIN_PAGE_SIZE, type Tone } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import type { NewsletterSubscriber, SubscriberStatus } from '@/lib/types'

/** Newsletter subscriber queries for the admin area. Callers must check the admin role first. */

export const SUBSCRIBER_STATUS: Record<SubscriberStatus, { label: string; tone: Tone }> = {
  subscribed: { label: 'Subscribed', tone: 'success' },
  unsubscribed: { label: 'Unsubscribed', tone: 'neutral' },
}

const SUBSCRIBER_STATUSES = Object.keys(SUBSCRIBER_STATUS) as SubscriberStatus[]

export type SubscriberFilter = SubscriberStatus | 'all'

/** Rows fetched per request when exporting (the Supabase API default maximum). */
const EXPORT_CHUNK_SIZE = 1000

/** Safety cap so a runaway export cannot loop forever. */
const EXPORT_MAX_ROWS = 200_000

export function parseSubscriberFilter(value: string | undefined): SubscriberFilter {
  return SUBSCRIBER_STATUSES.find((status) => status === value) ?? 'all'
}

/** Escapes LIKE wildcards so a search for "a_b" matches literally. */
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`)
}

/** One page of subscribers, newest first. Search matches the email (contains). */
export async function getSubscribers({
  search,
  status,
  page,
}: {
  search?: string
  status: SubscriberFilter
  page: number
}): Promise<{ items: NewsletterSubscriber[]; total: number; pageCount: number }> {
  const supabase = await createClient()
  const from = (page - 1) * ADMIN_PAGE_SIZE

  let query = supabase.from('newsletter_subscribers').select('*', { count: 'exact' })
  if (status !== 'all') query = query.eq('status', status)

  const term = search?.trim().toLowerCase()
  if (term) query = query.ilike('email', `%${escapeLike(term)}%`)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1)
    .overrideTypes<NewsletterSubscriber[], { merge: false }>()

  if (error) {
    console.error('[admin/subscribers] list failed', error.message)
    return { items: [], total: 0, pageCount: 1 }
  }

  const total = count ?? data.length
  return { items: data, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) }
}

/** Number of subscribers per status, plus "all". */
export async function getSubscriberCounts(): Promise<Record<SubscriberFilter, number>> {
  const supabase = await createClient()
  const results = await Promise.all(
    SUBSCRIBER_STATUSES.map((status) =>
      supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('status', status),
    ),
  )

  const counts = { all: 0 } as Record<SubscriberFilter, number>
  SUBSCRIBER_STATUSES.forEach((status, index) => {
    const { count, error } = results[index]
    if (error) console.error('[admin/subscribers] count failed', error.message)
    counts[status] = count ?? 0
    counts.all += count ?? 0
  })
  return counts
}

export type ExportedSubscriber = Pick<NewsletterSubscriber, 'email' | 'source' | 'created_at'>

/**
 * Every subscribed address, oldest first, fetched in chunks of 1000 because the
 * API caps rows per request. Returns null if any chunk fails, so a partial
 * list is never exported by mistake.
 */
export async function getSubscribedForExport(): Promise<ExportedSubscriber[] | null> {
  const supabase = await createClient()
  const rows: ExportedSubscriber[] = []

  for (let from = 0; from < EXPORT_MAX_ROWS; from += EXPORT_CHUNK_SIZE) {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('email, source, created_at')
      .eq('status', 'subscribed')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + EXPORT_CHUNK_SIZE - 1)
      .overrideTypes<ExportedSubscriber[], { merge: false }>()

    if (error) {
      console.error('[admin/subscribers] export failed', error.message)
      return null
    }

    rows.push(...data)
    if (data.length < EXPORT_CHUNK_SIZE) break
  }

  return rows
}
