import 'server-only'

import { NextResponse } from 'next/server'

import { safeRedirectPath } from '@/lib/auth'

/** Pages that bounce signed-in visitors elsewhere; sending someone "back" to them would loop. */
const AUTH_ENTRY_PAGES = ['/login', '/signup', '/forgot-password']

/**
 * Browsers strip tabs/newlines from URLs and treat "\" like "/", so a value such
 * as "/\t/evil.com" slips past a simple "starts with //" check and becomes
 * "//evil.com". Reject those characters outright.
 */
function hasUnsafeCharacters(path: string) {
  return [...path].some((char) => {
    const code = char.charCodeAt(0)
    return code < 0x20 || code === 0x7f || char === '\\'
  })
}

function isAuthEntryPage(path: string) {
  const pathname = path.split(/[?#]/)[0]
  return AUTH_ENTRY_PAGES.includes(pathname)
}

/**
 * Where to send someone after they sign in or follow an email link. Builds on
 * safeRedirectPath (same-site paths only) and adds the checks above.
 */
export function safeNextPath(value: unknown, fallback = '/account') {
  const path = safeRedirectPath(value, fallback)
  if (hasUnsafeCharacters(path) || isAuthEntryPage(path)) return fallback
  return path
}

/**
 * A redirect response for route handlers. `path` must be a constant or a value
 * that already went through safeNextPath; the origin check is a final guard so
 * the response can never point at another site.
 */
export function redirectToPath(request: Request, path: string) {
  const origin = new URL(request.url).origin
  const target = new URL(path, origin)
  return NextResponse.redirect(target.origin === origin ? target : new URL('/', origin))
}
