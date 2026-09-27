import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { safeNextPath } from '@/app/auth/redirects'
import { AuthCard, authLinkClassName } from '@/components/auth/auth-card'
import { SignupForm } from '@/components/auth/signup-form'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a Knotted Studio account to track orders and save your favourite pieces.',
  robots: { index: false, follow: false },
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  if (await getCurrentUser()) redirect('/account')

  // Only pass ?next along when one was given; the action falls back to /account?welcome=1.
  const next = typeof params.next === 'string' ? safeNextPath(params.next) : undefined
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login'

  return (
    <AuthCard
      eyebrow="Join the studio"
      title="Create an account"
      description="Track orders, save pieces you love and check out faster next time."
      footer={
        <>
          Already have an account?{' '}
          <Link href={loginHref} className={authLinkClassName}>
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm next={next} />
    </AuthCard>
  )
}
