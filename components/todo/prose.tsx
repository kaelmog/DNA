import { ChevronRight, ExternalLink as ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

/**
 * Small inline building blocks for the checklist instructions, so every step
 * formats code, dashboard paths and links the same way.
 */

const linkClassName = 'font-medium text-clay underline underline-offset-4 hover:text-clay-dark'

/** Inline code, file names and values to type, e.g. <Code>.env.local</Code>. */
export function Code({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <code
      className={cn(
        'rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] break-words text-foreground ring-1 ring-border ring-inset',
        className,
      )}
    >
      {children}
    </code>
  )
}

/** Where to click in a dashboard: <ClickPath items={['Authentication', 'URL Configuration']} />. */
export function ClickPath({ items }: { items: string[] }) {
  return (
    <span className="font-semibold text-foreground">
      {items.map((item, index) => (
        <span key={item}>
          {index > 0 && (
            <>
              <ChevronRight className="mx-0.5 inline size-3.5 align-[-2px] text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">, then </span>
            </>
          )}
          {item}
        </span>
      ))}
    </span>
  )
}

/** Link to a page of this site. */
export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={linkClassName}>
      {children}
    </Link>
  )
}

/** Link to another website. Opens in a new tab so the checklist stays open. */
export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
      {children}
      <ExternalLinkIcon className="ml-0.5 inline size-3.5 align-[-1px]" aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
