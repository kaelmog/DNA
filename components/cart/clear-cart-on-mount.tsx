'use client'

import { useEffect } from 'react'

import { clearAppliedDiscount } from '@/components/cart/use-applied-discount'
import { cartStore } from '@/lib/cart-store'

/**
 * Empties the bag (and the applied discount code) once an order is placed.
 * Rendered by the success page only after Stripe confirmed the checkout.
 */
export function ClearCartOnMount() {
  useEffect(() => {
    cartStore.clear()
    clearAppliedDiscount()
  }, [])

  return null
}
