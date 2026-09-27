import { Minus, Plus } from 'lucide-react'
import { useId } from 'react'

import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  max: number
  onChange: (quantity: number) => void
  disabled?: boolean
  className?: string
}

const stepButtonClass =
  'flex size-11 cursor-pointer items-center justify-center rounded-xl text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40'

/** Minus / count / plus control, clamped between 1 and `max`. */
export function QuantityStepper({ value, max, onChange, disabled = false, className }: QuantityStepperProps) {
  const labelId = useId()

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={cn('inline-flex h-12 shrink-0 items-center rounded-xl border border-input bg-card', className)}
    >
      <span id={labelId} className="sr-only">
        Quantity
      </span>
      <button
        type="button"
        className={stepButtonClass}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <output aria-live="polite" className="w-7 text-center text-sm font-medium tabular-nums">
        {value}
      </output>
      <button
        type="button"
        className={stepButtonClass}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
