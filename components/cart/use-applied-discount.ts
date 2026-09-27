'use client'

import { useSyncExternalStore } from 'react'

import { DISCOUNT_CODE_PATTERN } from '@/lib/checkout/rules'
import type { AppliedDiscount } from '@/lib/checkout/types'

/**
 * The discount code applied in the cart, kept in sessionStorage so it survives
 * a round trip to Stripe ("back" from checkout) but not a closed tab.
 * The rule is only used for the on-screen estimate; checkout re-validates the code.
 */

const STORAGE_KEY = 'knotted-discount-v1'

let current: AppliedDiscount | null | undefined // undefined = not read from storage yet
const listeners = new Set<() => void>()

function parse(raw: string | null): AppliedDiscount | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<AppliedDiscount>
    const isValid =
      typeof value.code === 'string' &&
      DISCOUNT_CODE_PATTERN.test(value.code) &&
      (value.discount_type === 'percentage' || value.discount_type === 'fixed_amount') &&
      typeof value.value === 'number' &&
      value.value > 0
    return isValid ? (value as AppliedDiscount) : null
  } catch {
    return null
  }
}

function read() {
  if (current === undefined) {
    try {
      current = parse(window.sessionStorage.getItem(STORAGE_KEY))
    } catch {
      current = null // storage blocked (private mode): keep the code for this page view only
    }
  }
  return current
}

function write(discount: AppliedDiscount | null) {
  current = discount
  try {
    if (discount) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(discount))
    else window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore: the in-memory value still works.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function clearAppliedDiscount() {
  write(null)
}

/** `[discount, setDiscount]` for the cart. Always null during server rendering. */
export function useAppliedDiscount() {
  const discount = useSyncExternalStore(subscribe, read, () => null)
  return [discount, write] as const
}
