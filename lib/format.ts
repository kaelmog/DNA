/** Formatting helpers shared by server and client code. */

/** 12800 -> "$128.00". Pass the store currency when you have it. */
export function formatMoney(cents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

/** Converts a dollar amount typed in a form ("12.5") to cents (1250). Returns null when empty or invalid. */
export function dollarsToCents(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const amount = typeof value === 'number' ? value : Number(String(value).replace(/[$,\s]/g, ''))
  return Number.isFinite(amount) ? Math.round(amount * 100) : null
}

/** 1250 -> "12.50", for pre-filling money inputs. */
export function centsToDollars(cents: number | null | undefined) {
  return cents === null || cents === undefined ? '' : (cents / 100).toFixed(2)
}

export function formatDate(value: string | Date, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) {
  return new Intl.DateTimeFormat('en-US', options).format(new Date(value))
}

export function formatDateTime(value: string | Date) {
  return formatDate(value, { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatOrderNumber(orderNumber: number) {
  return `#${orderNumber}`
}

/** "Wall Hangings & More!" -> "wall-hangings-more" */
export function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

/** "partially_refunded" -> "Partially refunded" */
export function humanize(value: string) {
  const text = value.replace(/[_-]+/g, ' ').trim()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trimEnd()}…`
}
