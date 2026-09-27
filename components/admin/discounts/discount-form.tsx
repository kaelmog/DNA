'use client'

import Link from 'next/link'
import { useActionState, useState, useSyncExternalStore } from 'react'

import { createDiscount, updateDiscount } from '@/app/admin/discounts/actions'
import { buttonVariants } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { Checkbox, Input, Select } from '@/components/ui/input'
import { initialActionState, type ActionState } from '@/lib/actions'
import { centsToDollars } from '@/lib/format'
import type { DiscountCode, DiscountType } from '@/lib/types'

/** On errors the submitted values are kept, because React resets a form after every action. */
type FormState = ActionState & { values?: FormData }

const noSubscription = () => () => {}

/**
 * datetime-local inputs have no time zone, so dates are converted in the
 * browser, where the admin's zone is known: typed local time -> ISO (UTC).
 */
function localToIso(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

/** ISO (UTC) -> "YYYY-MM-DDTHH:mm" in the browser's time zone, to pre-fill datetime-local inputs. */
function isoToLocal(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function initialValue(discount: DiscountCode | undefined) {
  if (!discount) return ''
  return discount.discount_type === 'percentage' ? String(discount.value) : centsToDollars(discount.value)
}

/** Create and edit form for discount codes. Pass `discount` to edit an existing code. */
export function DiscountForm({ discount, currency }: { discount?: DiscountCode; currency: string }) {
  const [type, setType] = useState<DiscountType>(discount?.discount_type ?? 'percentage')
  // Local times can only be computed in the browser; the server renders the date inputs empty.
  const isBrowser = useSyncExternalStore(noSubscription, () => true, () => false)

  const [state, formAction] = useActionState<FormState, FormData>(async (_previous, formData) => {
    formData.set('starts_at', localToIso(formData.get('starts_at_local')))
    formData.set('ends_at', localToIso(formData.get('ends_at_local')))
    const save = discount ? updateDiscount : createDiscount
    const result = await save(initialActionState, formData)
    return result.ok ? result : { ...result, values: formData }
  }, initialActionState)

  const errors = state.fieldErrors ?? {}
  const text = (name: string, saved: string) => (state.values ? String(state.values.get(name) ?? '') : saved)
  const describedBy = (id: string, hasHint = false) =>
    hasHint || errors[id]?.length ? `${id}-description` : undefined
  const currencyCode = currency.toUpperCase()
  // Orders refer to codes by name, so a code that was used keeps it (the server enforces this too).
  const codeLocked = Boolean(discount && discount.times_redeemed > 0)

  return (
    <form action={formAction} className="grid gap-6">
      {discount && <input type="hidden" name="id" value={discount.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="code"
          label="Code"
          required
          hint={
            codeLocked
              ? 'This code has been used, so it cannot be renamed.'
              : 'Letters, numbers, dashes or underscores.'
          }
          errors={errors.code}
        >
          <Input
            id="code"
            name="code"
            required
            readOnly={codeLocked}
            minLength={3}
            maxLength={32}
            pattern="[A-Za-z0-9_\-]{3,32}"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="font-mono uppercase read-only:bg-muted read-only:text-muted-foreground"
            defaultValue={codeLocked ? discount?.code : text('code', discount?.code ?? '')}
            aria-invalid={Boolean(errors.code?.length)}
            aria-describedby={describedBy('code', true)}
          />
        </Field>
        <Field id="description" label="Description" hint="For your reference, e.g. “Spring newsletter”." errors={errors.description}>
          <Input
            id="description"
            name="description"
            maxLength={200}
            defaultValue={text('description', discount?.description ?? '')}
            aria-invalid={Boolean(errors.description?.length)}
            aria-describedby={describedBy('description', true)}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="discount_type" label="Type" required errors={errors.discount_type}>
          <Select
            id="discount_type"
            name="discount_type"
            value={type}
            onChange={(event) => setType(event.target.value as DiscountType)}
            aria-invalid={Boolean(errors.discount_type?.length)}
            aria-describedby={describedBy('discount_type')}
          >
            <option value="percentage">Percentage off</option>
            <option value="fixed_amount">Fixed amount off</option>
          </Select>
        </Field>
        <Field
          id="value"
          label={type === 'percentage' ? 'Percent off' : `Amount off (${currencyCode})`}
          required
          hint={type === 'percentage' ? 'A whole number from 1 to 100.' : 'For example 5 or 12.50.'}
          errors={errors.value}
        >
          <Input
            id="value"
            name="value"
            required
            inputMode={type === 'percentage' ? 'numeric' : 'decimal'}
            defaultValue={text('value', initialValue(discount))}
            aria-invalid={Boolean(errors.value?.length)}
            aria-describedby={describedBy('value', true)}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="min_subtotal"
          label={`Minimum order subtotal (${currencyCode})`}
          hint="Leave empty for no minimum."
          errors={errors.min_subtotal}
        >
          <Input
            id="min_subtotal"
            name="min_subtotal"
            inputMode="decimal"
            defaultValue={text(
              'min_subtotal',
              discount && discount.min_subtotal_cents > 0 ? centsToDollars(discount.min_subtotal_cents) : '',
            )}
            aria-invalid={Boolean(errors.min_subtotal?.length)}
            aria-describedby={describedBy('min_subtotal', true)}
          />
        </Field>
        <Field
          id="max_redemptions"
          label="Usage limit"
          hint={
            discount
              ? `Used ${discount.times_redeemed} time${discount.times_redeemed === 1 ? '' : 's'} so far. Empty means unlimited.`
              : 'How many orders can use it in total. Empty means unlimited.'
          }
          errors={errors.max_redemptions}
        >
          <Input
            id="max_redemptions"
            name="max_redemptions"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            defaultValue={text('max_redemptions', discount?.max_redemptions ? String(discount.max_redemptions) : '')}
            aria-invalid={Boolean(errors.max_redemptions?.length)}
            aria-describedby={describedBy('max_redemptions', true)}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="starts_at_local" label="Starts" hint="Your local time. Empty means right away." errors={errors.starts_at}>
          <Input
            key={isBrowser ? 'browser' : 'server'}
            id="starts_at_local"
            name="starts_at_local"
            type="datetime-local"
            defaultValue={isBrowser ? text('starts_at_local', isoToLocal(discount?.starts_at)) : ''}
            aria-invalid={Boolean(errors.starts_at?.length)}
            aria-describedby="starts_at_local-description"
          />
        </Field>
        <Field id="ends_at_local" label="Ends" hint="Your local time. Empty means it never expires." errors={errors.ends_at}>
          <Input
            key={isBrowser ? 'browser' : 'server'}
            id="ends_at_local"
            name="ends_at_local"
            type="datetime-local"
            defaultValue={isBrowser ? text('ends_at_local', isoToLocal(discount?.ends_at)) : ''}
            aria-invalid={Boolean(errors.ends_at?.length)}
            aria-describedby="ends_at_local-description"
          />
        </Field>
      </div>

      <label className="flex min-h-10 cursor-pointer items-start gap-3 text-sm">
        <Checkbox
          name="is_active"
          className="mt-0.5"
          defaultChecked={state.values ? state.values.has('is_active') : (discount?.is_active ?? true)}
        />
        <span>
          <span className="font-medium">Active</span>
          <span className="block text-xs text-muted-foreground">Turn this off to pause the code without deleting it.</span>
        </span>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton pendingText="Saving…">{discount ? 'Save changes' : 'Create discount'}</SubmitButton>
        <Link href="/admin/discounts" className={buttonVariants({ variant: 'ghost' })}>
          {discount ? 'Back to discounts' : 'Cancel'}
        </Link>
      </div>
      <FormMessage state={state} />
    </form>
  )
}
