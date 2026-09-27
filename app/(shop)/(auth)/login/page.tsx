import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { safeNextPath } from '@/app/auth/redirects'
import { AuthCard, authLinkClassName } from '@/components/auth/auth-card'
import { LoginForm } from '@/components/auth/login-form'
import { Notice } from '@/components/auth/notice'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to track your orders, see saved pieces and check out faster.',
  robots: { index: false, follow: false },
}

type SearchParams = Record<string, string | string[] | undefined>

/** Success banners for links that land here, e.g. /login?deleted=1. */
const SUCCESS_NOTICES = new Map([
  ['confirmed', 'Your email is confirmed. Sign in to continue.'],
  ['reset', 'Your password has been changed. Sign in with your new password.'],
  ['deleted', 'Your account has been deleted. Thank you for shopping with us.'],
])

/** Known ?error= codes. Anything else gets a generic message: raw query text is never shown. */
const ERROR_NOTICES = new Map([
  [
    'link_invalid',
    'That link is invalid or has expired. Email links work once, in the browser where you asked for them. Sign in below, or request a new link.',
  ],
  ['session_expired', 'Your session has expired. Please sign in again.'],
  ['not_configured', 'Customer accounts are not available yet. Please try again later.'],
])

function pageNotice(params: SearchParams) {
  if (params.error !== undefined) {
    const code = typeof params.error === 'string' ? params.error : ''
    return { tone: 'error' as const, message: ERROR_NOTICES.get(code) ?? 'Something went wrong. Please try again.' }
  }
  for (const [key, message] of SUCCESS_NOTICES) {
    if (params[key] === '1') return { tone: 'success' as const, message }
  }
  return null
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const next = safeNextPath(params.next, '/account')

  if (await getCurrentUser()) redirect(next)

  const notice = pageNotice(params)
  // Carry ?next over to sign-up so new customers also land back where they started.
  const signupHref = next === '/account' ? '/signup' : `/signup?next=${encodeURIComponent(next)}`

  return (
    <AuthCard
      eyebrow="Welcome back"
      title="Sign in"
      description="Track your orders, see your saved pieces and check out faster."
      footer={
        <>
          New here?{' '}
          <Link href={signupHref} className={authLinkClassName}>
            Create an account
          </Link>
        </>
      }
    >
      {notice && (
        <Notice tone={notice.tone} className="mb-6">
          {notice.message}
        </Notice>
      )}
      <LoginForm next={next} />
    </AuthCard>
  )
}
