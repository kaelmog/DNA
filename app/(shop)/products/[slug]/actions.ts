'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import {
  actionError,
  actionSuccess,
  actionValidationError,
  NOT_CONFIGURED_MESSAGE,
  type ActionState,
} from '@/lib/actions'
import { getCurrentUser } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/env'
import { rateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { optionalText, requiredText, uuidField } from '@/lib/validation'

const reviewSchema = z.object({
  productId: uuidField,
  slug: z.string().max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid product.'),
  rating: z.coerce
    .number({ error: 'Choose a rating.' })
    .int('Choose a rating.')
    .min(1, 'Choose a rating from 1 to 5 stars.')
    .max(5, 'Choose a rating from 1 to 5 stars.'),
  title: optionalText(120),
  body: z
    .string({ error: 'Please write your review.' })
    .trim()
    .min(10, 'Please write at least 10 characters.')
    .max(4000, 'Reviews must be 4000 characters or fewer.'),
  author_name: requiredText('Display name', 80),
})

/**
 * Saves a product review for moderation. Bind it on the product page:
 *   submitReview.bind(null, product.id, product.slug)
 *
 * The database trigger forces status = 'pending' and works out
 * is_verified_purchase, and RLS only accepts reviews of active products by the
 * signed-in user, so none of that is sent from here.
 */
export async function submitReview(
  productId: string,
  slug: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured) return actionError(NOT_CONFIGURED_MESSAGE)

  const user = await getCurrentUser()
  if (!user) return actionError('Please sign in to write a review.')

  const parsed = reviewSchema.safeParse({
    productId,
    slug,
    rating: formData.get('rating'),
    title: formData.get('title'),
    body: formData.get('body'),
    author_name: formData.get('author_name'),
  })
  if (!parsed.success) return actionValidationError(parsed.error)

  // Checked after validation so a typo does not use up one of the visitor's attempts.
  if (!(await rateLimit(`review:${user.id}`, 5, 3600))) {
    return actionError('You have sent several reviews recently. Please try again in an hour.')
  }

  const { productId: validProductId, slug: validSlug, rating, title, body, author_name } = parsed.data
  const supabase = await createClient()
  const { error } = await supabase
    .from('reviews')
    .insert({ product_id: validProductId, rating, title, body, author_name })

  if (error) {
    if (error.code === '23505') return actionError('You have already reviewed this product.')
    console.error('[reviews] insert failed', error.message)
    return actionError('We could not save your review. Please try again.')
  }

  revalidatePath(`/products/${validSlug}`)
  return actionSuccess('Thanks! Your review will appear once approved.')
}
