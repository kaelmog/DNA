'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { actionError, actionSuccess, formDataToObject, type ActionState } from '@/lib/actions'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/lib/types'
import { uuidField } from '@/lib/validation'

const REVIEW_MISSING = 'This review no longer exists.'
const SAVE_FAILED = 'Could not update the review. Please try again.'

type ReviewProduct = { product: Pick<Product, 'slug'> | null }

/**
 * The slug of the reviewed product, read from the database (never from the
 * form), so the right product page is refreshed. `found` is false when the
 * review does not exist.
 */
async function loadReviewProductSlug(reviewId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('product:products(slug)')
    .eq('id', reviewId)
    .maybeSingle<ReviewProduct>()
  if (error) console.error('[admin/reviews] load failed', error.message)
  return { failed: Boolean(error), found: Boolean(data), slug: data?.product?.slug ?? null }
}

/** Approved reviews change the product page and the ratings on product cards. */
function revalidateReviewPages(productSlug: string | null) {
  revalidatePath('/admin/reviews')
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/shop', 'layout')
  if (productSlug) revalidatePath(`/products/${productSlug}`)
}

const moderateSchema = z.object({
  id: uuidField,
  status: z.enum(['approved', 'rejected']),
})

/** Approves (publishes) or rejects (hides) a review. */
export async function setReviewStatus(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const parsed = moderateSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionError('Invalid request.')
  const { id, status } = parsed.data

  const review = await loadReviewProductSlug(id)
  if (review.failed) return actionError(SAVE_FAILED)
  if (!review.found) return actionError(REVIEW_MISSING)

  const supabase = await createClient()
  const { data, error } = await supabase.from('reviews').update({ status }).eq('id', id).select('id').maybeSingle()

  if (error) {
    console.error('[admin/reviews] status update failed', error.message)
    return actionError(SAVE_FAILED)
  }
  if (!data) return actionError(REVIEW_MISSING)

  revalidateReviewPages(review.slug)
  return actionSuccess(
    status === 'approved'
      ? 'Review approved. It now shows on the product page.'
      : 'Review rejected. It is hidden from the store.',
  )
}

const deleteSchema = z.object({ id: uuidField })

export async function deleteReview(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const parsed = deleteSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionError('Invalid request.')
  const { id } = parsed.data

  const review = await loadReviewProductSlug(id)
  if (review.failed) return actionError('Could not delete the review. Please try again.')
  if (!review.found) return actionError(REVIEW_MISSING)

  const supabase = await createClient()
  const { data, error } = await supabase.from('reviews').delete().eq('id', id).select('id').maybeSingle()

  if (error) {
    console.error('[admin/reviews] delete failed', error.message)
    return actionError('Could not delete the review. Please try again.')
  }
  if (!data) return actionError(REVIEW_MISSING)

  revalidateReviewPages(review.slug)
  return actionSuccess('Review deleted.')
}
