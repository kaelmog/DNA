import 'server-only'

import { cache } from 'react'

import { ADMIN_PAGE_SIZE, type Tone } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import type { DiscountCode } from '@/lib/types'

/** Discount code queries for the admin area. Callers must run requireAdmin() first. */

/** Whether a code can be used right now, derived from its settings and usage. */
export type DiscountState = 'active' | 'scheduled' | 'expired' | 'used_up' | 'disabled'

export const DISCOUNT_STATE: Record<DiscountState, { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'success' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  expired: { label: 'Expired', tone: 'neutral' },
  used_up: { label: 'Used up', tone: 'warning' },
  disabled: { label: 'Disabled', tone: 'neutral' },
}

/** Mirrors the checks in lib/pricing.ts checkDiscountCode(), in the order an admin cares about. */
export function getDiscountState(code: DiscountCode, now: Date): DiscountState {
  if (!code.is_active) return 'disabled'
  if (code.ends_at && new Date(code.ends_at) <= now) return 'expired'
  if (code.max_redemptions !== null && code.times_redeemed >= code.max_redemptions) return 'used_up'
  if (code.starts_at && new Date(code.starts_at) > now) return 'scheduled'
  return 'active'
}

export interface DiscountListItem extends DiscountCode {
  state: DiscountState
}

/**
 * PostgREST `or` filter value for a "contains" search: LIKE wildcards are
 * escaped, then the pattern is double-quoted so commas or brackets typed by
 * the admin cannot break the filter syntax.
 */
function containsFilter(term: string) {
  const likePattern = `%${term.replace(/[\\%_]/g, (match) => `\\${match}`)}%`
  return `"${likePattern.replace(/["\\]/g, (match) => `\\${match}`)}"`
}

/** One page of discount codes, newest first, each with its derived state. Search matches code or description. */
export async function getDiscountCodes({
  page,
  search,
}: {
  page: number
  search?: string
}): Promise<{ items: DiscountListItem[]; total: number; pageCount: number }> {
  const supabase = await createClient()
  const from = (page - 1) * ADMIN_PAGE_SIZE

  let query = supabase.from('discount_codes').select('*', { count: 'exact' })
  const term = search?.trim()
  if (term) {
    const pattern = containsFilter(term)
    query = query.or(`code.ilike.${pattern},description.ilike.${pattern}`)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1)
    .overrideTypes<DiscountCode[], { merge: false }>()

  if (error) {
    console.error('[admin/discounts] list failed', error.message)
    return { items: [], total: 0, pageCount: 1 }
  }

  const now = new Date()
  const total = count ?? data.length
  return {
    items: data.map((code) => ({ ...code, state: getDiscountState(code, now) })),
    total,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  }
}

/** One discount code, or null. Cached so generateMetadata and the page share one query. */
export const getDiscountCode = cache(async (id: string): Promise<DiscountCode | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from('discount_codes').select('*').eq('id', id).maybeSingle<DiscountCode>()
  if (error) console.error('[admin/discounts] load failed', error.message)
  return data ?? null
})
