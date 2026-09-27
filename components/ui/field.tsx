import { cn } from '@/lib/utils'

export function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return <label className={cn('text-sm font-medium text-foreground', className)} {...props} />
}

interface FieldProps {
  /** Must match the input's id so the label is clickable and read by screen readers. */
  id: string
  label: React.ReactNode
  /** Short help text under the input. */
  hint?: React.ReactNode
  /** Validation errors, usually `state.fieldErrors?.fieldName`. */
  errors?: string[]
  required?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Label + input + hint + error message, laid out consistently.
 * Give the input `id={id}` and `aria-describedby={`${id}-description`}` when using hint/errors,
 * and `aria-invalid={Boolean(errors?.length)}`.
 */
export function Field({ id, label, hint, errors, required, className, children }: FieldProps) {
  const hasError = Boolean(errors?.length)
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="text-clay" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </Label>
      {children}
      {(hint || hasError) && (
        <p id={`${id}-description`} className={cn('text-xs', hasError ? 'text-destructive' : 'text-muted-foreground')}>
          {hasError ? errors!.join(' ') : hint}
        </p>
      )}
    </div>
  )
}
