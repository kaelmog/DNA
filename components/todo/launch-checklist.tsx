'use client'

import { RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ChecklistNav, type SectionProgress } from '@/components/todo/checklist-nav'
import { ChecklistSectionCard } from '@/components/todo/checklist-section'
import { isStepDone, resetChecklist, useChecklistTicks } from '@/components/todo/checklist-store'
import { ProgressBar } from '@/components/todo/progress-bar'
import type { ChecklistSection } from '@/components/todo/types'

function OverallProgress({ done, total }: { done: number; total: number }) {
  function handleReset() {
    if (window.confirm('Clear all your ticks on this checklist? Steps the site verified stay ticked.')) resetChecklist()
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl tracking-tight">Your progress</h2>
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
            <span className="font-semibold text-foreground tabular-nums">
              {done} of {total}
            </span>{' '}
            steps done{done === total ? '. Ready to launch!' : '.'}
          </p>
        </div>
        <Button variant="ghost" onClick={handleReset} className="px-3 text-muted-foreground">
          <RotateCcw aria-hidden="true" />
          Reset ticks
        </Button>
      </div>
      <ProgressBar done={done} total={total} label="Overall launch progress" className="mt-4 h-2.5" />
      <p className="mt-3 text-xs text-muted-foreground">
        Your ticks are saved in this browser only. Steps marked “Verified” were checked by the site itself.
      </p>
    </div>
  )
}

/** The interactive checklist: overall progress, section navigation and every section. */
export function LaunchChecklist({ sections }: { sections: ChecklistSection[] }) {
  const ticks = useChecklistTicks()

  const progress: SectionProgress[] = sections.map((section) => ({
    id: section.id,
    letter: section.letter,
    title: section.title,
    done: section.steps.filter((step) => isStepDone(ticks, step)).length,
    total: section.steps.length,
  }))
  const done = progress.reduce((sum, section) => sum + section.done, 0)
  const total = progress.reduce((sum, section) => sum + section.total, 0)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-10">
      <ChecklistNav sections={progress} />
      <div className="grid min-w-0 grid-cols-1 gap-6">
        <OverallProgress done={done} total={total} />
        {sections.map((section) => (
          <ChecklistSectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  )
}
