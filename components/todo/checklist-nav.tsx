'use client'

import { ChevronDown, CircleCheck, ListChecks } from 'lucide-react'
import { useRef } from 'react'

import { cn } from '@/lib/utils'

export interface SectionProgress {
  id: string
  letter: string
  title: string
  done: number
  total: number
}

function SectionLinks({ sections, onNavigate }: { sections: SectionProgress[]; onNavigate?: () => void }) {
  return (
    <ol className="grid grid-cols-1 gap-0.5">
      {sections.map((section) => {
        const complete = section.done === section.total
        return (
          <li key={section.id}>
            <a
              href={`#section-${section.id}`}
              onClick={onNavigate}
              className="flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-accent"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  complete ? 'bg-success/15 text-success' : 'bg-sand text-clay-dark',
                )}
              >
                {complete ? <CircleCheck className="size-4" /> : section.letter}
              </span>
              <span className="min-w-0 flex-1 leading-5">{section.title}</span>
              <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                {section.done}/{section.total}
                <span className="sr-only"> steps done</span>
              </span>
            </a>
          </li>
        )
      })}
    </ol>
  )
}

/**
 * Section links with progress. On phones it is a collapsible "Jump to a section"
 * menu that closes after a tap; from lg up it is a sticky sidebar.
 */
export function ChecklistNav({ sections }: { sections: SectionProgress[] }) {
  const mobileMenu = useRef<HTMLDetailsElement>(null)

  return (
    <>
      <details ref={mobileMenu} className="group rounded-2xl border border-border bg-card lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-medium [&::-webkit-details-marker]:hidden">
          <ListChecks className="size-4 text-clay" aria-hidden="true" />
          Jump to a section
          <ChevronDown
            className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <nav aria-label="Checklist sections" className="border-t border-border p-2">
          <SectionLinks sections={sections} onNavigate={() => mobileMenu.current?.removeAttribute('open')} />
        </nav>
      </details>

      <nav
        aria-label="Checklist sections"
        className="hidden lg:sticky lg:top-6 lg:block lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto"
      >
        <p className="eyebrow mb-3 px-2.5">Sections</p>
        <SectionLinks sections={sections} />
      </nav>
    </>
  )
}
