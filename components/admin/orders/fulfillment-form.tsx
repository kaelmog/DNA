'use client'

import { useActionState } from 'react'

import { updateFulfillment } from '@/app/admin/orders/actions'
import { SHIPPABLE_STATUSES } from '@/components/admin/orders/status-rules'
import { Field } from '@/components/ui/field'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { Checkbox, Input } from '@/components/ui/input'
import { initialActionState, type ActionState } from '@/lib/actions'
import type { Order } from '@/lib/types'

type FulfillmentOrder = Pick<Order, 'id' | 'status' | 'email' | 'carrier' | 'tracking_number' | 'tracking_url'>

/** On errors the submitted values are kept, because React resets a form after every action. */
type FormState = ActionState & { values?: FormData }

/** Carrier and tracking details, with an option to mark the order as shipped and email the customer. */
export function FulfillmentForm({ order }: { order: FulfillmentOrder }) {
  const [state, formAction] = useActionState<FormState, FormData>(async (_previous, formData) => {
    const result = await updateFulfillment(initialActionState, formData)
    return result.ok ? result : { ...result, values: formData }
  }, initialActionState)

  const initial = (name: string, saved: string | null) =>
    state.values ? String(state.values.get(name) ?? '') : (saved ?? '')
  const errors = state.fieldErrors ?? {}
  const canShip = SHIPPABLE_STATUSES.includes(order.status)
  const alreadyShipped = order.status === 'shipped'

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="orderId" value={order.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="carrier" label="Carrier" errors={errors.carrier}>
          <Input
            id="carrier"
            name="carrier"
            defaultValue={initial('carrier', order.carrier)}
            placeholder="USPS, UPS, Canada Post…"
            maxLength={60}
            autoComplete="off"
            aria-invalid={Boolean(errors.carrier?.length)}
            aria-describedby={errors.carrier?.length ? 'carrier-description' : undefined}
          />
        </Field>
        <Field id="tracking-number" label="Tracking number" errors={errors.trackingNumber}>
          <Input
            id="tracking-number"
            name="trackingNumber"
            defaultValue={initial('trackingNumber', order.tracking_number)}
            maxLength={100}
            autoComplete="off"
            aria-invalid={Boolean(errors.trackingNumber?.length)}
            aria-describedby={errors.trackingNumber?.length ? 'tracking-number-description' : undefined}
          />
        </Field>
      </div>

      <Field
        id="tracking-url"
        label="Tracking link"
        hint="The full https:// link to the carrier's tracking page."
        errors={errors.trackingUrl}
      >
        <Input
          id="tracking-url"
          name="trackingUrl"
          type="url"
          inputMode="url"
          pattern="https://.+"
          defaultValue={initial('trackingUrl', order.tracking_url)}
          placeholder="https://"
          maxLength={500}
          aria-invalid={Boolean(errors.trackingUrl?.length)}
          aria-describedby="tracking-url-description"
        />
      </Field>

      {canShip && (
        <label className="flex min-h-10 cursor-pointer items-start gap-3 rounded-xl bg-muted/60 p-3 text-sm">
          <Checkbox name="markShipped" className="mt-0.5" disabled={!order.email && alreadyShipped} />
          <span>
            <span className="font-medium">
              {alreadyShipped ? 'Email the tracking details to the customer again' : 'Mark as shipped and email the customer'}
            </span>
            <span className="block text-xs text-muted-foreground">
              {order.email
                ? `The shipping confirmation goes to ${order.email}.`
                : 'This order has no email address, so only the status will change.'}
            </span>
          </span>
        </label>
      )}

      <div>
        <SubmitButton pendingText="Saving…">Save tracking</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  )
}
