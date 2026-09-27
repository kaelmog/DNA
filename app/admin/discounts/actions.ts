'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { actionError, actionSuccess, actionValidationError, formDataToObject, type ActionState } from '@/lib/actions'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { DiscountCode } from '@/lib/types'
import { checkboxField, optionalMoneyField, optionalText, uuidField } from '@/lib/validation'

const SAVE_FAILED = 'Could not save the discount code. Please try again.'
const DUPLICATE_CODE = 'That code already exists.'
const CODE_MISSING = 'This discount code no longer exists.'
const RENAME_USED_CODE = 'This code has already been used, so it cannot be renamed. Create a new code instead.'

/** Largest fixed discount accepted, in cents ($100,000), to catch typos. */
const MAX_FIXED_AMOUNT_CENTS = 10_000_000

/** An ISO date string from the form (converted in the browser), or null when empty. */
const optionalDateTime = z
  .string()
  .trim()
  .nullish()
  .transform((value) => value || null)
  .refine((value) => value === null || !Number.isNaN(Date.parse(value)), 'Enter a valid date and time.')

/** Turns the typed value into what the database stores: a percent (1-100) or cents. */
function parseDiscountValue(type: DiscountCode['discount_type'], raw: string) {
  const amount = Number(raw.replace(/[$%,\s]/g, ''))
  return type === 'percentage' ? amount : Math.round(amount * 100)
}

const discountSchema = z
  .object({
    code: z
      .string({ error: 'Code is required.' })
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,32}$/, 'Use 3–32 letters, numbers, dashes or underscores, with no spaces.'),
    description: optionalText(200),
    discount_type: z.enum(['percentage', 'fixed_amount'], { error: 'Choose a discount type.' }),
    value: z.string({ error: 'Enter a value.' }).trim().min(1, 'Enter a value.'),
    min_subtotal: optionalMoneyField,
    max_redemptions: z
      .string()
      .trim()
      .nullish()
      .transform((value) => (value ? Number(value) : null))
      .refine(
        (value) => value === null || (Number.isInteger(value) && value > 0 && value <= 1_000_000),
        'Enter a whole number above 0, or leave it empty for no limit.',
      ),
    starts_at: optionalDateTime,
    ends_at: optionalDateTime,
    is_active: checkboxField,
  })
  .superRefine((data, ctx) => {
    const value = parseDiscountValue(data.discount_type, data.value)
    if (data.discount_type === 'percentage' && !(Number.isInteger(value) && value >= 1 && value <= 100)) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'Enter a whole percentage from 1 to 100.' })
    }
    if (data.discount_type === 'fixed_amount' && !(Number.isFinite(value) && value > 0 && value <= MAX_FIXED_AMOUNT_CENTS)) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'Enter an amount above 0, for example 5 or 12.50.' })
    }
    if (data.starts_at && data.ends_at && Date.parse(data.ends_at) <= Date.parse(data.starts_at)) {
      ctx.addIssue({ code: 'custom', path: ['ends_at'], message: 'The end must be after the start.' })
    }
  })
  .transform((data) => ({
    code: data.code,
    description: data.description,
    discount_type: data.discount_type,
    value: parseDiscountValue(data.discount_type, data.value),
    min_subtotal_cents: data.min_subtotal ?? 0,
    max_redemptions: data.max_redemptions,
    starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : null,
    ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
    is_active: data.is_active,
  }))

function revalidateDiscountPages(id?: string) {
  revalidatePath('/admin/discounts')
  if (id) revalidatePath(`/admin/discounts/${id}`)
}

export async function createDiscount(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const parsed = discountSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionValidationError(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.from('discount_codes').insert(parsed.data)
  if (error) {
    if (error.code === '23505') return actionError(DUPLICATE_CODE, { code: [DUPLICATE_CODE] })
    console.error('[admin/discounts] create failed', error.message)
    return actionError(SAVE_FAILED)
  }

  revalidateDiscountPages()
  redirect('/admin/discounts')
}

export async function updateDiscount(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const id = uuidField.safeParse(formData.get('id'))
  if (!id.success) return actionError(CODE_MISSING)

  const parsed = discountSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionValidationError(parsed.error)

  const supabase = await createClient()
  const { data: current, error: loadError } = await supabase
    .from('discount_codes')
    .select('code, times_redeemed')
    .eq('id', id.data)
    .maybeSingle<Pick<DiscountCode, 'code' | 'times_redeemed'>>()

  if (loadError) {
    console.error('[admin/discounts] load before update failed', loadError.message)
    return actionError(SAVE_FAILED)
  }
  if (!current) return actionError(CODE_MISSING)
  // Orders store the code as text (and paid orders count redemptions by it), so a used code keeps its name.
  if (current.times_redeemed > 0 && current.code !== parsed.data.code) {
    return actionError(RENAME_USED_CODE, { code: [RENAME_USED_CODE] })
  }

  // The filter repeats the rename rule, in case the code was redeemed after it was loaded.
  const { data, error } = await supabase
    .from('discount_codes')
    .update(parsed.data)
    .eq('id', id.data)
    .or(`times_redeemed.eq.0,code.eq.${parsed.data.code}`)
    .select('id')
    .maybeSingle()

  if (error) {
    if (error.code === '23505') return actionError(DUPLICATE_CODE, { code: [DUPLICATE_CODE] })
    console.error('[admin/discounts] update failed', error.message)
    return actionError(SAVE_FAILED)
  }
  if (!data) return actionError(RENAME_USED_CODE, { code: [RENAME_USED_CODE] })

  revalidateDiscountPages(id.data)
  return actionSuccess('Discount code saved.')
}

const toggleSchema = z.object({
  id: uuidField,
  active: z.enum(['true', 'false']).transform((value) => value === 'true'),
})

export async function setDiscountActive(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const parsed = toggleSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionError('Invalid request.')
  const { id, active } = parsed.data

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('discount_codes')
    .update({ is_active: active })
    .eq('id', id)
    .select('code')
    .maybeSingle<Pick<DiscountCode, 'code'>>()

  if (error) {
    console.error('[admin/discounts] toggle failed', error.message)
    return actionError(SAVE_FAILED)
  }
  if (!data) return actionError(CODE_MISSING)

  revalidateDiscountPages(id)
  return actionSuccess(`${data.code} is now ${active ? 'enabled' : 'disabled'}.`)
}

/**
 * Deletes an unused code. Send `redirectTo=list` when deleting from the code's
 * own page, which would otherwise show "not found" once the code is gone.
 */
export async function deleteDiscount(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const id = uuidField.safeParse(formData.get('id'))
  if (!id.success) return actionError('Invalid request.')
  const backToList = formData.get('redirectTo') === 'list'

  // Codes that were used stay for the order history; the condition makes the
  // delete a no-op if the code was redeemed after the page loaded.
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('discount_codes')
    .delete()
    .eq('id', id.data)
    .eq('times_redeemed', 0)
    .select('code')
    .maybeSingle<Pick<DiscountCode, 'code'>>()

  if (error) {
    console.error('[admin/discounts] delete failed', error.message)
    return actionError('Could not delete the discount code. Please try again.')
  }
  if (!data) return actionError('This code has been used, so it is kept for your records. Disable it instead.')

  revalidateDiscountPages(id.data)
  // Outside any try/catch: redirect() works by throwing.
  if (backToList) redirect('/admin/discounts')
  return actionSuccess(`${data.code} deleted.`)
}
