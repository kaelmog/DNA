'use client'

import { CheckCircle2, CircleAlert, Loader2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import type { ActionState } from '@/lib/actions'
import { cn } from '@/lib/utils'

/**
 * Submit button that disables itself and shows a spinner while its <form>'s
 * server action runs. Must be rendered inside the <form>.
 */
export function SubmitButton({
  children,
  pendingText = 'Saving…',
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus()
  // `disabled` is applied after the spread so a caller's prop can never switch off the pending guard.
  return (
    <Button type="submit" {...props} disabled={pending || disabled} aria-busy={pending} className={className}>
      {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
      {pending ? pendingText : children}
    </Button>
  )
}

/** Shows the success/error message from a server action's ActionState. */
export function FormMessage({ state, className }: { state: ActionState; className?: string }) {
  if (!state.message) return null
  const Icon = state.ok ? CheckCircle2 : CircleAlert
  return (
    <p
      role={state.ok ? 'status' : 'alert'}
      className={cn(
        'flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm',
        state.ok ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{state.message}</span>
    </p>
  )
}
