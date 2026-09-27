'use client'

import { useActionState } from 'react'

import { resendConfirmation } from '@/app/(shop)/(auth)/actions'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { initialActionState } from '@/lib/actions'

/** Offered after a sign-in attempt with an unconfirmed email address. */
export function ResendConfirmationForm({ email }: { email: string }) {
  const [state, formAction] = useActionState(resendConfirmation, initialActionState)

  return (
    <form action={formAction} className="grid gap-3 rounded-2xl bg-muted p-4">
      <input type="hidden" name="email" value={email} />
      <p className="text-sm leading-6 text-muted-foreground">
        Can&apos;t find the confirmation email? Check your spam folder, or we can send a fresh link.
      </p>
      <SubmitButton variant="outline" pendingText="Sending…">
        Resend confirmation email
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  )
}
