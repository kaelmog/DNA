import { CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Shown in place of a form after it was sent. `onReset` brings back an empty
 * form so the visitor can send another message.
 */
export function FormSuccess({
  title,
  message,
  resetLabel,
  onReset,
  className,
}: {
  title: string
  message?: string
  resetLabel?: string
  onReset?: () => void
  className?: string
}) {
  return (
    <div
      role="status"
      className={cn('flex flex-col items-center rounded-2xl bg-success/10 px-6 py-10 text-center', className)}
    >
      <CheckCircle2 className="size-10 text-success" aria-hidden="true" />
      <p className="mt-4 font-serif text-2xl tracking-tight text-foreground">{title}</p>
      {message && <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{message}</p>}
      {onReset && resetLabel && (
        <Button variant="outline" className="mt-6" onClick={onReset}>
          {resetLabel}
        </Button>
      )}
    </div>
  )
}
