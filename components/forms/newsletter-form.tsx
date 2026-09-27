'use client'

import { CheckCircle2 } from 'lucide-react'
import { useId } from 'react'

import { HoneypotField } from '@/components/forms/honeypot-field'
import { describedBy, useFormAction } from '@/components/forms/use-form-action'
import { SubmitButton } from '@/components/ui/form-status'
import { Input } from '@/components/ui/input'
import { subscribeToNewsletter } from '@/lib/actions/newsletter'

/**
 * Inline email signup (used in the footer). `source` records where people
 * signed up, e.g. "footer" or "about", so you can see which spots work.
 */
export function NewsletterForm({ source = 'footer' }: { source?: string }) {
  const { state, formAction, onSubmit } = useFormAction(subscribeToNewsletter)
  const inputId = `${useId()}-newsletter-email`
  const errorText = state.fieldErrors?.email?.join(' ') ?? (state.ok === false ? state.message : undefined)

  return (
    // The live region announces the switch from the form to the confirmation.
    <div aria-live="polite">
      {state.ok ? (
        <p className="flex items-center gap-2 rounded-xl bg-success/10 px-3.5 py-3 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      ) : (
        <form action={formAction} onSubmit={onSubmit} className="relative">
          <HoneypotField idPrefix={inputId} />
          <input type="hidden" name="source" value={source} />
          <label htmlFor={inputId} className="sr-only">
            Email address
          </label>
          <div className="flex gap-2">
            <Input
              {...describedBy(inputId, errorText ? [errorText] : undefined)}
              type="email"
              name="email"
              required
              autoComplete="email"
              maxLength={254}
              placeholder="you@example.com"
              className="flex-1"
            />
            <SubmitButton pendingText="Joining…" className="shrink-0">
              Subscribe
            </SubmitButton>
          </div>
          {errorText && (
            <p id={`${inputId}-description`} role="alert" className="mt-2 text-xs text-destructive">
              {errorText}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
