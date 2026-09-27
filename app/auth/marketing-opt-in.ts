import 'server-only'

import type { SupabaseClient, User } from '@supabase/supabase-js'

/** User-metadata flag written at sign-up when the visitor ticks "email me about new pieces". */
export const PENDING_OPT_IN_KEY = 'pending_marketing_opt_in'

/**
 * The profile row is created by a database trigger that only copies the name,
 * and a brand-new user cannot update it until they have a session. So the
 * sign-up form stores the opt-in choice in user metadata and it is applied here,
 * right after the user gets a session (email confirmed, or instantly when
 * confirmations are off).
 *
 * The flag is cleared afterwards so this only ever runs once: a later password
 * reset link must never re-subscribe someone who has since opted out.
 */
export async function applyPendingMarketingOptIn(supabase: SupabaseClient, user: User | null) {
  if (!user || user.user_metadata?.[PENDING_OPT_IN_KEY] !== true) return

  const { error } = await supabase.from('profiles').update({ marketing_opt_in: true }).eq('id', user.id)
  if (error) {
    console.error('[auth] could not save marketing opt-in', error.message)
    return
  }

  const { error: clearError } = await supabase.auth.updateUser({ data: { [PENDING_OPT_IN_KEY]: null } })
  if (clearError) console.error('[auth] could not clear marketing opt-in flag', clearError.message)
}
