/**
 * Shipping country helpers for the settings form. Countries are stored as
 * two-letter ISO 3166-1 codes ("US", "CA", "GB"), the format Stripe expects.
 */

/**
 * Two-letter region codes that are not countries (EU, UN...) or are a common
 * mistake: the United Kingdom is "GB", not "UK".
 */
const NOT_COUNTRY_CODES = new Set(['EU', 'EZ', 'UN', 'ZZ', 'QO', 'UK'])

function regionNames() {
  try {
    // fallback 'none' returns undefined for codes that name no region.
    return new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' })
  } catch {
    return null
  }
}

const names = regionNames()

/** "us, ca;gb  us" -> ["US", "CA", "GB"]: split on commas, semicolons or spaces, upper-cased, no duplicates. */
export function parseCountryList(value: string) {
  return [
    ...new Set(
      value
        .split(/[\s,;]+/)
        .map((code) => code.trim().toUpperCase())
        .filter(Boolean),
    ),
  ]
}

export function isCountryCode(code: string) {
  if (!/^[A-Z]{2}$/.test(code) || NOT_COUNTRY_CODES.has(code)) return false
  // Without Intl region data, the format check alone has to do.
  return names ? names.of(code) !== undefined : true
}

/** "CA" -> "Canada" (the code itself when unknown). */
export function countryName(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return code // .of() throws on malformed codes
  return names?.of(code) ?? code
}
