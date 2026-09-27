'use server'

import type { PostgrestError } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import {
  MAX_PRICE_CENTS,
  MAX_PRODUCT_IMAGES,
  MAX_PRODUCT_TAGS,
  MAX_PRODUCT_VARIANTS,
  PRODUCT_IMAGE_BUCKET,
  PRODUCT_IMAGE_PATH_PATTERN,
  SKU_PATTERN,
  SLUG_HINT,
  SLUG_PATTERN,
} from '@/components/admin/products/constants'
import { actionError, actionSuccess, formDataToObject, NOT_CONFIGURED_MESSAGE, type ActionState } from '@/lib/actions'
import { requireAdmin } from '@/lib/auth'
import { isSupabaseConfigured, supabaseUrl } from '@/lib/env'
import { pluralize } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import {
  checkboxField,
  integerField,
  moneyField,
  optionalMoneyField,
  optionalText,
  requiredText,
  uuidField,
} from '@/lib/validation'

/**
 * Product create / update / delete. Every action re-checks the admin role and
 * validates every field (including the JSON lists of variants and images),
 * because server actions are public HTTP endpoints.
 */

type ServerClient = Awaited<ReturnType<typeof createClient>>
type FieldErrors = NonNullable<ActionState['fieldErrors']>

const FIX_FIELDS_MESSAGE = 'Please fix the highlighted fields.'
const STALE_FORM_MESSAGE = 'This form is out of date. Reload the page and try again.'
const MISSING_PRODUCT_MESSAGE = 'This product no longer exists. It may have been deleted.'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Public URL of a file in the product-images bucket (same format as storage getPublicUrl()). */
function publicImageUrl(path: string) {
  return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path}`
}

/** Only site files (e.g. /macrame-hero.png) or files in our own public bucket may be shown. */
function isAllowedImageUrl(url: string) {
  const isSiteFile = url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')
  return isSiteFile || url.startsWith(publicImageUrl(''))
}

/** Trims every line and drops blank ones; null when nothing is left. */
function normalizeLines(value: string | null | undefined) {
  const lines = (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  return lines.length ? lines.join('\n') : null
}

/** "Boho, Wall art, boho" -> ["boho", "wall art"] */
function parseTags(value: string | null | undefined) {
  const tags = (value ?? '')
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
  return [...new Set(tags)]
}

const productSchema = z.object({
  name: requiredText('Name', 160),
  slug: z
    .string({ error: 'Slug is required.' })
    .trim()
    .toLowerCase()
    .min(1, 'Slug is required.')
    .max(80, 'Slug must be 80 characters or fewer.')
    .regex(SLUG_PATTERN, SLUG_HINT),
  description: z
    .string()
    .trim()
    .max(10_000, 'Description must be 10,000 characters or fewer.')
    .nullish()
    .transform((value) => value ?? ''),
  details: z
    .string()
    .nullish()
    .transform(normalizeLines)
    .pipe(z.string().max(5000, 'Details must be 5,000 characters or fewer.').nullable()),
  category_id: z
    .string()
    .nullish()
    .transform((value) => value || null)
    .pipe(z.uuid('Choose a category from the list.').nullable()),
  status: z.enum(['draft', 'active', 'archived'], { error: 'Choose a status.' }),
  is_featured: checkboxField,
  badge: optionalText(30),
  tags: z
    .string()
    .nullish()
    .transform(parseTags)
    .pipe(
      z
        .array(z.string().max(40, 'Each tag must be 40 characters or fewer.'))
        .max(MAX_PRODUCT_TAGS, `Use ${MAX_PRODUCT_TAGS} tags or fewer.`),
    ),
  seo_title: optionalText(70),
  seo_description: optionalText(160),
})

const variantSchema = z
  .object({
    id: uuidField.optional(),
    title: z
      .string()
      .trim()
      .max(120, 'Title must be 120 characters or fewer.')
      .transform((value) => value || 'Default'),
    sku: optionalText(64).refine(
      (value) => value === null || SKU_PATTERN.test(value),
      'SKUs can use letters, numbers, dots, dashes and underscores.',
    ),
    price: moneyField('Price').refine((cents) => cents <= MAX_PRICE_CENTS, 'Price is too high.'),
    compare_at_price: optionalMoneyField.refine(
      (cents) => cents === null || cents <= MAX_PRICE_CENTS,
      'Compare-at price is too high.',
    ),
    inventory_quantity: integerField('Inventory', 0).max(1_000_000, 'Inventory must be 1,000,000 or less.'),
    // False when the admin left the stock number untouched (see syncVariants).
    stock_changed: z.boolean().default(true),
    track_inventory: z.boolean(),
    is_active: z.boolean(),
  })
  .refine((variant) => variant.compare_at_price === null || variant.compare_at_price > variant.price, {
    message: 'Compare-at price must be greater than the price.',
    path: ['compare_at_price'],
  })

const variantsSchema = z
  .array(variantSchema, { error: 'Could not read the variants. Reload the page and try again.' })
  .min(1, 'Add at least one variant.')
  .max(MAX_PRODUCT_VARIANTS, `Use ${MAX_PRODUCT_VARIANTS} variants or fewer.`)
  .superRefine((variants, ctx) => {
    const skus = new Set<string>()
    const ids = new Set<string>()
    variants.forEach((variant, index) => {
      if (variant.sku && skus.has(variant.sku)) {
        ctx.addIssue({ code: 'custom', message: `SKU "${variant.sku}" is used twice.`, path: [index, 'sku'] })
      }
      if (variant.id && ids.has(variant.id)) {
        ctx.addIssue({ code: 'custom', message: 'Listed twice.', path: [index, 'id'] })
      }
      if (variant.sku) skus.add(variant.sku)
      if (variant.id) ids.add(variant.id)
    })
  })

const imageSchema = z
  .object({
    id: uuidField.optional(),
    url: z.string().trim().max(1000, 'The image address is too long.'),
    storage_path: z
      .string()
      .regex(PRODUCT_IMAGE_PATH_PATTERN, 'Unexpected image file.')
      .nullish()
      .transform((value) => value ?? null),
    alt_text: z
      .string()
      .trim()
      .max(200, 'Alt text must be 200 characters or fewer.')
      .nullish()
      .transform((value) => value ?? ''),
  })
  // Uploaded files get their URL rebuilt here, so a tampered URL can never be saved.
  .transform((image) => ({ ...image, url: image.storage_path ? publicImageUrl(image.storage_path) : image.url }))
  .refine((image) => isAllowedImageUrl(image.url), {
    message: 'Images must be uploaded here or stored on this site.',
    path: ['url'],
  })

const imagesSchema = z
  .array(imageSchema, { error: 'Could not read the images. Reload the page and try again.' })
  .max(MAX_PRODUCT_IMAGES, `Add up to ${MAX_PRODUCT_IMAGES} images.`)
  .superRefine((images, ctx) => {
    const keys = new Set<string>()
    images.forEach((image, index) => {
      const key = image.id ?? image.storage_path ?? image.url
      if (keys.has(key)) ctx.addIssue({ code: 'custom', message: 'Added twice.', path: [index] })
      keys.add(key)
    })
  })

type ProductInput = z.infer<typeof productSchema>
type VariantInput = z.infer<typeof variantSchema>
type ImageInput = z.infer<typeof imageSchema>

interface ProductForm {
  product: ProductInput
  variants: VariantInput[]
  images: ImageInput[]
}

function readJson(formData: FormData, name: string): unknown {
  const value = formData.get(name)
  if (typeof value !== 'string') return undefined
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

/** Errors inside a JSON list become "Variant 2: Price is required." style messages. */
function listIssues(error: z.ZodError, itemLabel: string) {
  const messages = error.issues.map((issue) =>
    typeof issue.path[0] === 'number' ? `${itemLabel} ${issue.path[0] + 1}: ${issue.message}` : issue.message,
  )
  return [...new Set(messages)]
}

function parseProductForm(formData: FormData): { ok: true; data: ProductForm } | { ok: false; state: ActionState } {
  const fieldErrors: FieldErrors = {}

  const product = productSchema.safeParse(formDataToObject(formData))
  if (!product.success) Object.assign(fieldErrors, z.flattenError(product.error).fieldErrors)

  const variants = variantsSchema.safeParse(readJson(formData, 'variants'))
  if (!variants.success) fieldErrors.variants = listIssues(variants.error, 'Variant')

  const images = imagesSchema.safeParse(readJson(formData, 'images'))
  if (!images.success) fieldErrors.images = listIssues(images.error, 'Image')

  if (!product.success || !variants.success || !images.success) {
    return { ok: false, state: actionError(FIX_FIELDS_MESSAGE, fieldErrors) }
  }

  // A published product must be buyable, otherwise the shop would show it without a price.
  if (product.data.status === 'active' && !variants.data.some((variant) => variant.is_active)) {
    return {
      ok: false,
      state: actionError(FIX_FIELDS_MESSAGE, { status: ['An active product needs at least one active variant.'] }),
    }
  }

  return { ok: true, data: { product: product.data, variants: variants.data, images: images.data } }
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

interface ExistingImage {
  id: string
  storage_path: string | null
}

interface ExistingProduct {
  slug: string
  variantIds: Set<string>
  images: ExistingImage[]
}

async function loadExistingProduct(supabase: ServerClient, productId: string): Promise<ExistingProduct | null> {
  const { data, error } = await supabase
    .from('products')
    .select('slug, variants:product_variants(id), images:product_images(id, storage_path)')
    .eq('id', productId)
    .maybeSingle<{ slug: string; variants: { id: string }[] | null; images: ExistingImage[] | null }>()

  if (error) console.error('[products] could not load product', error.message)
  if (!data) return null
  return {
    slug: data.slug,
    variantIds: new Set((data.variants ?? []).map((variant) => variant.id)),
    images: data.images ?? [],
  }
}

/** Variant and image ids sent by the browser must belong to this product (none for a new product). */
function hasUnknownIds(form: ProductForm, existing: ExistingProduct | null) {
  const imageIds = new Set(existing?.images.map((image) => image.id))
  return (
    form.variants.some((variant) => variant.id && !existing?.variantIds.has(variant.id)) ||
    form.images.some((image) => image.id && !imageIds.has(image.id))
  )
}

/** Checked before writing anything, so a taken SKU never leaves a half-saved product. */
async function findSkuConflict(supabase: ServerClient, variants: VariantInput[], productId: string | null) {
  const skus = variants.flatMap((variant) => (variant.sku ? [variant.sku] : []))
  if (!skus.length) return null

  let query = supabase.from('product_variants').select('sku').in('sku', skus).limit(1)
  if (productId) query = query.neq('product_id', productId)
  const { data, error } = await query.overrideTypes<{ sku: string }[], { merge: false }>()

  if (error) {
    // The unique constraint still protects the data; the write below will report it.
    console.error('[products] SKU check failed', error.message)
    return null
  }
  return data.length ? `SKU "${data[0].sku}" is already used by another product.` : null
}

function productWriteError(error: PostgrestError | null): ActionState {
  if (error?.code === '23505') return actionError(FIX_FIELDS_MESSAGE, { slug: ['Another product already uses this slug.'] })
  if (error?.code === '23503') {
    return actionError(FIX_FIELDS_MESSAGE, { category_id: ['That category no longer exists. Choose another one.'] })
  }
  console.error('[products] product save failed', error?.message ?? 'no row returned')
  return actionError('The product could not be saved. Please try again.')
}

function variantWriteError(error: PostgrestError): ActionState {
  if (error.code === '23505' && error.message.includes('sku')) {
    return actionError(FIX_FIELDS_MESSAGE, { variants: ['That SKU is already used by another variant. SKUs must be unique.'] })
  }
  console.error('[products] variant save failed', error.message)
  return actionError('The variants could not be saved. Please review them and save again.')
}

function imageWriteError(error: PostgrestError): ActionState {
  console.error('[products] image save failed', error.message)
  return actionError('The images could not be saved. Please review them and save again.')
}

function variantColumns(variant: VariantInput, position: number) {
  return {
    title: variant.title,
    sku: variant.sku,
    price_cents: variant.price,
    compare_at_price_cents: variant.compare_at_price,
    track_inventory: variant.track_inventory,
    is_active: variant.is_active,
    position,
  }
}

/**
 * Makes the product's variants match the form. Removed rows are deleted first
 * so their SKUs can be reused, then kept rows are updated and new rows are
 * inserted. Returns an error state, or null when everything was saved.
 */
async function syncVariants(
  supabase: ServerClient,
  productId: string,
  variants: VariantInput[],
  existingIds: Set<string>,
): Promise<ActionState | null> {
  const keptIds = new Set(variants.flatMap((variant) => (variant.id ? [variant.id] : [])))
  const removedIds = [...existingIds].filter((id) => !keptIds.has(id))

  if (removedIds.length) {
    const { error } = await supabase.from('product_variants').delete().eq('product_id', productId).in('id', removedIds)
    if (error) return variantWriteError(error)
  }

  // Stock is only written when the admin changed it, so sales made while the
  // form was open are not overwritten with the old number.
  const updates = variants.flatMap((variant, position) =>
    variant.id
      ? [
          supabase
            .from('product_variants')
            .update({
              ...variantColumns(variant, position),
              ...(variant.stock_changed ? { inventory_quantity: variant.inventory_quantity } : {}),
            })
            .eq('id', variant.id)
            .eq('product_id', productId),
        ]
      : [],
  )
  for (const { error } of await Promise.all(updates)) {
    if (error) return variantWriteError(error)
  }

  const inserts = variants.flatMap((variant, position) =>
    variant.id
      ? []
      : [{ ...variantColumns(variant, position), product_id: productId, inventory_quantity: variant.inventory_quantity }],
  )
  if (inserts.length) {
    const { error } = await supabase.from('product_variants').insert(inserts)
    if (error) return variantWriteError(error)
  }

  return null
}

async function removeImageFiles(supabase: ServerClient, paths: string[]) {
  if (!paths.length) return
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(paths)
  // A leftover file is harmless, so this never fails the save.
  if (error) console.error('[products] could not delete image files', error.message)
}

/** Makes the product's images match the form, then deletes files that are no longer used. */
async function syncImages(
  supabase: ServerClient,
  productId: string,
  images: ImageInput[],
  existing: ExistingImage[],
): Promise<ActionState | null> {
  const keptIds = new Set(images.flatMap((image) => (image.id ? [image.id] : [])))
  const removed = existing.filter((image) => !keptIds.has(image.id))

  if (removed.length) {
    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('product_id', productId)
      .in(
        'id',
        removed.map((image) => image.id),
      )
    if (error) return imageWriteError(error)
  }

  // Saved images only change their alt text and order; the file itself never changes.
  const updates = images.flatMap((image, position) =>
    image.id
      ? [
          supabase
            .from('product_images')
            .update({ alt_text: image.alt_text, position })
            .eq('id', image.id)
            .eq('product_id', productId),
        ]
      : [],
  )
  for (const { error } of await Promise.all(updates)) {
    if (error) return imageWriteError(error)
  }

  const inserts = images.flatMap((image, position) =>
    image.id
      ? []
      : [{ product_id: productId, url: image.url, storage_path: image.storage_path, alt_text: image.alt_text, position }],
  )
  if (inserts.length) {
    const { error } = await supabase.from('product_images').insert(inserts)
    if (error) return imageWriteError(error)
  }

  // Files go only after their rows are gone, so no row ever points at a missing file.
  const stillUsed = new Set(images.map((image) => image.storage_path))
  await removeImageFiles(
    supabase,
    removed.flatMap((image) => (image.storage_path && !stillUsed.has(image.storage_path) ? [image.storage_path] : [])),
  )
  return null
}

function revalidateProductPages(productId: string, slug: string, previousSlug?: string) {
  revalidatePath('/admin')
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath('/')
  // 'layout' also refreshes pages nested under /shop, such as category listings.
  revalidatePath('/shop', 'layout')
  revalidatePath(`/products/${slug}`)
  if (previousSlug && previousSlug !== slug) revalidatePath(`/products/${previousSlug}`)
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function createProduct(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return actionError(NOT_CONFIGURED_MESSAGE)
  await requireAdmin()

  const parsed = parseProductForm(formData)
  if (!parsed.ok) return parsed.state
  if (hasUnknownIds(parsed.data, null)) return actionError(STALE_FORM_MESSAGE)
  const { product, variants, images } = parsed.data

  const supabase = await createClient()
  const skuConflict = await findSkuConflict(supabase, variants, null)
  if (skuConflict) return actionError(FIX_FIELDS_MESSAGE, { variants: [skuConflict] })

  const { data: created, error } = await supabase.from('products').insert(product).select('id').single<{ id: string }>()
  if (error || !created) return productWriteError(error)

  // Images are only written when the variants succeeded.
  const childError =
    (await syncVariants(supabase, created.id, variants, new Set())) ??
    (await syncImages(supabase, created.id, images, []))

  if (childError) {
    // The API has no multi-statement transactions, so undo by hand:
    // deleting the product also deletes any variants/images already inserted.
    const { error: cleanupError } = await supabase.from('products').delete().eq('id', created.id)
    if (cleanupError) console.error('[products] rollback after failed create failed', cleanupError.message)
    return childError
  }

  revalidateProductPages(created.id, product.slug)
  redirect(`/admin/products/${created.id}?created=1`)
}

export async function updateProduct(
  productId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured) return actionError(NOT_CONFIGURED_MESSAGE)
  await requireAdmin()
  if (!uuidField.safeParse(productId).success) return actionError(MISSING_PRODUCT_MESSAGE)

  const parsed = parseProductForm(formData)
  if (!parsed.ok) return parsed.state
  const { product, variants, images } = parsed.data

  const supabase = await createClient()
  const existing = await loadExistingProduct(supabase, productId)
  if (!existing) return actionError(MISSING_PRODUCT_MESSAGE)
  if (hasUnknownIds(parsed.data, existing)) return actionError(STALE_FORM_MESSAGE)

  const skuConflict = await findSkuConflict(supabase, variants, productId)
  if (skuConflict) return actionError(FIX_FIELDS_MESSAGE, { variants: [skuConflict] })

  const { error } = await supabase.from('products').update(product).eq('id', productId)
  if (error) return productWriteError(error)

  const childError =
    (await syncVariants(supabase, productId, variants, existing.variantIds)) ??
    (await syncImages(supabase, productId, images, existing.images))

  // Revalidate even after a partial failure: the product row itself has already changed.
  revalidateProductPages(productId, product.slug, existing.slug)
  return childError ?? actionSuccess('Product saved.')
}

export async function deleteProduct(productId: string): Promise<ActionState> {
  if (!isSupabaseConfigured) return actionError(NOT_CONFIGURED_MESSAGE)
  await requireAdmin()
  if (!uuidField.safeParse(productId).success) return actionError(MISSING_PRODUCT_MESSAGE)

  const supabase = await createClient()

  // Keep order history intact: products that were ever ordered can only be archived.
  const { count, error: countError } = await supabase
    .from('order_items')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)
  if (countError) {
    console.error('[products] order check before delete failed', countError.message)
    return actionError('The product could not be deleted. Please try again.')
  }
  if (count) {
    return actionError(
      `This product appears in ${pluralize(count, 'order')}, so it can't be deleted. ` +
        'Set its status to Archived to hide it from the store instead.',
    )
  }

  const existing = await loadExistingProduct(supabase, productId)
  if (!existing) return actionError(MISSING_PRODUCT_MESSAGE)

  // Variants, images, reviews and wishlist rows are removed by ON DELETE CASCADE.
  const { error } = await supabase.from('products').delete().eq('id', productId)
  if (error) {
    console.error('[products] delete failed', error.message)
    return actionError('The product could not be deleted. Please try again.')
  }

  await removeImageFiles(
    supabase,
    existing.images.flatMap((image) => (image.storage_path ? [image.storage_path] : [])),
  )
  revalidateProductPages(productId, existing.slug)
  redirect('/admin/products')
}
