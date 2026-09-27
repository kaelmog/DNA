'use client'

import { useActionState } from 'react'

import { changeEmail, type ChangeEmailState } from '@/app/(shop)/account/actions'
import { TextField } from '@/components/auth/text-field'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { initialActionState } from '@/lib/actions'

/** Starts an email change. Supabase emails confirmation links before the address actually changes. */
export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction] = useActionState<ChangeEmailState, FormData>(changeEmail, initialActionState)

  return (
    <form action={formAction} className="grid gap-5">
      <p className="text-sm text-muted-foreground">
        Currently <span className="font-medium break-all text-foreground">{currentEmail}</span>
      </p>
      <TextField
        id="settings-new-email"
        name="email"
        type="email"
        label="New email address"
        autoComplete="email"
        inputMode="email"
        required
        maxLength={254}
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />
      <FormMessage state={state} />
      <SubmitButton pendingText="Sending link…" className="w-full sm:w-auto sm:justify-self-start">
        Change email
      </SubmitButton>
    </form>
  )
}
