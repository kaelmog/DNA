import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AuthCard, authLinkClassName } from '@/components/auth/auth-card'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Request a link to reset your Knotted Studio password.',
  robots: { index: false, follow: false },
}

export default async function ForgotPasswordPage() {
  // Signed-in customers change their password from account settings instead.
  if (await getCurrentUser()) redirect('/account')

  return (
    <AuthCard
      eyebrow="Password help"
      title="Forgot your password?"
      description="Enter the email you shop with and we'll send you a link to choose a new password."
      footer={
        <>
          Remembered it?{' '}
          <Link href="/login" className={authLinkClassName}>
            Back to sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  )
}
