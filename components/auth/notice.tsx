import { CircleAlert, CircleCheck, Info } from 'lucide-react'

import { cn } from '@/lib/utils'

type NoticeTone = 'success' | 'error' | 'info'

const toneStyles: Record<NoticeTone, string> = {
  success: 'bg-success/10 text-success ring-success/20',
  error: 'bg-destructive/10 text-destructive ring-destructive/20',
  info: 'bg-info/10 text-info ring-info/20',
}

const toneIcons = { success: CircleCheck, error: CircleAlert, info: Info } as const

/**
 * Inline banner for page-level messages, such as "Your email is confirmed" after
 * following a link. Errors use role="alert" so screen readers announce them.
 */
export function Notice({
  tone = 'info',
  className,
  children,
}: {
  tone?: NoticeTone
  className?: string
  children: React.ReactNode
}) {
  const Icon = toneIcons[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm leading-6 ring-1 ring-inset', toneStyles[tone], className)}
    >
      <Icon className="mt-1 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
