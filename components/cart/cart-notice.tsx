import { CircleAlert, Info, X } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Inline message for the cart and checkout pages. Errors use role="alert" so
 * screen readers announce them at once; everything else uses role="status".
 */
export function CartNotice({
  tone = 'info',
  children,
  onDismiss,
  className,
}: {
  tone?: 'info' | 'error'
  children: React.ReactNode
  /** Shows a close button (client components only). */
  onDismiss?: () => void
  className?: string
}) {
  const Icon = tone === 'error' ? CircleAlert : Info
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-2xl px-4 py-3 text-sm',
        tone === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-linen text-foreground',
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="-my-2 -mr-2 flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-foreground/5"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
