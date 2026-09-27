'use client'

import { toast } from 'sonner'

import { SubmitButton } from '@/components/ui/form-status'
import { initialActionState, type ActionState } from '@/lib/actions'

type SubmitButtonProps = React.ComponentProps<typeof SubmitButton>

/**
 * Submit button that asks "are you sure?" before its form is sent. Use it
 * inside any <form> for destructive actions:
 *
 *   <form action={deleteThing}>
 *     <ConfirmButton message="Delete this item? This cannot be undone." variant="destructive">Delete</ConfirmButton>
 *   </form>
 */
export function ConfirmButton({ message, onClick, ...props }: SubmitButtonProps & { message: string }) {
  return (
    <SubmitButton
      {...props}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
    />
  )
}

interface ActionButtonProps extends Omit<SubmitButtonProps, 'onClick' | 'type'> {
  /** A server action with the (state, formData) signature used by useActionState. */
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  /** Sent to the action as hidden form fields, e.g. { id: review.id, status: 'approved' }. */
  fields: Record<string, string>
  /** When set, the button asks for confirmation with this text first. */
  confirm?: string
}

/**
 * A one-button form for row actions (approve, archive, delete...). It runs the
 * server action and shows the returned message as a toast, so lists stay
 * compact. The action must still validate every field: hidden inputs can be
 * edited by anyone.
 */
export function ActionButton({ action, fields, confirm, ...buttonProps }: ActionButtonProps) {
  async function run(formData: FormData) {
    const result = await action(initialActionState, formData)
    if (!result?.message) return
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
  }

  return (
    <form action={run}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {confirm ? <ConfirmButton message={confirm} {...buttonProps} /> : <SubmitButton {...buttonProps} />}
    </form>
  )
}
