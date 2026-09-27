import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { supabasePublishableKey, supabaseUrl } from '@/lib/env'

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * It acts as the signed-in visitor, so Row Level Security always applies.
 * Create a new client per request; never share one between requests.
 * Check `isSupabaseConfigured` before calling this.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Components cannot set cookies. The proxy refreshes the session instead.
        }
      },
    },
  })
}
