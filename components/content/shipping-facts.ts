import { formatMoney } from '@/lib/format'
import type { StoreSettings } from '@/lib/types'

export interface ShippingFacts {
  /** "$8" or null when shipping is always free. */
  flatRate: string | null
  /** "$100" or null when there is no free-shipping threshold. */
  freeThreshold: string | null
  /** "the United States" or "the United States, Canada and Mexico". */
  countries: string
}

/** "$100.00" -> "$100", keeps cents when they matter ("$8.50"). */
function shortMoney(cents: number, currency: string) {
  return formatMoney(cents, currency).replace(/\.00$/, '')
}

function countryName(code: string) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

/**
 * Human-readable shipping rules from the store settings, so the FAQ and the
 * shipping page always match what checkout charges (see lib/pricing.ts).
 */
export function getShippingFacts(settings: StoreSettings): ShippingFacts {
  const names = settings.allowed_shipping_countries.map(countryName)
  const listed = names.length ? new Intl.ListFormat('en', { type: 'conjunction' }).format(names) : 'selected countries'
  // "the United States" / "the United Kingdom" read better with an article.
  const countries = /^United /.test(listed) ? `the ${listed}` : listed

  return {
    flatRate: settings.flat_shipping_cents > 0 ? shortMoney(settings.flat_shipping_cents, settings.currency) : null,
    freeThreshold:
      settings.free_shipping_threshold_cents !== null && settings.flat_shipping_cents > 0
        ? shortMoney(settings.free_shipping_threshold_cents, settings.currency)
        : null,
    countries,
  }
}

/** One sentence describing the shipping price, e.g. "a flat $8 per order, free on orders of $100 or more". */
export function shippingPriceSentence(facts: ShippingFacts) {
  if (!facts.flatRate) return 'free on every order'
  const flat = `a flat ${facts.flatRate} per order`
  return facts.freeThreshold ? `${flat}, and free on orders of ${facts.freeThreshold} or more (after discounts)` : flat
}
