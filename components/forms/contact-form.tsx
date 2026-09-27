'use client'

import { useState } from 'react'

import { submitContactMessage } from '@/app/(shop)/contact/actions'
import { CharacterCount } from '@/components/forms/character-count'
import { FormSuccess } from '@/components/forms/form-success'
import { HoneypotField } from '@/components/forms/honeypot-field'
import { describedBy, useFormAction } from '@/components/forms/use-form-action'
import { Field } from '@/components/ui/field'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { Input, Textarea } from '@/components/ui/input'

const MESSAGE_MAX = 5000

/** Contact form on /contact. "Send another message" mounts a fresh, empty form. */
export function ContactForm() {
  const [formKey, setFormKey] = useState(0)
  return <ContactFormBody key={formKey} onReset={() => setFormKey((key) => key + 1)} />
}

function ContactFormBody({ onReset }: { onReset: () => void }) {
  const { state, formAction, onSubmit } = useFormAction(submitContactMessage)
  const [messageLength, setMessageLength] = useState(0)
  const errors = state.fieldErrors ?? {}

  if (state.ok) {
    return (
      <FormSuccess
        title="Message sent"
        message={state.message}
        resetLabel="Send another message"
        onReset={onReset}
      />
    )
  }

  return (
    <form action={formAction} onSubmit={onSubmit} className="relative grid gap-5 sm:grid-cols-2">
      <HoneypotField idPrefix="contact" />

      <Field id="contact-name" label="Your name" required errors={errors.name}>
        <Input {...describedBy('contact-name', errors.name)} name="name" required maxLength={120} autoComplete="name" />
      </Field>

      <Field id="contact-email" label="Email" required errors={errors.email}>
        <Input
          {...describedBy('contact-email', errors.email)}
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
        />
      </Field>

      <Field id="contact-subject" label="Subject" hint="Optional." errors={errors.subject} className="sm:col-span-2">
        <Input
          {...describedBy('contact-subject', errors.subject, true)}
          name="subject"
          maxLength={200}
          placeholder="Order question, wholesale, press…"
        />
      </Field>

      <Field id="contact-message" label="Message" required errors={errors.message} className="sm:col-span-2">
        <Textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          maxLength={MESSAGE_MAX}
          onChange={(event) => setMessageLength(event.target.value.length)}
          aria-invalid={Boolean(errors.message?.length) || undefined}
          aria-describedby={`contact-message-count${errors.message?.length ? ' contact-message-description' : ''}`}
          placeholder="How can we help? If it's about an order, include your order number."
        />
        <CharacterCount id="contact-message-count" count={messageLength} max={MESSAGE_MAX} />
      </Field>

      <div className="grid gap-3 sm:col-span-2">
        <FormMessage state={state} />
        <SubmitButton size="lg" pendingText="Sending…" className="w-full">
          Send message
        </SubmitButton>
      </div>
    </form>
  )
}
