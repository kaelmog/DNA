/**
 * Shared database helpers and the markers that identify demo data.
 * Demo rows are recognised ONLY by these markers, so the reset can never
 * touch the owner's real account, products or orders.
 */
import { createClient } from '@supabase/supabase-js'

/** Every demo person (account, guest, subscriber, sender) uses this reserved domain. */
export const DEMO_EMAIL_DOMAIN = '@example.com'
/** Every demo product carries this tag. */
export const DEMO_TAG = 'demo'
/** One shared password for all demo accounts, printed at the end of a seed run. */
export const DEMO_PASSWORD = 'KnottedDemo!2026'

/** Statuses that mean the customer paid (the same set the dashboard counts as sold). */
export const PAID_STATUSES = ['paid', 'processing', 'shipped', 'delivered', 'refunded']

export const isDemoEmail = (email) => typeof email === 'string' && email.toLowerCase().endsWith(DEMO_EMAIL_DOMAIN)

/** Service-role client: bypasses RLS, so it must only ever run from this local script. */
export function createServiceClient(url, secretKey) {
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Returns `data` or throws with a short label. Keeps every query's error handling to one line. */
export function unwrap({ data, error }, label) {
  if (error) throw new Error(`${label}: ${error.message}`)
  return data
}
