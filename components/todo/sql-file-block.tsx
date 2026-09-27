'use client'

import { ChevronDown } from 'lucide-react'

import { Callout } from '@/components/todo/callout'
import { CopyButton } from '@/components/todo/copy-button'
import type { SqlFile } from '@/components/todo/types'

/**
 * A whole SQL file with a Copy button that works while the file is collapsed,
 * so the owner can paste it straight into the Supabase SQL Editor.
 * Client component for the same reason as CodeBlock: the file is sent only once.
 */
export function SqlFileBlock({ file }: { file: SqlFile }) {
  if (!file.ok) {
    return (
      <Callout tone="warning" title={`Could not read supabase/${file.name}`}>
        Open the file from the <code className="font-mono">supabase</code> folder of the project in a text editor and
        copy it from there.
      </Callout>
    )
  }

  const lineCount = file.lineCount.toLocaleString('en-US')

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-foreground">supabase/{file.name}</p>
          <p className="text-xs text-muted-foreground">{lineCount} lines</p>
        </div>
        <CopyButton text={file.content} label={`Copy ${file.name}`} />
      </div>
      <details className="group border-t border-border">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 text-sm font-medium text-foreground hover:bg-accent/60 [&::-webkit-details-marker]:hidden">
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
          <span className="group-open:hidden">Show the SQL ({lineCount} lines)</span>
          <span className="hidden group-open:inline">Hide the SQL</span>
        </summary>
        <pre className="max-h-[28rem] overflow-auto bg-espresso p-4 font-mono text-xs leading-5 text-cream">
          <code>{file.content}</code>
        </pre>
      </details>
    </div>
  )
}
