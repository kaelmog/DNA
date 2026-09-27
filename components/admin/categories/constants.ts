/**
 * Limits shared by the category form (browser) and its server actions.
 * They mirror the CHECK constraints on public.categories. Safe to import from
 * client components.
 */

export const CATEGORY_NAME_MAX = 80
export const CATEGORY_SLUG_MAX = 80
export const CATEGORY_DESCRIPTION_MAX = 500

/** Upper bound for the sort position, to catch typos like 10000000. */
export const CATEGORY_POSITION_MAX = 9999

export const CATEGORY_SLUG_HINT = 'Lowercase letters, numbers and single hyphens, for example "wall-hangings".'

/**
 * Category photos live in the product-images bucket (its admin-only write
 * policy covers any path) under categories/<uuid>.<ext>.
 */
export const CATEGORY_IMAGE_FOLDER = 'categories'
export const CATEGORY_IMAGE_PATH_PATTERN = /^categories\/[A-Za-z0-9_-]+\.(jpg|png|webp|avif)$/
