import type { EmailOtpType } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

import { applyPendingMarketingOptIn } from '@/app/auth/marketing-opt-in'
import { redirectToPath, safeNextPath } from '@/app/auth/redirects'
import { isSupabaseConfigured } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

const EMAIL_LINK_TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email']

function isEmailLinkType(value: string | null): value is EmailOtpType {
  return value !== null && EMAIL_LINK_TYPES.includes(value)
}

/** Where each kind of email link lands once it has been verified. */
function destinationFor(type: EmailOtpType, next: string | null) {
  if (type === 'recovery') return '/reset-password'
  if (type === 'email_change') return safeNextPath(next, '/account?email=confirmed')
  return safeNextPath(next, '/account?welcome=1')
}

/**
 * Verifies token-hash email links from custom Supabase email templates, e.g.
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/account
 * Unlike PKCE codes these work even when the email is opened on another device.
 */
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) return redirectToPath(request, '/login?error=not_configured')

  const { searchParams } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (tokenHash && isEmailLinkType(type)) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) {
      await applyPendingMarketingOptIn(supabase, data.user)
      return redirectToPath(request, destinationFor(type, searchParams.get('next')))
    }
    console.error('[auth] email link verification failed', error.code ?? error.message)
  }

  return redirectToPath(request, '/login?error=link_invalid')
}
