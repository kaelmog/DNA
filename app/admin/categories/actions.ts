'use server'

import type { PostgrestError } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import {
  CATEGORY_DESCRIPTION_MAX,
  CATEGORY_IMAGE_PATH_PATTERN,
  CATEGORY_NAME_MAX,
  CATEGORY_POSITION_MAX,
  CATEGORY_SLUG_HINT,
  CATEGORY_SLUG_MAX,
} from '@/components/admin/categories/constants'
import { PRODUCT_IMAGE_BUCKET, SLUG_PATTERN } from '@/components/admin/products/constants'
import {
  actionError,
  actionSuccess,
  actionValidationError,
  formDataToObject,
  NOT_CONFIGURED_MESSAGE,
  type ActionState,
} from '@/lib/actions'
import { requireAdmin } from '@/lib/auth'
import { isSupabaseConfigured, supabaseUrl } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import { checkboxField, integerField, optionalText, requiredText, uuidField } from '@/lib/validation'

/**
 * Category create / update / delete. Each action re-checks the admin role and
 * validates every field, because server actions are public HTTP endpoints.
 * Row Level Security (categories_admin_all) backs this up in the database.
 */

const DUPLICATE_MESSAGE = 'A category with that name or slug already exists.'
const MISSING_MESSAGE = 'This category no longer exists. It may have been deleted.'
const SAVE_FAILED_MESSAGE = 'The category could not be saved. Please try again.'

type ServerClient = Awaited<ReturnType<typeof createClient>>

/** Public URL prefix of the product-images bucket (same format as storage getPublicUrl()). */
function bucketUrlPrefix() {
  return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`
}

/** The storage path of a category photo we uploaded, or null for site files and anything else. */
function uploadedImagePath(url: string | null) {
  if (!url?.startsWith(bucketUrlPrefix())) return null
  const path = url.slice(bucketUrlPrefix().length)
  return CATEGORY_IMAGE_PATH_PATTERN.test(path) ? path : null
}

/** Only site files (e.g. /macrame-hero.png) or photos uploaded by the category form may be shown. */
function isAllowedImageUrl(url: string) {
  const isSiteFile = url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')
  return isSiteFile || uploadedImagePath(url) !== null
}

/** Deletes a category photo file that is no longer used. A failure only leaves an unused file behind. */
async function removeUploadedImage(supabase: ServerClient, url: string | null) {
  const path = uploadedImagePath(url)
  if (!path) return
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path])
  if (error) console.error('[admin/categories] could not delete old photo', error.message)
}

const categorySchema = z.object({
  name: requiredText('Name', CATEGORY_NAME_MAX),
  slug: z
    .string({ error: 'Slug is required.' })
    .trim()
    .toLowerCase()
    .min(1, 'Slug is required.')
    .max(CATEGORY_SLUG_MAX, `Slug must be ${CATEGORY_SLUG_MAX} characters or fewer.`)
    .regex(SLUG_PATTERN, CATEGORY_SLUG_HINT),
  description: optionalText(CATEGORY_DESCRIPTION_MAX),
  position: integerField('Position', 0).max(CATEGORY_POSITION_MAX, `Position must be ${CATEGORY_POSITION_MAX} or less.`),
  is_active: checkboxField,
  image_url: optionalText(1000).refine(
    (url) => url === null || isAllowedImageUrl(url),
    'This photo could not be used. Upload it again.',
  ),
})

/** Unique violations name the constraint, so the error can point at the right field. */
function writeError(error: PostgrestError): ActionState {
  if (error.code === '23505') {
    if (error.message.includes('categories_name_key')) {
      return actionError(DUPLICATE_MESSAGE, { name: ['Another category already uses this name.'] })
    }
    if (error.message.includes('categories_slug_key')) {
      return actionError(DUPLICATE_MESSAGE, { slug: ['Another category already uses this slug.'] })
    }
    return actionError(DUPLICATE_MESSAGE)
  }
  console.error('[admin/categories] save failed', error.message)
  return actionError(SAVE_FAILED_MESSAGE)
}

/** Categories appear in the shop filters, on product pages and in the product editor. */
function revalidateCategoryPages() {
  revalidatePath('/admin/categories')
  // 'layout' also refreshes the product editor pages under /admin/products.
  revalidatePath('/admin/products', 'layout')
  revalidatePath('/')
  revalidatePath('/shop', 'layout')
  revalidatePath('/products/[slug]', 'page')
}

export async function createCategory(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return actionError(NOT_CONFIGURED_MESSAGE)
  await requireAdmin()

  const parsed = categorySchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionValidationError(parsed.error)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .insert(parsed.data)
    .select('name')
    .single<{ name: string }>()
  if (error) return writeError(error)

  revalidateCategoryPages()
  return actionSuccess(`“${data.name}” was added.`)
}

export async function updateCategory(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return actionError(NOT_CONFIGURED_MESSAGE)
  await requireAdmin()

  const id = uuidField.safeParse(formData.get('id'))
  if (!id.success) return actionError(MISSING_MESSAGE)

  const parsed = categorySchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionValidationError(parsed.error)

  const supabase = await createClient()
  const { data: before } = await supabase
    .from('categories')
    .select('image_url')
    .eq('id', id.data)
    .maybeSingle<{ image_url: string | null }>()

  const { data, error } = await supabase
    .from('categories')
    .update(parsed.data)
    .eq('id', id.data)
    .select('name')
    .maybeSingle<{ name: string }>()
  if (error) return writeError(error)
  if (!data) return actionError(MISSING_MESSAGE)

  if (before?.image_url && before.image_url !== parsed.data.image_url) {
    await removeUploadedImage(supabase, before.image_url)
  }

  revalidateCategoryPages()
  return actionSuccess(`“${data.name}” was saved.`)
}

export async function deleteCategory(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return actionError(NOT_CONFIGURED_MESSAGE)
  await requireAdmin()

  const id = uuidField.safeParse(formData.get('id'))
  if (!id.success) return actionError(MISSING_MESSAGE)

  // Products keep existing: products.category_id is ON DELETE SET NULL, so they become uncategorised.
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id.data)
    .select('name, image_url')
    .maybeSingle<{ name: string; image_url: string | null }>()

  if (error) {
    console.error('[admin/categories] delete failed', error.message)
    return actionError('The category could not be deleted. Please try again.')
  }
  if (!data) return actionError(MISSING_MESSAGE)

  await removeUploadedImage(supabase, data.image_url)
  revalidateCategoryPages()
  return actionSuccess(`“${data.name}” was deleted.`)
}
