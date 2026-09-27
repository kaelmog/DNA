'use client'

import { CircleCheck } from 'lucide-react'
import { useActionState } from 'react'
import { toast } from 'sonner'

import { markOrderPaid } from '@/app/admin/orders/actions'
import { ConfirmButton } from '@/components/admin/confirm-button'
import { FormMessage } from '@/components/ui/form-status'
import { initialActionState } from '@/lib/actions'

/**
 * Confirms a manual payment after asking "are you sure?". On success the page
 * refreshes and this button disappears, so the result is shown as a toast;
 * errors stay under the button.
 */
export function MarkPaidButton({
  orderId,
  orderLabel,
  email,
  prominent = true,
}: {
  orderId: string
  /** e.g. "#1042", used in the confirmation question. */
  orderLabel: string
  /** Where the confirmation email goes, if the order has an address. */
  email: string | null
  /** Accent (true) or outline (false) styling. */
  prominent?: boolean
}) {
  const [state, formAction] = useActionState(async () => {
    const result = await markOrderPaid(orderId)
    if (result.ok && result.message) toast.success(result.message)
    return result
  }, initialActionState)

  const confirmMessage = [
    `Mark order ${orderLabel} as paid?`,
    'Only do this once the money has arrived.',
    email ? `The customer gets a confirmation email at ${email}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <form action={formAction} className="grid gap-3">
      <ConfirmButton
        message={confirmMessage}
        variant={prominent ? 'accent' : 'outline'}
        className="w-full"
        pendingText="Marking as paid…"
      >
        <CircleCheck aria-hidden="true" /> Mark as paid
      </ConfirmButton>
      {!state.ok && <FormMessage state={state} />}
    </form>
  )
}
