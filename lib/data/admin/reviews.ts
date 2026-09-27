import 'server-only'

import { ADMIN_PAGE_SIZE, REVIEW_STATUS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import type { Product, Review, ReviewStatus } from '@/lib/types'

/** Review moderation queries for the admin area. Callers must run requireAdmin() first. */

const REVIEW_STATUSES = Object.keys(REVIEW_STATUS) as ReviewStatus[]

export interface AdminReview extends Review {
  product: Pick<Product, 'id' | 'name' | 'slug'> | null
}

export function parseReviewStatus(value: string | undefined): ReviewStatus {
  return REVIEW_STATUSES.find((status) => status === value) ?? 'pending'
}

/** One page of reviews with a given status, newest first, with their product. */
export async function getAdminReviews({
  status,
  page,
}: {
  status: ReviewStatus
  page: number
}): Promise<{ items: AdminReview[]; total: number; pageCount: number }> {
  const supabase = await createClient()
  const from = (page - 1) * ADMIN_PAGE_SIZE

  const { data, count, error } = await supabase
    .from('reviews')
    .select('*, product:products(id, name, slug)', { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1)
    .overrideTypes<AdminReview[], { merge: false }>()

  if (error) {
    console.error('[admin/reviews] list failed', error.message)
    return { items: [], total: 0, pageCount: 1 }
  }

  const total = count ?? data.length
  return { items: data, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) }
}

/** Number of reviews per status. */
export async function getReviewCounts(): Promise<Record<ReviewStatus, number>> {
  const supabase = await createClient()
  const results = await Promise.all(
    REVIEW_STATUSES.map((status) =>
      supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', status),
    ),
  )

  return Object.fromEntries(
    REVIEW_STATUSES.map((status, index) => {
      const { count, error } = results[index]
      if (error) console.error('[admin/reviews] count failed', error.message)
      return [status, count ?? 0]
    }),
  ) as Record<ReviewStatus, number>
}
