/**
 * Limits shared by the product editor (browser) and its server actions, so the
 * form and the server always agree. Safe to import from client components.
 */

/** Storage bucket for product photos (public read, admin write; see supabase/schema.sql). */
export const PRODUCT_IMAGE_BUCKET = 'product-images'

/** Accepted upload types and the file extension used for each. Matches the bucket's allowed_mime_types. */
export const PRODUCT_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

export const MAX_PRODUCT_IMAGES = 10
export const MAX_PRODUCT_VARIANTS = 30
export const MAX_PRODUCT_TAGS = 20

/** Largest price Stripe Checkout accepts for one item, in cents. */
export const MAX_PRICE_CENTS = 99_999_999

/** URL slugs: lowercase words joined by single hyphens. Mirrors the CHECK constraint in the schema. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const SLUG_HINT = 'Lowercase letters, numbers and single hyphens, for example "sol-wall-hanging".'

/** Object paths created by the image uploader: products/<uuid>.<ext> */
export const PRODUCT_IMAGE_PATH_PATTERN = /^products\/[A-Za-z0-9_-]+\.(jpg|png|webp|avif)$/

/** SKUs: letters, numbers, dots, dashes and underscores (keeps them safe in URLs and filters). */
export const SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/
