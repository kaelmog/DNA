import 'server-only'

import { cache } from 'react'

import { getCurrentUser } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/env'
import { createPublicClient } from '@/lib/supabase/public'
import { createClient } from '@/lib/supabase/server'
import type { Review } from '@/lib/types'

/**
 * Product review queries for the storefront. Approved reviews are public, so
 * they use the anonymous client; the visitor's own review (which may still be
 * pending) needs their session. Everything returns empty in demo mode.
 */

export interface ReviewSummary {
  /** Average approved rating rounded to one decimal, or null without reviews. */
  average: number | null
  count: number
}

const EMPTY_SUMMARY: ReviewSummary = { average: null, count: 0 }

/** Approved reviews for a product, newest first. */
export async function getApprovedReviews(productId: string, limit = 20): Promise<Review[]> {
  if (!isSupabaseConfigured) return []

  const { data, error } = await createPublicClient()
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit)
    .overrideTypes<Review[], { merge: false }>()

  if (error) {
    console.error('[reviews] getApprovedReviews failed', error.message)
    return []
  }
  return data
}

/**
 * Average rating and number of approved reviews. Read from the product_listings
 * view so the numbers match the product cards, even when there are more
 * reviews than the page lists.
 */
export async function getReviewSummary(productId: string): Promise<ReviewSummary> {
  if (!isSupabaseConfigured) return EMPTY_SUMMARY

  const { data, error } = await createPublicClient()
    .from('product_listings')
    .select('rating_average, review_count')
    .eq('id', productId)
    .maybeSingle<{ rating_average: number | string | null; review_count: number | string | null }>()

  if (error) {
    console.error('[reviews] getReviewSummary failed', error.message)
    return EMPTY_SUMMARY
  }
  if (!data) return EMPTY_SUMMARY

  // numeric and bigint columns can arrive as strings from PostgREST.
  const count = Number(data.review_count ?? 0)
  return {
    average: count > 0 && data.rating_average !== null ? Number(data.rating_average) : null,
    count,
  }
}

/** The signed-in visitor's review of this product in any status, or null. Cached per request. */
export const getMyReview = cache(async (productId: string): Promise<Review | null> => {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('user_id', user.id)
    .maybeSingle<Review>()

  if (error) {
    console.error('[reviews] getMyReview failed', error.message)
    return null
  }
  return data
})
