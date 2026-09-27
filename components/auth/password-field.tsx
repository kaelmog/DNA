'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

import type { TextFieldProps } from '@/components/auth/text-field'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

/** Password input with a show/hide toggle, so people can check what they typed on a phone keyboard. */
export function PasswordField({ id, label, hint, errors, required, className, ...inputProps }: Omit<TextFieldProps, 'type'>) {
  const [visible, setVisible] = useState(false)
  const hasErrors = Boolean(errors?.length)

  return (
    <Field id={id} label={label} hint={hint} errors={errors} required={required} className={className}>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          required={required}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={hasErrors || undefined}
          aria-describedby={hint || hasErrors ? `${id}-description` : undefined}
          className="pr-12"
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label="Show password"
          aria-pressed={visible}
          aria-controls={id}
          className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
    </Field>
  )
}
