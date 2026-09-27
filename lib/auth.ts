import 'server-only'

import { notFound, redirect } from 'next/navigation'
import { cache } from 'react'

import { isSupabaseConfigured } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

/**
 * The signed-in Supabase user for this request, or null. Uses getUser(), which
 * verifies the session with Supabase Auth. Cached per request.
 */
export const getCurrentUser = cache(async () => {
  if (!isSupabaseConfigured) return null
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user
})

/** The signed-in user's profile row, or null. Cached per request. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle<Profile>()
  return data ?? null
})

export async function isCurrentUserAdmin() {
  const profile = await getCurrentProfile()
  return profile?.role === 'admin'
}

/** Use in pages and server actions that need a signed-in user. Redirects to /login otherwise. */
export async function requireUser(returnTo = '/account') {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(safeRedirectPath(returnTo))}`)
  return user
}

/**
 * Use at the top of EVERY admin page and admin server action. Server actions
 * are public HTTP endpoints, so the admin layout alone is not enough.
 * Non-admins get a 404 so the admin area stays hidden.
 */
export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin')
  const profile = await getCurrentProfile()
  if (profile?.role !== 'admin') notFound()
  return profile
}

/** Only allow same-site relative paths, to prevent open-redirect attacks. */
export function safeRedirectPath(value: unknown, fallback = '/account') {
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  return value
}
