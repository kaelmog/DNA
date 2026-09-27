import 'server-only'

import { headers } from 'next/headers'

import { isSupabaseAdminConfigured } from '@/lib/env.server'
import { createAdminClient } from '@/lib/supabase/admin'

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export async function getClientIp() {
  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || headerList.get('x-real-ip') || 'unknown'
}

/**
 * Fixed-window rate limit backed by the `check_rate_limit` database function.
 * Returns true when the request is allowed.
 *
 *   if (!(await rateLimit(`contact:${ip}`, 5, 3600))) return actionError('Too many messages...')
 */
export async function rateLimit(key: string, maxHits: number, windowSeconds: number) {
  if (!isSupabaseAdminConfigured) return true
  const { data, error } = await createAdminClient().rpc('check_rate_limit', {
    p_key: key,
    p_max_hits: maxHits,
    p_window_seconds: windowSeconds,
  })
  if (error) {
    console.error('[rate-limit] check failed', error.message)
    return true // fail open so a database hiccup does not block real customers
  }
  return data === true
}
