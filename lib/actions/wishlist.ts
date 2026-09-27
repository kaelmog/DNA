'use server'

import { revalidatePath } from 'next/cache'

import { NOT_CONFIGURED_MESSAGE } from '@/lib/actions'
import { getCurrentUser } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import { uuidField } from '@/lib/validation'

const GENERIC_ERROR = 'We could not update your wishlist. Please try again.'

/**
 * Adds the product to the signed-in visitor's wishlist, or removes it when it
 * is already there. Row Level Security scopes every query to the visitor, so
 * the only input trusted from the browser is a validated product id.
 */
export async function toggleWishlist(
  productId: string,
): Promise<{ ok: boolean; wishlisted: boolean; requiresLogin?: boolean; message?: string }> {
  // Checked before auth: without Supabase nobody can sign in, so "please log in" would be misleading.
  if (!isSupabaseConfigured) return { ok: false, wishlisted: false, message: NOT_CONFIGURED_MESSAGE }

  const user = await getCurrentUser()
  if (!user) return { ok: false, wishlisted: false, requiresLogin: true }

  const parsed = uuidField.safeParse(productId)
  if (!parsed.success) return { ok: false, wishlisted: false, message: 'That product could not be found.' }

  const supabase = await createClient()
  const { data: existing, error: readError } = await supabase
    .from('wishlist_items')
    .select('product_id')
    .eq('user_id', user.id)
    .eq('product_id', parsed.data)
    .maybeSingle<{ product_id: string }>()

  if (readError) {
    console.error('[wishlist] lookup failed', readError.message)
    return { ok: false, wishlisted: false, message: GENERIC_ERROR }
  }

  if (existing) {
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', parsed.data)

    if (error) {
      console.error('[wishlist] delete failed', error.message)
      return { ok: false, wishlisted: true, message: GENERIC_ERROR }
    }
    revalidatePath('/account/wishlist')
    return { ok: true, wishlisted: false }
  }

  const { error } = await supabase.from('wishlist_items').insert({ user_id: user.id, product_id: parsed.data })

  // 23505: saved in another tab a moment ago, which is the outcome the visitor wanted anyway.
  if (error && error.code !== '23505') {
    // 23503: the product id does not exist (deleted, or never did).
    if (error.code === '23503') return { ok: false, wishlisted: false, message: 'That product could not be found.' }
    console.error('[wishlist] insert failed', error.message)
    return { ok: false, wishlisted: false, message: GENERIC_ERROR }
  }

  revalidatePath('/account/wishlist')
  return { ok: true, wishlisted: true }
}
