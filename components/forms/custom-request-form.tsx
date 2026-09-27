'use client'

import { useState } from 'react'

import { submitCustomRequest } from '@/app/(shop)/custom/actions'
import { CharacterCount } from '@/components/forms/character-count'
import { FormSuccess } from '@/components/forms/form-success'
import { HoneypotField } from '@/components/forms/honeypot-field'
import { ImageFileField } from '@/components/forms/image-file-field'
import { describedBy, useFormAction } from '@/components/forms/use-form-action'
import { Field } from '@/components/ui/field'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { Input, Select, Textarea } from '@/components/ui/input'
import { CUSTOM_REQUEST_TYPES, MAX_REFERENCE_IMAGE_BYTES } from '@/lib/constants'

const DESCRIPTION_MAX = 4000

interface CustomRequestFormProps {
  /** Earliest and latest "needed by" dates (YYYY-MM-DD), computed on the server per request. */
  minDeadline: string
  maxDeadline: string
}

/**
 * Made-to-order request form on /custom. After a successful send it shows a
 * confirmation; "Send another request" mounts a fresh, empty form.
 */
export function CustomRequestForm(props: CustomRequestFormProps) {
  const [formKey, setFormKey] = useState(0)
  return <CustomRequestFormBody key={formKey} {...props} onReset={() => setFormKey((key) => key + 1)} />
}

function CustomRequestFormBody({ minDeadline, maxDeadline, onReset }: CustomRequestFormProps & { onReset: () => void }) {
  const { state, formAction, onSubmit } = useFormAction(submitCustomRequest)
  const [descriptionLength, setDescriptionLength] = useState(0)
  const errors = state.fieldErrors ?? {}

  if (state.ok) {
    return (
      <FormSuccess
        title="Your request is on its way"
        message={state.message}
        resetLabel="Send another request"
        onReset={onReset}
      />
    )
  }

  return (
    <form action={formAction} onSubmit={onSubmit} className="relative grid gap-5 sm:grid-cols-2">
      <HoneypotField idPrefix="custom" />

      <Field id="custom-name" label="Your name" required errors={errors.customer_name}>
        <Input
          {...describedBy('custom-name', errors.customer_name)}
          name="customer_name"
          required
          maxLength={120}
          autoComplete="name"
        />
      </Field>

      <Field id="custom-email" label="Email" required errors={errors.customer_email}>
        <Input
          {...describedBy('custom-email', errors.customer_email)}
          name="customer_email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
        />
      </Field>

      <Field id="custom-phone" label="Phone" hint="Optional, if you prefer a call." errors={errors.phone}>
        <Input
          {...describedBy('custom-phone', errors.phone, true)}
          name="phone"
          type="tel"
          maxLength={40}
          autoComplete="tel"
        />
      </Field>

      <Field id="custom-type" label="What would you like made?" required errors={errors.request_type}>
        <Select {...describedBy('custom-type', errors.request_type)} name="request_type" required defaultValue="">
          <option value="" disabled>
            Choose one…
          </option>
          {CUSTOM_REQUEST_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="custom-budget" label="Budget (USD)" hint="Optional. A rough range is fine." errors={errors.budget}>
        <Input
          {...describedBy('custom-budget', errors.budget, true)}
          name="budget"
          type="number"
          inputMode="decimal"
          min={1}
          max={100000}
          step="any"
          placeholder="150"
        />
      </Field>

      <Field id="custom-deadline" label="Needed by" hint="Optional." errors={errors.deadline}>
        <Input
          {...describedBy('custom-deadline', errors.deadline, true)}
          name="deadline"
          type="date"
          min={minDeadline}
          max={maxDeadline}
        />
      </Field>

      <Field id="custom-colors" label="Colours or mood" errors={errors.preferred_colors}>
        <Input
          {...describedBy('custom-colors', errors.preferred_colors)}
          name="preferred_colors"
          maxLength={200}
          placeholder="Warm neutrals, terracotta…"
        />
      </Field>

      <Field id="custom-size" label="Size or dimensions" errors={errors.dimensions}>
        <Input
          {...describedBy('custom-size', errors.dimensions)}
          name="dimensions"
          maxLength={120}
          placeholder="Approx. 24 × 36 in"
        />
      </Field>

      <div className="sm:col-span-2">
        <ImageFileField
          id="custom-image"
          name="reference_image"
          label="Reference image"
          maxBytes={MAX_REFERENCE_IMAGE_BYTES}
          errors={errors.reference_image}
        />
      </div>

      <Field
        id="custom-description"
        label="Tell us about your idea"
        required
        errors={errors.description}
        className="sm:col-span-2"
      >
        <Textarea
          id="custom-description"
          name="description"
          required
          rows={6}
          maxLength={DESCRIPTION_MAX}
          onChange={(event) => setDescriptionLength(event.target.value.length)}
          aria-invalid={Boolean(errors.description?.length) || undefined}
          aria-describedby={`custom-description-count${errors.description?.length ? ' custom-description-description' : ''}`}
          placeholder="Share the space, the feeling, your inspiration and any details that matter…"
        />
        <CharacterCount id="custom-description-count" count={descriptionLength} max={DESCRIPTION_MAX} />
      </Field>

      <div className="grid gap-3 sm:col-span-2">
        <FormMessage state={state} />
        <SubmitButton size="lg" pendingText="Sending your request…" className="w-full">
          Send custom request
        </SubmitButton>
        <p className="text-center text-xs text-muted-foreground">
          We only use your details to reply to this request.
        </p>
      </div>
    </form>
  )
}
