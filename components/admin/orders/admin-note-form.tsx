'use client'

import { useActionState } from 'react'

import { updateAdminNote } from '@/app/admin/orders/actions'
import { Field } from '@/components/ui/field'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { Textarea } from '@/components/ui/input'
import { initialActionState, type ActionState } from '@/lib/actions'

/** On errors the typed note is kept, because React resets a form after every action. */
type FormState = ActionState & { submittedNote?: string }

/** Private note on an order. Customers never see it. */
export function AdminNoteForm({ orderId, note }: { orderId: string; note: string | null }) {
  const [state, formAction] = useActionState<FormState, FormData>(async (_previous, formData) => {
    const result = await updateAdminNote(initialActionState, formData)
    return result.ok ? result : { ...result, submittedNote: String(formData.get('adminNote') ?? '') }
  }, initialActionState)
  const errors = state.fieldErrors?.adminNote

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <Field id="admin-note" label="Private note" hint="Only admins can see this." errors={errors}>
        <Textarea
          id="admin-note"
          name="adminNote"
          rows={4}
          maxLength={4000}
          defaultValue={state.submittedNote ?? note ?? ''}
          aria-invalid={Boolean(errors?.length)}
          aria-describedby="admin-note-description"
        />
      </Field>
      <div>
        <SubmitButton variant="outline" pendingText="Saving…">
          Save note
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  )
}
