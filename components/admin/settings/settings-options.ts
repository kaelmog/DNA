/**
 * Choices and limits for the store settings form, shared by the form (browser)
 * and the server action (validation) so they always match.
 */

export const STORE_CURRENCIES = [
  { value: 'usd', label: 'US dollar (USD)' },
  { value: 'eur', label: 'Euro (EUR)' },
  { value: 'gbp', label: 'British pound (GBP)' },
  { value: 'cad', label: 'Canadian dollar (CAD)' },
  { value: 'aud', label: 'Australian dollar (AUD)' },
] as const

export type StoreCurrency = (typeof STORE_CURRENCIES)[number]['value']

export const STORE_CURRENCY_CODES = STORE_CURRENCIES.map((currency) => currency.value) as [
  StoreCurrency,
  ...StoreCurrency[],
]

export const SETTINGS_LIMITS = {
  storeName: 80,
  tagline: 160,
  supportEmail: 254,
  supportPhone: 40,
  businessAddress: 300,
  announcement: 160,
  socialUrl: 300,
  /** Largest flat shipping rate accepted, in cents ($1,000), to catch typos. */
  maxShippingCents: 100_000,
  /** Largest free-shipping threshold accepted, in cents ($100,000). */
  maxThresholdCents: 10_000_000,
  maxLowStock: 1000,
} as const

/** The social profile fields, in the order they appear in the form and the footer. */
export const SOCIAL_FIELDS = [
  { name: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/yourstudio' },
  { name: 'pinterest_url', label: 'Pinterest', placeholder: 'https://pinterest.com/yourstudio' },
  { name: 'facebook_url', label: 'Facebook', placeholder: 'https://facebook.com/yourstudio' },
  { name: 'tiktok_url', label: 'TikTok', placeholder: 'https://tiktok.com/@yourstudio' },
] as const

export type SocialField = (typeof SOCIAL_FIELDS)[number]['name']
