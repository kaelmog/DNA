'use client'

import { useSyncExternalStore } from 'react'

import { cartStore } from '@/lib/cart-store'

/**
 * Reactive access to the cart from any client component:
 *
 *   const { lines, count, subtotalCents, add, setQuantity, remove, clear, hydrated } = useCart()
 *
 * `hydrated` is false during server rendering and the first client render.
 * Use it to avoid flashing "your cart is empty" before localStorage is read.
 */
export function useCart() {
  const lines = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot)
  const hydrated = useHydrated()

  return {
    lines,
    hydrated,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotalCents: lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0),
    add: cartStore.add,
    setQuantity: cartStore.setQuantity,
    remove: cartStore.remove,
    replace: cartStore.replace,
    clear: cartStore.clear,
  }
}

const noopSubscribe = () => () => {}

/** True once running in the browser after hydration. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}
