/**
 * Reusable zod building blocks for forms. Feature-specific schemas live next
 * to their server actions and are composed from these.
 */
import { z } from 'zod'

/** Required trimmed text with a max length. */
export const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`)

/** Optional trimmed text: missing or empty becomes null. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer.`)
    .nullish()
    .transform((value) => (value ? value : null))

export const emailField = z
  .string({ error: 'Email is required.' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address.').max(254))

/** A checkbox: present ("on"/"true") means true, missing means false. */
export const checkboxField = z
  .string()
  .nullish()
  .transform((value) => value === 'on' || value === 'true')

/** Dollar amount typed by a person ("12.50") -> integer cents. Required. */
export const moneyField = (label: string) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .transform((value) => Number(value.replace(/[$,\s]/g, '')))
    .refine((value) => Number.isFinite(value) && value >= 0, `${label} must be a positive amount.`)
    .transform((value) => Math.round(value * 100))

/** Optional dollar amount -> cents or null. */
export const optionalMoneyField = z
  .string()
  .trim()
  .nullish()
  .transform((value) => (value ? Number(value.replace(/[$,\s]/g, '')) : null))
  .refine((value) => value === null || (Number.isFinite(value) && value >= 0), 'Enter a positive amount.')
  .transform((value) => (value === null ? null : Math.round(value * 100)))

/** Whole number from a form input. */
export const integerField = (label: string, min = 0) =>
  z.coerce
    .number({ error: `${label} must be a number.` })
    .int(`${label} must be a whole number.`)
    .min(min, `${label} must be at least ${min}.`)

export const uuidField = z.uuid('Invalid id.')

/** Hidden anti-spam field. Real people leave it empty; bots often fill it. */
export const honeypotField = z.string().max(0).nullish()
