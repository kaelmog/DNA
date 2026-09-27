'use client'

import { useActionState } from 'react'

import { requestPasswordReset, type EmailFormState } from '@/app/(shop)/(auth)/actions'
import { CheckInbox } from '@/components/auth/check-inbox'
import { TextField } from '@/components/auth/text-field'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { initialActionState } from '@/lib/actions'

/** Asks for an email and sends a reset link. The reply is identical whether or not the account exists. */
export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<EmailFormState, FormData>(requestPasswordReset, initialActionState)

  if (state.ok) return <CheckInbox message={state.message} email={state.values?.email} />

  return (
    <form action={formAction} className="grid gap-5">
      <TextField
        id="forgot-email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        inputMode="email"
        required
        maxLength={254}
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText="Sending link…">
        Send reset link
      </SubmitButton>
    </form>
  )
}
