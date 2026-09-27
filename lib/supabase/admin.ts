import 'server-only'

import { createClient } from '@supabase/supabase-js'

import { supabaseUrl } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'

/**
 * Supabase client with the SECRET key. It bypasses Row Level Security.
 *
 * Only use it on the server, for work that has no signed-in admin behind it:
 * creating orders at checkout, the Stripe webhook, and public form submissions.
 * Always validate input and check permissions yourself before using it.
 */
export function createAdminClient() {
  if (!supabaseUrl || !serverEnv.supabaseSecretKey) {
    throw new Error('Supabase secret key is not configured. Set SUPABASE_SECRET_KEY (see /todo).')
  }

  return createClient(supabaseUrl, serverEnv.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
