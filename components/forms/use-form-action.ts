'use client'

import { startTransition, useActionState } from 'react'

import { initialActionState, type ActionState } from '@/lib/actions'

type FormServerAction = (state: ActionState, formData: FormData) => Promise<ActionState>

/**
 * useActionState for public forms, keeping what the visitor typed when the
 * server answers with an error.
 *
 * React resets a form automatically after its `action` runs, which would wipe
 * a long message just because one field was invalid. Submitting through
 * `onSubmit` + startTransition skips that reset. The `action` prop stays on the
 * form so it still submits before the page has hydrated.
 *
 *   const { state, formAction, onSubmit } = useFormAction(submitContactMessage)
 *   <form action={formAction} onSubmit={onSubmit}>…</form>
 */
export function useFormAction(action: FormServerAction) {
  const [state, formAction, pending] = useActionState(action, initialActionState)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(() => formAction(formData))
  }

  return { state, formAction, onSubmit, pending }
}

/**
 * Accessibility props that connect an input to its <Field> hint or error text.
 *
 *   <Input {...describedBy('email', state.fieldErrors?.email)} />
 */
export function describedBy(id: string, errors?: string[], hasHint = false) {
  const hasError = Boolean(errors?.length)
  return {
    id,
    'aria-invalid': hasError || undefined,
    'aria-describedby': hasError || hasHint ? `${id}-description` : undefined,
  }
}
