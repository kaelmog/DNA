import 'server-only'

import { createClient } from '@supabase/supabase-js'

import { supabasePublishableKey, supabaseUrl } from '@/lib/env'

/**
 * Anonymous Supabase client with no cookies. Use it where there is no request
 * (sitemap, metadata) or for data that is the same for every visitor.
 */
export function createPublicClient() {
  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
