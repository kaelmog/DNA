'use client'

import { Loader2, Lock } from 'lucide-react'
import Link from 'next/link'

import { Button, buttonVariants } from '@/components/ui/button'
import type { CheckoutMode } from '@/lib/checkout/types'

/**
 * Full-width checkout call to action in the bag.
 * - Stripe mode: a button that prepares Stripe Checkout (with a pending state).
 * - Manual mode: a link to /checkout, where the shopper adds their address.
 */
export function CheckoutButton({
  mode,
  pending,
  disabled,
  onClick,
}: {
  mode: CheckoutMode
  pending: boolean
  disabled: boolean
  onClick: () => void
}) {
  if (mode === 'manual') {
    // A disabled link is not a thing in HTML, so the unavailable state is a disabled button.
    if (disabled) {
      return (
        <Button size="lg" className="w-full" disabled>
          <Lock aria-hidden="true" />
          Continue to checkout
        </Button>
      )
    }
    return (
      <Link href="/checkout" className={buttonVariants({ size: 'lg', className: 'w-full' })}>
        <Lock aria-hidden="true" />
        Continue to checkout
      </Link>
    )
  }

  return (
    <Button size="lg" className="w-full" onClick={onClick} disabled={disabled || pending} aria-busy={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Lock aria-hidden="true" />}
      {pending ? 'Opening secure checkout…' : 'Checkout'}
    </Button>
  )
}
