import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

/** Title row at the top of every admin page. */
export function AdminPageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel = 'Back',
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  /** Buttons/links shown on the right (stacked under the title on phones). */
  actions?: React.ReactNode
  backHref?: string
  backLabel?: string
  className?: string
}) {
  return (
    <div className={cn('mb-6 sm:mb-8', className)}>
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
