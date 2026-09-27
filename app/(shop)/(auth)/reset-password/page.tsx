import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthCard } from '@/components/auth/auth-card'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { buttonVariants } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
}

/**
 * The emailed reset link signs the user in (via /auth/callback or /auth/confirm)
 * and lands here. No session means the link was already used or has expired.
 */
export default async function ResetPasswordPage() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <AuthCard
        eyebrow="Password help"
        title="This link has expired"
        description="Password reset links work once and only for a limited time. Request a new one and we'll email it right away."
      >
        <Link href="/forgot-password" className={buttonVariants({ size: 'lg', className: 'w-full' })}>
          Request a new link
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      eyebrow="Password help"
      title="Choose a new password"
      description={
        <>
          You&apos;re resetting the password for <span className="font-medium break-all text-foreground">{user.email}</span>.
        </>
      }
    >
      <ResetPasswordForm />
    </AuthCard>
  )
}
