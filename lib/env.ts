/**
 * Public configuration. Safe to import anywhere, including client components.
 * Server-only secrets live in `lib/env.server.ts`.
 */

/** Public site URL without a trailing slash. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

/** Publishable key (sb_publishable_...). Falls back to the legacy anon key name. */
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/**
 * False until the Supabase env vars are set. While false, the storefront shows
 * demo products and every write explains that setup is incomplete (see /todo).
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)
