import { cn } from '@/lib/utils'

/** Centered page-width wrapper with responsive side padding. */
export function Container({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10', className)} {...props} />
}

/** Loading placeholder block. */
export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('animate-pulse rounded-xl bg-muted', className)} {...props} />
}

/** Friendly "nothing here yet" block. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-input px-6 py-14 text-center',
        className,
      )}
    >
      {icon && <div className="mb-3 text-muted-foreground [&_svg]:size-8">{icon}</div>}
      <p className="font-serif text-xl">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

/** Storefront page title block: eyebrow, heading and optional intro. */
export function PageHeading({
  eyebrow,
  title,
  description,
  className,
  children,
}: {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={cn('mb-8 sm:mb-10', className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">{title}</h1>
      {description && <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>}
      {children}
    </div>
  )
}
