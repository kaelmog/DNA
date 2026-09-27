'use client'

import { CopyButton } from '@/components/todo/copy-button'

/**
 * A snippet to copy: SQL, a URL, a command, an email template link.
 * It is a client component so the snippet travels to the browser once, as a
 * prop, instead of once as rendered text and again for the copy button.
 */
export function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="overflow-hidden rounded-xl bg-espresso text-cream">
      <div className="flex min-h-11 items-center justify-between gap-3 border-b border-cream/10 py-0.5 pr-0.5 pl-4">
        <span className="truncate text-xs font-medium text-cream/70">{label ?? 'Copy and paste'}</span>
        <CopyButton text={code} label={label ? `Copy ${label}` : 'Copy snippet'} onDark />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6">
        <code>{code}</code>
      </pre>
    </div>
  )
}
