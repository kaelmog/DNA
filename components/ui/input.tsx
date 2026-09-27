import { cn } from '@/lib/utils'

/** Shared look for text inputs, selects and textareas. */
export const inputClassName =
  'w-full min-w-0 rounded-xl border border-input bg-card px-3.5 py-2.5 text-base text-foreground shadow-xs transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/20 sm:text-sm'

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input data-slot="input" className={cn(inputClassName, 'h-11', className)} {...props} />
}

export function Textarea({ className, rows = 4, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea data-slot="textarea" rows={rows} className={cn(inputClassName, 'resize-y', className)} {...props} />
}

/** Native <select>: accessible and works well on phones. */
export function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      data-slot="select"
      className={cn(
        inputClassName,
        "h-11 cursor-pointer appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b6057'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")] bg-[length:1.1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Checkbox({ className, ...props }: Omit<React.ComponentProps<'input'>, 'type'>) {
  return (
    <input
      type="checkbox"
      className={cn('size-4 shrink-0 cursor-pointer rounded border-input accent-clay', className)}
      {...props}
    />
  )
}
