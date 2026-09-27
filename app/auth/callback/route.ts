import type { NextRequest } from 'next/server'

import { applyPendingMarketingOptIn } from '@/app/auth/marketing-opt-in'
import { redirectToPath, safeNextPath } from '@/app/auth/redirects'
import { isSupabaseConfigured } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

/**
 * Landing point for Supabase email links that use the PKCE flow: sign-up
 * confirmation, password reset and email change with the default templates.
 * Supabase appends `?code=...`, which is exchanged here for a session cookie.
 *
 * PKCE codes only work in the browser that asked for the email. The token-hash
 * links handled by /auth/confirm work on any device (see the /todo page).
 */
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) return redirectToPath(request, '/login?error=not_configured')

  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'), '/account')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      await applyPendingMarketingOptIn(supabase, data.user)
      return redirectToPath(request, next)
    }
    console.error('[auth] code exchange failed', error.code ?? error.message)
    return redirectToPath(request, '/login?error=link_invalid')
  }

  // With "secure email change", the first of the two confirmation links carries
  // only an informational `message` (no code). Continue to the account page.
  if (searchParams.has('message') && !searchParams.has('error')) {
    return redirectToPath(request, next)
  }

  return redirectToPath(request, '/login?error=link_invalid')
}
