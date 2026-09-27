import type { Metadata } from 'next'

import { ChangeEmailForm } from '@/components/account/change-email-form'
import { ChangePasswordForm } from '@/components/account/change-password-form'
import { DeleteAccountForm } from '@/components/account/delete-account-form'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Account settings',
  robots: { index: false, follow: false },
}

export default async function AccountSettingsPage() {
  const user = await requireUser('/account/settings')

  return (
    <div className="grid max-w-3xl gap-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Email address</CardTitle>
            <CardDescription>Where we send order confirmations and shipping updates.</CardDescription>
          </div>
        </CardHeader>
        <ChangeEmailForm currentEmail={user.email ?? ''} />
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Password</CardTitle>
            <CardDescription>Choose a password you don&apos;t use anywhere else.</CardDescription>
          </div>
        </CardHeader>
        <ChangePasswordForm />
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <div>
            <CardTitle className="text-destructive">Delete account</CardTitle>
            <CardDescription>
              This permanently removes your account, saved pieces and reviews, and cannot be undone. Past orders stay
              in the store&apos;s accounting records but are no longer linked to an account.
            </CardDescription>
          </div>
        </CardHeader>
        <DeleteAccountForm />
      </Card>
    </div>
  )
}
