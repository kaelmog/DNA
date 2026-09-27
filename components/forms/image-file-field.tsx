'use client'

import { ImagePlus, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/field'
import { ACCEPTED_IMAGE_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface ImageFileFieldProps {
  id: string
  name: string
  label: string
  maxBytes: number
  /** Server-side errors for this field. */
  errors?: string[]
}

function formatFileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Optional image upload that shows the chosen file name. Files that are too
 * large or not JPG/PNG/WebP are rejected right away, so the visitor never
 * waits for an upload the server would refuse. The server checks again.
 */
export function ImageFileField({ id, name, label, maxBytes, errors }: ImageFileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<{ name: string; size: number } | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)

  const maxLabel = `${maxBytes / (1024 * 1024)} MB`
  const errorText = clientError ?? errors?.join(' ')

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      setSelected(null)
      return
    }
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      event.target.value = ''
      setSelected(null)
      setClientError('Please choose a JPG, PNG or WebP image.')
      return
    }
    if (file.size > maxBytes) {
      event.target.value = ''
      setSelected(null)
      setClientError(`That image is ${formatFileSize(file.size)}. Please choose one under ${maxLabel}.`)
      return
    }
    setClientError(null)
    setSelected({ name: file.name, size: file.size })
  }

  function clearFile() {
    if (inputRef.current) inputRef.current.value = ''
    setSelected(null)
    setClientError(null)
  }

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div
        className={cn(
          'relative flex min-h-14 items-center gap-3 rounded-xl border border-dashed border-input bg-card px-3.5 py-2.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25 hover:bg-accent/50',
          errorText && 'border-destructive',
        )}
      >
        <ImagePlus className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1 text-sm">
          {selected ? (
            <>
              <p className="truncate font-medium">{selected.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(selected.size)}</p>
            </>
          ) : (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Choose an image</span> · JPG, PNG or WebP, up to {maxLabel}
            </p>
          )}
        </div>
        {/* The real input covers the box, so the whole area is clickable and keyboard-focusable. */}
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={handleChange}
          aria-invalid={Boolean(errorText) || undefined}
          aria-describedby={`${id}-description`}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        {selected && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={clearFile}
            aria-label={`Remove ${selected.name}`}
            className="relative z-10 size-10"
          >
            <X />
          </Button>
        )}
      </div>
      <p
        id={`${id}-description`}
        aria-live="polite"
        className={cn('text-xs', errorText ? 'text-destructive' : 'text-muted-foreground')}
      >
        {errorText ?? 'Optional. A photo of your space or a piece you love helps us understand your idea.'}
      </p>
    </div>
  )
}
