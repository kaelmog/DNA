import { Landmark } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * How manual-payment orders are paid, as a calm info card. The sentences come
 * from MANUAL_PAYMENT_INSTRUCTIONS (lib/checkout/manual-payment.ts), passed in
 * by a server component so the owner edits them in one place.
 */
export function PaymentInstructions({ instructions, className }: { instructions: string[]; className?: string }) {
  return (
    <div className={cn('flex gap-3 rounded-2xl bg-linen/70 p-4 text-sm leading-6 sm:gap-4 sm:p-5', className)}>
      <Landmark className="mt-0.5 size-5 shrink-0 text-clay" aria-hidden="true" />
      <div className="grid min-w-0 gap-2">
        {instructions.map((instruction) => (
          <p key={instruction}>{instruction}</p>
        ))}
      </div>
    </div>
  )
}
