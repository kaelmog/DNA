/**
 * "Needed by" date rules for custom requests, shared by the page (the date
 * picker's min/max) and the server action (validation). Dates are plain
 * YYYY-MM-DD strings in UTC, so string comparison is date comparison.
 */

/** How far ahead a customer can ask for a piece. */
const MAX_YEARS_AHEAD = 2

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

/** Earliest (today) and latest allowed deadline. Call at request time, never at build time. */
export function deadlineBounds(now = new Date()) {
  const latest = new Date(now)
  latest.setUTCFullYear(latest.getUTCFullYear() + MAX_YEARS_AHEAD)
  return { min: toIsoDate(now), max: toIsoDate(latest) }
}

/** True for a real calendar date between today and the maximum. */
export function isAllowedDeadline(value: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  // Rejects impossible dates such as 2026-02-31, which Date would roll over.
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || toIsoDate(parsed) !== value) return false
  const { min, max } = deadlineBounds(now)
  return value >= min && value <= max
}
