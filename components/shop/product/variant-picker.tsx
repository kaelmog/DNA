import { useId } from 'react'

import { cn } from '@/lib/utils'

export interface VariantOption {
  id: string
  title: string
  soldOut: boolean
}

interface VariantPickerProps {
  options: VariantOption[]
  value: string
  onChange: (variantId: string) => void
}

/**
 * Variant choice as a native radio group styled as pills: arrow keys, labels
 * and screen readers all work without extra ARIA. Sold-out options stay
 * selectable so shoppers can see they exist.
 */
export function VariantPicker({ options, value, onChange }: VariantPickerProps) {
  const groupName = useId()

  return (
    <fieldset>
      <legend className="mb-2.5 text-sm font-medium">Choose an option</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.id} className="cursor-pointer">
            <input
              type="radio"
              name={groupName}
              value={option.id}
              checked={option.id === value}
              onChange={() => onChange(option.id)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-input bg-card px-4 text-sm transition-colors hover:border-clay',
                'peer-checked:border-espresso peer-checked:bg-espresso peer-checked:text-cream',
                'peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40',
              )}
            >
              <span className={cn(option.soldOut && 'line-through decoration-1')}>{option.title}</span>
              {option.soldOut && <span className="text-xs opacity-75">Sold out</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
