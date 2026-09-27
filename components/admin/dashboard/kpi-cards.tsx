import type { LucideIcon } from 'lucide-react'

export interface KpiItem {
  label: string
  value: string
  /** Small supporting line under the value, e.g. "12 orders". */
  hint?: string
  icon: LucideIcon
}

/** Row of headline numbers: two per row on phones, four on large screens. */
export function KpiCards({ items }: { items: KpiItem[] }) {
  return (
    <section aria-labelledby="kpi-heading">
      <h2 id="kpi-heading" className="sr-only">
        Key numbers
      </h2>
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {items.map(({ label, value, hint, icon: Icon }) => (
          <div key={label} className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <dt className="flex items-start justify-between gap-2 text-sm text-muted-foreground">
              <span>{label}</span>
              <span className="hidden rounded-full bg-secondary p-2 text-clay sm:inline-flex" aria-hidden="true">
                <Icon className="size-4" />
              </span>
            </dt>
            <dd className="mt-2 text-xl font-semibold tracking-tight break-words sm:mt-3 sm:text-2xl lg:text-3xl">
              {value}
            </dd>
            {hint && <dd className="mt-1 text-xs text-muted-foreground">{hint}</dd>}
          </div>
        ))}
      </dl>
    </section>
  )
}
