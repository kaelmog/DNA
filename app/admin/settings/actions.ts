'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { isCountryCode, parseCountryList } from '@/components/admin/settings/countries'
import { SETTINGS_LIMITS, STORE_CURRENCY_CODES } from '@/components/admin/settings/settings-options'
import { actionError, actionSuccess, actionValidationError, formDataToObject, type ActionState } from '@/lib/actions'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { checkboxField, integerField, moneyField, optionalMoneyField, optionalText, requiredText } from '@/lib/validation'

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && Boolean(url.hostname)
  } catch {
    return false
  }
}

/** A profile link: empty, or a full https:// URL (it is rendered as a link in the footer). */
const socialUrlField = optionalText(SETTINGS_LIMITS.socialUrl).refine(
  (value) => value === null || isHttpsUrl(value),
  'Enter a full link that starts with https://, or leave it empty.',
)

const optionalEmailField = optionalText(SETTINGS_LIMITS.supportEmail)
  .transform((value) => value?.toLowerCase() ?? null)
  .refine((value) => value === null || z.email().safeParse(value).success, 'Enter a valid email address.')

const countriesField = z
  .string({ error: 'Add at least one country code, for example US.' })
  .max(1000, 'That list is too long.')
  .transform(parseCountryList)
  .superRefine((codes, ctx) => {
    if (!codes.length) {
      ctx.addIssue({ code: 'custom', message: 'Add at least one country code, for example US.' })
      return
    }
    const invalid = codes.filter((code) => !isCountryCode(code))
    if (invalid.length) {
      const ukHint = invalid.includes('UK') ? ' Use GB for the United Kingdom.' : ''
      ctx.addIssue({
        code: 'custom',
        message: `Not a two-letter country code: ${invalid.join(', ')}.${ukHint}`,
      })
    }
  })

const settingsSchema = z.object({
  store_name: requiredText('Store name', SETTINGS_LIMITS.storeName),
  tagline: optionalText(SETTINGS_LIMITS.tagline),
  support_email: optionalEmailField,
  support_phone: optionalText(SETTINGS_LIMITS.supportPhone),
  business_address: optionalText(SETTINGS_LIMITS.businessAddress),
  announcement_text: optionalText(SETTINGS_LIMITS.announcement),
  currency: z.enum(STORE_CURRENCY_CODES, { error: 'Choose a currency.' }),
  flat_shipping: moneyField('Flat shipping rate').refine(
    (cents) => cents <= SETTINGS_LIMITS.maxShippingCents,
    'That shipping rate looks too high. Enter it in dollars, for example 8 or 12.50.',
  ),
  free_shipping_threshold: optionalMoneyField.refine(
    (cents) => cents === null || cents <= SETTINGS_LIMITS.maxThresholdCents,
    'That amount looks too high. Enter it in dollars, for example 100.',
  ),
  allowed_shipping_countries: countriesField,
  low_stock_threshold: integerField('Low-stock threshold', 0).max(
    SETTINGS_LIMITS.maxLowStock,
    `Low-stock threshold must be ${SETTINGS_LIMITS.maxLowStock} or less.`,
  ),
  stripe_tax_enabled: checkboxField,
  instagram_url: socialUrlField,
  pinterest_url: socialUrlField,
  facebook_url: socialUrlField,
  tiktok_url: socialUrlField,
})

/** Saves the single store_settings row (id = 1). Every storefront page reads it, so the whole site is refreshed. */
export async function updateSettings(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const parsed = settingsSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionValidationError(parsed.error)
  const { flat_shipping, free_shipping_threshold, ...fields } = parsed.data

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('store_settings')
    .update({
      ...fields,
      flat_shipping_cents: flat_shipping,
      free_shipping_threshold_cents: free_shipping_threshold,
    })
    .eq('id', 1)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[admin/settings] update failed', error.message)
    return actionError('Could not save the settings. Please try again.')
  }
  if (!data) {
    return actionError('The settings row is missing. Run supabase/schema.sql again in the Supabase SQL Editor.')
  }

  revalidatePath('/', 'layout')
  return actionSuccess('Settings saved. The store shows the changes right away.')
}
