'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { setStepChecked } from '@/components/todo/checklist-store'
import type { ChecklistStep } from '@/components/todo/types'
import { cn } from '@/lib/utils'

/**
 * One numbered step: a tick box, a title that expands or collapses the
 * instructions, and the instructions themselves. Finished steps fold away so
 * the remaining work stands out; the owner can reopen them at any time.
 */
export function ChecklistStepItem({ step, number, done }: { step: ChecklistStep; number: number; done: boolean }) {
  // null = follow the default (open while the step is still to do).
  const [openOverride, setOpenOverride] = useState<boolean | null>(null)
  const open = openOverride ?? !done
  const contentId = `${step.id}-content`

  return (
    <li className="py-3">
      <div className="flex items-start gap-1 sm:gap-2">
        <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-accent">
          <input
            type="checkbox"
            checked={done}
            onChange={(event) => setStepChecked(step.id, event.target.checked)}
            aria-label={`Mark step ${number}, ${step.title}, as done`}
            className="size-5 cursor-pointer accent-clay"
          />
        </label>
        <h3 className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setOpenOverride(!open)}
            aria-expanded={open}
            aria-controls={contentId}
            className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-1 py-2 text-left hover:text-clay"
          >
            <span className="shrink-0 text-muted-foreground tabular-nums">{number}.</span>
            <span
              className={cn(
                'min-w-0 flex-1 font-semibold',
                done && 'text-muted-foreground line-through decoration-1',
              )}
            >
              {step.title}
            </span>
            {step.verified && (
              <Badge tone="success">Verified</Badge>
            )}
            <ChevronDown
              className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
              aria-hidden="true"
            />
          </button>
        </h3>
      </div>

      <div
        id={contentId}
        hidden={!open}
        className="mt-1 space-y-3 pb-2 text-[15px] leading-7 text-muted-foreground sm:pl-14 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5"
      >
        {step.verified && (
          <p className="text-sm font-medium text-success">Checked automatically: this is already done.</p>
        )}
        {step.content}
      </div>
    </li>
  )
}
