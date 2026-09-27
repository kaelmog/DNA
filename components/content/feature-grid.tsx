import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

/** Icon cards in a responsive grid: 1 column on phones, 2 on small screens, 4 on large. */
export function FeatureGrid({ features, className }: { features: Feature[]; className?: string }) {
  return (
    <ul className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {features.map(({ icon: Icon, title, description }) => (
        <li key={title} className="rounded-2xl border border-border bg-card p-6">
          <span className="flex size-11 items-center justify-center rounded-full bg-sand text-clay-dark">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <h3 className="mt-5 font-serif text-xl tracking-tight">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </li>
      ))}
    </ul>
  )
}
