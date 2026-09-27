import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export interface TextFieldProps extends Omit<React.ComponentProps<'input'>, 'id'> {
  id: string
  label: React.ReactNode
  hint?: React.ReactNode
  errors?: string[]
}

/**
 * A labelled input with hint and error text wired up for screen readers
 * (aria-describedby / aria-invalid). Keeps the account and auth forms short.
 */
export function TextField({ id, label, hint, errors, required, className, ...inputProps }: TextFieldProps) {
  const hasErrors = Boolean(errors?.length)
  return (
    <Field id={id} label={label} hint={hint} errors={errors} required={required} className={className}>
      <Input
        id={id}
        required={required}
        aria-invalid={hasErrors || undefined}
        aria-describedby={hint || hasErrors ? `${id}-description` : undefined}
        {...inputProps}
      />
    </Field>
  )
}
