'use client'

import { useCallback, useEffect, useState } from 'react'

import { refreshCart, releaseCheckout } from '@/app/(shop)/cart/actions'
import { cartStore, type CartLine } from '@/lib/cart-store'
import { reconcileCart } from '@/lib/checkout/reconcile-cart'

/**
 * A shopper returning from Stripe with "back" may still hold reserved stock.
 * Release it once per page load, before the first price/stock refresh, so their
 * own reservation never shows up as "sold out". Cached so React Strict Mode and
 * repeated refreshes do not call it twice.
 */
const releases = new Map<string, Promise<boolean>>()

function releaseOnce(orderId: string | null) {
  if (!orderId) return Promise.resolve(false)
  let release = releases.get(orderId)
  if (!release) {
    release = releaseCheckout(orderId).catch(() => false)
    releases.set(orderId, release)
  }
  return release
}

/**
 * Keeps the browser cart honest: whenever the set of products in the bag
 * changes (and on demand via `refresh`), live prices and stock are fetched
 * and the stored lines are corrected.
 */
export function useCartSync({
  lines,
  hydrated,
  currency,
  releaseOrderId,
}: {
  lines: CartLine[]
  hydrated: boolean
  currency: string
  releaseOrderId: string | null
}) {
  const [unavailableIds, setUnavailableIds] = useState<string[]>([])
  const [notices, setNotices] = useState<string[]>([])
  const [syncedKey, setSyncedKey] = useState<string | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)

  // Only the set of variants matters: quantity changes do not need a round trip.
  const variantKey = [...new Set(lines.map((line) => line.variantId))].sort().join(',')

  useEffect(() => {
    if (!hydrated || !variantKey) return
    let ignore = false

    releaseOnce(releaseOrderId)
      .then(() => refreshCart(variantKey.split(',')))
      .then((variants) => {
        if (ignore) return
        // Read the latest lines: the shopper may have changed quantities while we waited.
        const result = reconcileCart(cartStore.getSnapshot(), variants, currency)
        if (result.changed) cartStore.replace(result.lines)
        setUnavailableIds(result.unavailableIds)
        if (result.notices.length) setNotices(result.notices)
        setSyncedKey(variantKey)
      })
      .catch(() => {
        // Offline or server hiccup: keep the cart as is. Checkout re-validates everything anyway.
        if (!ignore) setSyncedKey(variantKey)
      })

    return () => {
      ignore = true
    }
  }, [hydrated, variantKey, currency, releaseOrderId, refreshCount])

  const refresh = useCallback(() => setRefreshCount((count) => count + 1), [])
  const dismissNotices = useCallback(() => setNotices([]), [])

  return {
    unavailableIds,
    notices,
    dismissNotices,
    refresh,
    /** True until the current set of products has been checked at least once. */
    isSyncing: hydrated && variantKey !== '' && syncedKey !== variantKey,
  }
}
