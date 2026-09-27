'use client'

import { Loader2, Tag, X } from 'lucide-react'
import { useState, useTransition } from 'react'

import { applyDiscountCode } from '@/app/(shop)/cart/actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { DISCOUNT_CODE_PATTERN, normalizeDiscountCode } from '@/lib/checkout/rules'
import type { AppliedDiscount } from '@/lib/checkout/types'
import { formatMoney } from '@/lib/format'

function describeRule(discount: AppliedDiscount, currency: string) {
  return discount.discount_type === 'percentage' ? `${discount.value}% off` : `${formatMoney(discount.value, currency)} off`
}

/** Apply or remove a discount code. The server checks the code; the cart only shows an estimate. */
export function DiscountCodeForm({
  applied,
  subtotalCents,
  currency,
  onApply,
  onRemove,
}: {
  applied: AppliedDiscount | null
  subtotalCents: number
  currency: string
  onApply: (discount: AppliedDiscount) => void
  onRemove: () => void
}) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-clay/40 bg-linen/60 py-1 pr-1 pl-3">
        <p className="flex min-w-0 items-center gap-2 text-sm" role="status">
          <Tag className="size-4 shrink-0 text-clay" aria-hidden="true" />
          <span className="truncate">
            <span className="font-semibold tracking-wide">{applied.code}</span>
            <span className="text-muted-foreground"> · {describeRule(applied, currency)}</span>
          </span>
        </p>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove discount code ${applied.code}`}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    )
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = normalizeDiscountCode(code)
    if (!DISCOUNT_CODE_PATTERN.test(normalized)) {
      setError('Enter a code of 3 to 32 letters or numbers.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const result = await applyDiscountCode(normalized, subtotalCents)
        if (result.ok) {
          onApply({ code: result.code, discount_type: result.discount_type, value: result.value })
          setCode('')
        } else {
          setError(result.message)
        }
      } catch {
        setError('We couldn’t check that code. Please try again.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-1.5">
      <Label htmlFor="discount-code">Discount code</Label>
      <div className="flex gap-2">
        <Input
          id="discount-code"
          name="discount-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="e.g. WELCOME10"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={32}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'discount-code-error' : undefined}
          className="uppercase placeholder:normal-case"
        />
        <Button type="submit" variant="outline" disabled={isPending || !code.trim()} aria-busy={isPending}>
          {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Apply
        </Button>
      </div>
      {error && (
        <p id="discount-code-error" role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
