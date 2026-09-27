'use client'

import { Check, Copy } from 'lucide-react'
import { useRef, useState } from 'react'

import { cn } from '@/lib/utils'

type CopyStatus = 'idle' | 'copied' | 'failed'

const STATUS_RESET_MS = 2000

/**
 * Copies text to the clipboard. The Clipboard API only works on https:// and
 * localhost, so a hidden textarea is the fallback (e.g. a phone opening the
 * dev server through the computer's network address).
 */
async function copyText(text: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Permission denied or unsupported: try the fallback below.
  }

  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    textarea.remove()
    previousFocus?.focus() // keep keyboard users where they were
  }
}

const statusText: Record<CopyStatus, string> = { idle: 'Copy', copied: 'Copied', failed: 'Copy failed' }

export function CopyButton({
  text,
  label = 'Copy',
  onDark = false,
  className,
}: {
  text: string
  /** Accessible name, e.g. "Copy schema.sql". Should start with "Copy". */
  label?: string
  /** Light-on-dark styling for use inside code blocks. */
  onDark?: boolean
  className?: string
}) {
  const [status, setStatus] = useState<CopyStatus>('idle')
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  async function handleCopy() {
    const copied = await copyText(text)
    setStatus(copied ? 'copied' : 'failed')
    clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setStatus('idle'), STATUS_RESET_MS)
  }

  const Icon = status === 'copied' ? Check : Copy

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={label}
        className={cn(
          'inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors',
          onDark
            ? 'text-cream/90 hover:bg-cream/10 hover:text-cream focus-visible:ring-2 focus-visible:ring-cream/50'
            : 'border border-input bg-card text-foreground hover:bg-accent',
          className,
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
        {statusText[status]}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {status === 'copied' && 'Copied to the clipboard.'}
        {status === 'failed' && 'Could not copy. Select the text and copy it with your keyboard instead.'}
      </span>
    </>
  )
}
