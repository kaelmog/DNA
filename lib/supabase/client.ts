import { createBrowserClient } from '@supabase/ssr'

import { supabasePublishableKey, supabaseUrl } from '@/lib/env'

/**
 * Supabase client for Client Components. It uses the visitor's session cookie,
 * so Row Level Security applies. Check `isSupabaseConfigured` before calling this.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabasePublishableKey)
}
