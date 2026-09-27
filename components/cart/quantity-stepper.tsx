'use client'

import { Minus, Plus } from 'lucide-react'

const stepButtonClass =
  'flex size-10 items-center justify-center text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent'

/** Minus / number / plus control. The number is announced politely when it changes. */
export function QuantityStepper({
  value,
  max,
  itemLabel,
  onChange,
  disabled = false,
}: {
  value: number
  max: number
  /** Product name used in the button labels, e.g. "Sol Wall Hanging (Medium)". */
  itemLabel: string
  onChange: (quantity: number) => void
  disabled?: boolean
}) {
  return (
    <div
      role="group"
      aria-label={`Quantity of ${itemLabel}`}
      className="inline-flex items-center overflow-hidden rounded-xl border border-input bg-card"
    >
      <button
        type="button"
        className={stepButtonClass}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label={`Decrease quantity of ${itemLabel}`}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span className="min-w-9 text-center text-sm font-semibold tabular-nums" aria-live="polite" aria-atomic="true">
        <span className="sr-only">Quantity </span>
        {value}
      </span>
      <button
        type="button"
        className={stepButtonClass}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label={`Increase quantity of ${itemLabel}`}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
