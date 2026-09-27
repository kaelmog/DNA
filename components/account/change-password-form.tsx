'use client'

import { useActionState } from 'react'

import { changePassword } from '@/app/(shop)/account/actions'
import { PasswordField } from '@/components/auth/password-field'
import { PASSWORD_HINT, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/components/auth/password-rules'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { initialActionState } from '@/lib/actions'

/** Change password for a signed-in customer. Asks for the current password first. */
export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePassword, initialActionState)

  return (
    <form action={formAction} className="grid gap-5">
      <PasswordField
        id="settings-current-password"
        name="current_password"
        label="Current password"
        autoComplete="current-password"
        required
        errors={state.fieldErrors?.current_password}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <PasswordField
          id="settings-new-password"
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
          id="settings-confirm-password"
          name="confirm_password"
          label="Confirm new password"
          autoComplete="new-password"
          required
          maxLength={PASSWORD_MAX_LENGTH}
          errors={state.fieldErrors?.confirm_password}
        />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Updating…" className="w-full sm:w-auto sm:justify-self-start">
        Update password
      </SubmitButton>
    </form>
  )
}
