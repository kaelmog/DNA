import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'

type CalloutTone = 'info' | 'warning' | 'danger' | 'success'

const toneStyles: Record<CalloutTone, { box: string; icon: string; Icon: typeof Info }> = {
  info: { box: 'border-info/25 bg-info/5', icon: 'text-info', Icon: Info },
  warning: { box: 'border-warning/30 bg-warning/10', icon: 'text-warning', Icon: TriangleAlert },
  danger: { box: 'border-destructive/25 bg-destructive/5', icon: 'text-destructive', Icon: CircleAlert },
  success: { box: 'border-success/25 bg-success/5', icon: 'text-success', Icon: CircleCheck },
}

/** A highlighted note inside the checklist: tips, warnings and "do not do this" boxes. */
export function Callout({
  tone = 'info',
  title,
  className,
  children,
}: {
  tone?: CalloutTone
  title?: string
  className?: string
  children: React.ReactNode
}) {
  const { box, icon, Icon } = toneStyles[tone]
  return (
    <div role="note" className={cn('flex gap-3 rounded-xl border px-4 py-3 text-sm leading-6', box, className)}>
      <Icon className={cn('mt-1 size-4 shrink-0', icon)} aria-hidden="true" />
      <div className="min-w-0 text-foreground">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn('text-muted-foreground', title && 'mt-0.5')}>{children}</div>
      </div>
    </div>
  )
}
