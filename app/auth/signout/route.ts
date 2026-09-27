import { NextResponse, type NextRequest } from 'next/server'

import { isSupabaseConfigured } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

/**
 * Signs the visitor out. POST only: a GET could be fired by a link prefetch or
 * an <img> tag on another page. There is deliberately no GET export (Next.js
 * answers GET with 405 Method Not Allowed).
 */
export async function POST(request: NextRequest) {
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    // 'local' ends this browser's session only; other devices stay signed in.
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) console.error('[auth] sign out failed', error.message)
  }

  // 303 See Other turns the form POST into a GET of the home page.
  return NextResponse.redirect(new URL('/', request.url), { status: 303 })
}
