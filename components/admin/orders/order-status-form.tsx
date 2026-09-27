'use client'

import { TriangleAlert } from 'lucide-react'
import { useActionState, useState } from 'react'

import { updateOrderStatus } from '@/app/admin/orders/actions'
import { allowedStatusTargets, statusChangeBlockedReason } from '@/components/admin/orders/status-rules'
import { Field } from '@/components/ui/field'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { Select, Textarea } from '@/components/ui/input'
import { initialActionState, type ActionState } from '@/lib/actions'
import { ORDER_STATUS } from '@/lib/constants'
import type { OrderStatus } from '@/lib/types'

/** Moves an order to another status. Only valid targets are offered; the server enforces the same rules. */
export function OrderStatusForm({
  orderId,
  status,
  wasPaid,
  paidWithStripe,
}: {
  orderId: string
  status: OrderStatus
  /** The order was paid at some point (so cancelling needs a refund). */
  wasPaid: boolean
  /** The payment went through Stripe (refund there) rather than being confirmed by hand. */
  paidWithStripe: boolean
}) {
  const [target, setTarget] = useState<OrderStatus | ''>('')
  const [state, formAction] = useActionState(async (_previous: ActionState, formData: FormData) => {
    const result = await updateOrderStatus(initialActionState, formData)
    // After a successful change the old choice no longer applies.
    if (result.ok) setTarget('')
    return result
  }, initialActionState)

  const options = allowedStatusTargets(status, wasPaid)
  if (!options.length) {
    return <p className="text-sm text-muted-foreground">{statusChangeBlockedReason(status, wasPaid)}</p>
  }

  const statusErrors = state.fieldErrors?.status
  const reasonErrors = state.fieldErrors?.cancelReason

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="orderId" value={orderId} />

      <Field id="order-status" label="Change status to" errors={statusErrors}>
        <Select
          id="order-status"
          name="status"
          value={target}
          onChange={(event) => setTarget(event.target.value as OrderStatus | '')}
          required
          aria-invalid={Boolean(statusErrors?.length)}
          aria-describedby={statusErrors?.length ? 'order-status-description' : undefined}
        >
          <option value="" disabled>
            Choose a status…
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {ORDER_STATUS[option].label}
            </option>
          ))}
        </Select>
      </Field>

      {status === 'pending' && (
        <p className="text-xs text-muted-foreground">
          This order is awaiting payment. To confirm a payment, use “Mark as paid” in the Payment card.
        </p>
      )}

      {target === 'cancelled' && (
        <>
          <div className="flex gap-2.5 rounded-xl bg-warning/10 p-3 text-sm text-warning">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              Reserved stock goes back into inventory automatically.
              {wasPaid &&
                (paidWithStripe
                  ? ' This order was paid: refund the customer in your Stripe dashboard as well.'
                  : ' This order was paid: remember to refund the customer the way they paid you.')}
            </p>
          </div>
          <Field id="cancel-reason" label="Reason for cancelling" required errors={reasonErrors} hint="Kept on the order for your records.">
            <Textarea
              id="cancel-reason"
              name="cancelReason"
              rows={3}
              maxLength={500}
              required
              aria-invalid={Boolean(reasonErrors?.length)}
              aria-describedby="cancel-reason-description"
            />
          </Field>
        </>
      )}

      <SubmitButton
        disabled={!target}
        variant={target === 'cancelled' ? 'destructive' : 'default'}
        pendingText="Updating…"
      >
        {target === 'cancelled' ? 'Cancel order' : 'Update status'}
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  )
}
