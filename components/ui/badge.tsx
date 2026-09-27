import type { Tone } from '@/lib/constants'
import { cn } from '@/lib/utils'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground ring-border',
  info: 'bg-info/10 text-info ring-info/20',
  success: 'bg-success/10 text-success ring-success/20',
  warning: 'bg-warning/10 text-warning ring-warning/20',
  danger: 'bg-destructive/10 text-destructive ring-destructive/20',
}

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: React.ComponentProps<'span'> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  )
}

/**
 * Status pill driven by the maps in lib/constants.ts:
 *   <StatusBadge meta={ORDER_STATUS[order.status]} />
 */
export function StatusBadge({ meta, className }: { meta: { label: string; tone: Tone }; className?: string }) {
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  )
}
