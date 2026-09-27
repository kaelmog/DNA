import { cn } from '@/lib/utils'

/**
 * Minimal table primitives. The wrapper scrolls horizontally on small screens
 * so wide tables never break the page layout.
 */
export function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card">
      <table className={cn('w-full min-w-[640px] text-left text-sm', className)} {...props} />
    </div>
  )
}

export function THead({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      className={cn('border-b border-border bg-muted/60 text-xs tracking-wide text-muted-foreground uppercase', className)}
      {...props}
    />
  )
}

export function TBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={cn('divide-y divide-border', className)} {...props} />
}

export function TR({ className, ...props }: React.ComponentProps<'tr'>) {
  return <tr className={cn('transition-colors hover:bg-muted/40', className)} {...props} />
}

export function TH({ className, ...props }: React.ComponentProps<'th'>) {
  return <th scope="col" className={cn('px-4 py-3 font-medium', className)} {...props} />
}

export function TD({ className, ...props }: React.ComponentProps<'td'>) {
  return <td className={cn('px-4 py-3 align-middle', className)} {...props} />
}
