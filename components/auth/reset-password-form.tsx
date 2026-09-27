'use client'

import { useActionState } from 'react'

import { resetPassword } from '@/app/(shop)/(auth)/actions'
import { PasswordField } from '@/components/auth/password-field'
import { PASSWORD_HINT, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/components/auth/password-rules'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { initialActionState } from '@/lib/actions'

/** New password + confirmation, used after following a reset link. Redirects to /account on success. */
export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPassword, initialActionState)

  return (
    <form action={formAction} className="grid gap-5">
      <PasswordField
        id="reset-password"
        name="password"
        label="New password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
        maxLength={PASSWORD_MAX_LENGTH}
        hint={PASSWORD_HINT}
        errors={state.fieldErrors?.password}
      />
      <PasswordField
        id="reset-confirm-password"
        name="confirm_password"
        label="Confirm new password"
        autoComplete="new-password"
        required
        maxLength={PASSWORD_MAX_LENGTH}
        errors={state.fieldErrors?.confirm_password}
      />
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText="Saving…">
        Save new password
      </SubmitButton>
    </form>
  )
}
