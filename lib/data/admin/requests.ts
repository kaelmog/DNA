import 'server-only'

import { ADMIN_PAGE_SIZE, CUSTOM_REQUEST_STATUS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import type { CustomRequest, CustomRequestStatus } from '@/lib/types'

/** Custom (made-to-order) request queries for the admin area. Callers must run requireAdmin() first. */

export const CUSTOM_REQUEST_BUCKET = 'custom-requests'

/** Reference images are private; admins get a link that stops working after an hour. */
const SIGNED_URL_SECONDS = 60 * 60

const REQUEST_STATUSES = Object.keys(CUSTOM_REQUEST_STATUS) as CustomRequestStatus[]

export type RequestFilter = CustomRequestStatus | 'all'

export interface AdminCustomRequest extends CustomRequest {
  /** Short-lived signed URL for the reference image, or null. */
  reference_image_url: string | null
}

export function parseRequestFilter(value: string | undefined): RequestFilter {
  return REQUEST_STATUSES.find((status) => status === value) ?? 'all'
}

/** Signed URLs for the given storage paths, keyed by path. Missing or failed paths are left out. */
async function signReferenceImages(paths: string[]): Promise<Map<string, string>> {
  if (!paths.length) return new Map()

  const supabase = await createClient()
  const { data, error } = await supabase.storage.from(CUSTOM_REQUEST_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS)
  if (error) {
    console.error('[admin/requests] signing images failed', error.message)
    return new Map()
  }

  const urls = new Map<string, string>()
  data.forEach((item) => {
    if (item.path && item.signedUrl && !item.error) urls.set(item.path, item.signedUrl)
  })
  return urls
}

/** One page of custom requests, newest first, with signed reference image URLs. */
export async function getCustomRequests({
  status,
  page,
}: {
  status: RequestFilter
  page: number
}): Promise<{ items: AdminCustomRequest[]; total: number; pageCount: number }> {
  const supabase = await createClient()
  const from = (page - 1) * ADMIN_PAGE_SIZE

  let query = supabase.from('custom_requests').select('*', { count: 'exact' })
  if (status !== 'all') query = query.eq('status', status)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1)
    .overrideTypes<CustomRequest[], { merge: false }>()

  if (error) {
    console.error('[admin/requests] list failed', error.message)
    return { items: [], total: 0, pageCount: 1 }
  }

  const paths = data.flatMap((request) => (request.reference_image_path ? [request.reference_image_path] : []))
  const signedUrls = await signReferenceImages(paths)

  const total = count ?? data.length
  return {
    items: data.map((request) => ({
      ...request,
      reference_image_url: request.reference_image_path
        ? (signedUrls.get(request.reference_image_path) ?? null)
        : null,
    })),
    total,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  }
}

/** Number of requests per status, plus "all". */
export async function getRequestCounts(): Promise<Record<RequestFilter, number>> {
  const supabase = await createClient()
  const results = await Promise.all(
    REQUEST_STATUSES.map((status) =>
      supabase.from('custom_requests').select('id', { count: 'exact', head: true }).eq('status', status),
    ),
  )

  const counts = { all: 0 } as Record<RequestFilter, number>
  REQUEST_STATUSES.forEach((status, index) => {
    const { count, error } = results[index]
    if (error) console.error('[admin/requests] count failed', error.message)
    counts[status] = count ?? 0
    counts.all += count ?? 0
  })
  return counts
}
