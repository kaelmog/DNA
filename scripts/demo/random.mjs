/**
 * Deterministic helpers for the demo seed. Everything "random" comes from a
 * seeded generator, so every run creates exactly the same shape of data.
 * Dates are relative to the moment the script starts, so the store always
 * looks recently active no matter when it is (re)seeded.
 */
import { createHash } from 'node:crypto'

export const HOUR_MS = 60 * 60 * 1000
export const DAY_MS = 24 * HOUR_MS

/** mulberry32: tiny, fast and good enough for picking demo data. */
export function createRng(seed) {
  let state = seed >>> 0

  function next() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    between: (min, max) => min + (max - min) * next(),
    int: (min, max) => Math.floor(min + (max - min + 1) * next()),
    chance: (probability) => next() < probability,
    pick: (items) => items[Math.floor(next() * items.length)],

    /** Picks one item; `weightOf` returns a positive number per item. */
    weighted(items, weightOf) {
      const total = items.reduce((sum, item) => sum + weightOf(item), 0)
      let target = next() * total
      for (const item of items) {
        target -= weightOf(item)
        if (target < 0) return item
      }
      return items[items.length - 1]
    },

    /** Returns a shuffled copy (Fisher-Yates). */
    shuffle(items) {
      const copy = [...items]
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy
    },
  }
}

/**
 * A stable UUID derived from a key, so reruns give demo rows the same ids
 * (and the same admin URLs). Shaped like a v4 UUID.
 */
export function demoId(key) {
  const hex = createHash('sha256').update(`knotted-studio-demo:${key}`).digest('hex')
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

/** Time helpers anchored to one fixed "now" for the whole run. All values are epoch milliseconds. */
export function createClock(nowMs) {
  return {
    nowMs,
    daysAgo: (days) => nowMs - days * DAY_MS,
    daysAhead: (days) => nowMs + days * DAY_MS,
    ageInDays: (ms) => (nowMs - ms) / DAY_MS,
  }
}

export const toIso = (ms) => (ms == null ? null : new Date(ms).toISOString())
export const toDate = (ms) => new Date(ms).toISOString().slice(0, 10)
