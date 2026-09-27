'use client'

import { Badge } from '@/components/ui/badge'
import { isStepDone, useChecklistTicks } from '@/components/todo/checklist-store'
import { ChecklistStepItem } from '@/components/todo/checklist-step'
import { ProgressBar } from '@/components/todo/progress-bar'
import type { ChecklistSection } from '@/components/todo/types'

/** A lettered section card: title, why it matters, progress and its numbered steps. */
export function ChecklistSectionCard({ section }: { section: ChecklistSection }) {
  const ticks = useChecklistTicks()
  const done = section.steps.filter((step) => isStepDone(ticks, step)).length
  const total = section.steps.length
  const titleId = `section-${section.id}-title`

  return (
    <section
      id={`section-${section.id}`}
      aria-labelledby={titleId}
      className="scroll-mt-6 rounded-2xl border border-border bg-card p-4 sm:p-6"
    >
      <header className="flex gap-3 sm:gap-4">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sand font-serif text-xl text-clay-dark"
        >
          {section.letter}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 id={titleId} className="font-serif text-2xl leading-tight tracking-tight">
              <span className="sr-only">Section {section.letter}: </span>
              {section.title}
            </h2>
            {section.badge && <Badge tone={section.badge.tone}>{section.badge.label}</Badge>}
          </div>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{section.summary}</p>
          <div className="mt-3 flex items-center gap-3">
            <ProgressBar done={done} total={total} label={`${section.title} progress`} className="max-w-48" />
            <span className="text-xs font-medium whitespace-nowrap text-muted-foreground tabular-nums">
              {done} of {total} done
            </span>
          </div>
        </div>
      </header>

      {section.intro && <div className="mt-5 space-y-3">{section.intro}</div>}

      <ol className="mt-4 divide-y divide-border border-t border-border">
        {section.steps.map((step, index) => (
          <ChecklistStepItem key={step.id} step={step} number={index + 1} done={isStepDone(ticks, step)} />
        ))}
      </ol>
    </section>
  )
}
