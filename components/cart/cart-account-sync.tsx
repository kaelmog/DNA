'use client'

import { useEffect } from 'react'

import { getAccountCart, saveAccountCart } from '@/app/(shop)/cart/actions'
import { clearAppliedDiscount } from '@/components/cart/use-applied-discount'
import { cartStore } from '@/lib/cart-store'
import { mergeCartLines } from '@/lib/checkout/reconcile-cart'

/**
 * Makes the bag belong to the account instead of the browser. Rendered once
 * by the shop layout with the signed-in user's id:
 *  - signing in loads the account's saved bag and merges in anything added as a guest;
 *  - after that, every change is saved to the account (it follows the shopper to other devices);
 *  - signing out, or another account signing in, empties this browser's bag.
 */
export function CartAccountSync({ userId }: { userId: string | null }) {
  useEffect(() => {
    if (!userId) {
      forgetAccountBag()
      return
    }
    return followAccount(userId)
  }, [userId])

  return null
}

/** Signed out: an account's bag must not stay behind for whoever uses this browser next. */
function forgetAccountBag() {
  if (!cartStore.getAccount()) return // a guest bag stays
  cartStore.forgetAccount()
  clearAppliedDiscount()
}

/** Loads the account's bag, then saves each change the shopper makes. Returns the cleanup. */
function followAccount(userId: string) {
  let active = true
  let ready = false
  let saving = false
  let saveAgain = false

  const ownsBag = () => cartStore.getAccount()?.userId === userId

  /** Sends the whole bag. Changes made while a save is running are sent right after it. */
  async function save() {
    if (saving) {
      saveAgain = true
      return
    }
    saving = true
    try {
      do {
        saveAgain = false
        const lines = cartStore.getSnapshot()
        const saved = await saveAccountCart(lines.map(({ variantId, quantity }) => ({ variantId, quantity })))
        if (saved) cartStore.markSaved(userId, lines)
      } while (saveAgain && active && ownsBag())
    } catch {
      // Offline: the bag stays marked unsaved and is sent again on the next change or page load.
    } finally {
      saving = false
    }
  }

  async function load() {
    const account = cartStore.getAccount()
    // This browser has changes the account has not seen yet: keep them (they are saved below).
    if (account?.userId === userId && account.unsaved) return
    // Another account's bag: never merge it into this one.
    if (account && account.userId !== userId) cartStore.forgetAccount()

    const saved = await getAccountCart()
    if (!active || !saved) return

    const current = cartStore.getAccount()
    if (current?.userId === userId) {
      // Already this account's bag: take the saved copy, which may include changes from another device,
      // unless the shopper changed the bag while it loaded.
      if (!current.unsaved) cartStore.loadAccountBag(userId, saved)
      return
    }

    // A guest bag. Read it only now: the shopper may have added something while the saved bag loaded.
    const guestLines = cartStore.getSnapshot()
    cartStore.loadAccountBag(userId, mergeCartLines(saved, guestLines), { unsaved: guestLines.length > 0 })
  }

  const unsubscribe = cartStore.onShopperChange(() => {
    if (ready && ownsBag()) void save()
  })

  load()
    .catch(() => {
      // Offline or server hiccup: keep the bag as it is. The next page load tries again.
    })
    .finally(() => {
      if (!active) return
      ready = true
      if (ownsBag() && cartStore.getAccount()?.unsaved) void save()
    })

  return () => {
    active = false
    unsubscribe()
  }
}
