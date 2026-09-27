'use client'

import { useActionState, useState } from 'react'

import { deleteAccount } from '@/app/(shop)/account/actions'
import { TextField } from '@/components/auth/text-field'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { initialActionState } from '@/lib/actions'

const CONFIRMATION_WORD = 'DELETE'

/**
 * Permanent account deletion. The button stays disabled until the customer types
 * DELETE; the server checks the word again, since the browser can't be trusted.
 */
export function DeleteAccountForm() {
  const [state, formAction, isPending] = useActionState(deleteAccount, initialActionState)
  const [confirmation, setConfirmation] = useState('')
  const confirmed = confirmation.trim() === CONFIRMATION_WORD

  return (
    <form action={formAction} className="grid gap-5">
      <TextField
        id="settings-delete-confirmation"
        name="confirmation"
        label={
          <>
            Type <span className="font-semibold tracking-wide">{CONFIRMATION_WORD}</span> to confirm
          </>
        }
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        errors={state.fieldErrors?.confirmation}
      />
      <FormMessage state={state} />
      <SubmitButton
        variant="destructive"
        pendingText="Deleting account…"
        disabled={isPending || !confirmed}
        className="w-full sm:w-auto sm:justify-self-start"
      >
        Delete my account
      </SubmitButton>
    </form>
  )
}
