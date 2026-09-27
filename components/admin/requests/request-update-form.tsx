'use client'

import { useActionState, useState } from 'react'
import { toast } from 'sonner'

import { updateCustomRequest } from '@/app/admin/requests/actions'
import { CharacterCount } from '@/components/forms/character-count'
import { Field } from '@/components/ui/field'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { Input, Select, Textarea } from '@/components/ui/input'
import { initialActionState, type ActionState } from '@/lib/actions'
import { CUSTOM_REQUEST_STATUS } from '@/lib/constants'
import { centsToDollars } from '@/lib/format'
import type { CustomRequest, CustomRequestStatus } from '@/lib/types'

const NOTES_MAX = 4000

type RequestFields = Pick<CustomRequest, 'id' | 'status' | 'quoted_price_cents' | 'seller_notes'>

/** On errors the submitted values are kept, because React resets a form after every action. */
type FormState = ActionState & { values?: FormData }

const STATUS_OPTIONS = Object.entries(CUSTOM_REQUEST_STATUS) as [CustomRequestStatus, { label: string }][]

/** Status, quoted price and private notes for one custom request. Several appear on a page, so ids include the request id. */
export function RequestUpdateForm({ request, currency }: { request: RequestFields; currency: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(async (_previous, formData) => {
    const result = await updateCustomRequest(initialActionState, formData)
    if (!result.ok) return { ...result, values: formData }
    // A new status can move the request to another tab (unmounting this form), so success is a toast.
    if (result.message) toast.success(result.message)
    return result
  }, initialActionState)
  // Controlled, because a form reset would otherwise put a <select> back to its first rendered value.
  const [status, setStatus] = useState<CustomRequestStatus>(request.status)
  const [notesLength, setNotesLength] = useState(request.seller_notes?.length ?? 0)

  const errors = state.fieldErrors ?? {}
  const text = (name: string, saved: string) => (state.values ? String(state.values.get(name) ?? '') : saved)
  const fieldId = (name: string) => `request-${request.id}-${name}`

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="id" value={request.id} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <Field id={fieldId('status')} label="Status" errors={errors.status}>
          <Select
            id={fieldId('status')}
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as CustomRequestStatus)}
            aria-invalid={Boolean(errors.status?.length)}
            aria-describedby={errors.status?.length ? `${fieldId('status')}-description` : undefined}
          >
            {STATUS_OPTIONS.map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id={fieldId('quote')}
          label={`Quoted price (${currency.toUpperCase()})`}
          hint="The price you offered. Leave empty until you quote."
          required={status === 'quoted'}
          errors={errors.quoted_price}
        >
          <Input
            id={fieldId('quote')}
            name="quoted_price"
            required={status === 'quoted'}
            inputMode="decimal"
            placeholder="180.00"
            autoComplete="off"
            defaultValue={text('quoted_price', centsToDollars(request.quoted_price_cents))}
            aria-invalid={Boolean(errors.quoted_price?.length)}
            aria-describedby={`${fieldId('quote')}-description`}
          />
        </Field>
      </div>

      <Field
        id={fieldId('notes')}
        label="Private notes"
        hint="Only admins see these: materials, agreed details, next steps."
        errors={errors.seller_notes}
      >
        <Textarea
          id={fieldId('notes')}
          name="seller_notes"
          rows={4}
          maxLength={NOTES_MAX}
          defaultValue={text('seller_notes', request.seller_notes ?? '')}
          onChange={(event) => setNotesLength(event.target.value.length)}
          aria-invalid={Boolean(errors.seller_notes?.length)}
          aria-describedby={`${fieldId('notes')}-description ${fieldId('notes')}-count`}
        />
        <CharacterCount id={`${fieldId('notes')}-count`} count={notesLength} max={NOTES_MAX} />
      </Field>

      <div>
        <SubmitButton variant="outline" pendingText="Saving…">
          Save changes
        </SubmitButton>
      </div>
      {!state.ok && <FormMessage state={state} />}
    </form>
  )
}
