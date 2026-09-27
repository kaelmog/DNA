import 'server-only'

import { cache } from 'react'

import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { ProductListing } from '@/lib/types'

/** Product ids on the signed-in user's wishlist ([] when signed out). Cached per request. */
export const getWishlistProductIds = cache(async (): Promise<string[]> => {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data, error } = await supabase.from('wishlist_items').select('product_id').eq('user_id', user.id)
  if (error) {
    console.error('[wishlist] could not load wishlist', error.message)
    return []
  }
  return data.map((row) => row.product_id as string)
})

/** Active products on the signed-in user's wishlist, newest first. */
export async function getWishlistProducts(): Promise<ProductListing[]> {
  const ids = await getWishlistProductIds()
  if (!ids.length) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_listings')
    .select('*')
    .in('id', ids)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .overrideTypes<ProductListing[], { merge: false }>()

  if (error) {
    console.error('[wishlist] could not load wishlist products', error.message)
    return []
  }
  return data.map((row) => ({
    ...row,
    rating_average: row.rating_average === null ? null : Number(row.rating_average),
    review_count: Number(row.review_count ?? 0),
  }))
}
