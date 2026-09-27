import { ArrowRight, Plus } from 'lucide-react'
import Link from 'next/link'

import type { FaqItem } from '@/components/content/faq-content'

/**
 * Accessible accordion built on native <details>/<summary>: keyboard and
 * screen-reader support come for free and it works without JavaScript.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card">
      {items.map((item) => (
        <details key={item.question} className="group px-5 sm:px-6">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <Plus
              className="size-5 shrink-0 text-clay transition-transform duration-200 group-open:rotate-45"
              aria-hidden="true"
            />
          </summary>
          <div className="pb-5 text-[15px] leading-7 text-muted-foreground">
            <p>{item.answer}</p>
            {item.link && (
              <Link
                href={item.link.href}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-clay underline-offset-4 hover:underline"
              >
                {item.link.label} <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </details>
      ))}
    </div>
  )
}
