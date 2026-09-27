import 'server-only'

import { cache } from 'react'

import { DEFAULT_STORE_SETTINGS } from '@/lib/demo-data'
import { isSupabaseConfigured } from '@/lib/env'
import { createPublicClient } from '@/lib/supabase/public'
import type { StoreSettings } from '@/lib/types'

/** Store settings (single row). Falls back to defaults before Supabase is set up. Cached per request. */
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  if (!isSupabaseConfigured) return DEFAULT_STORE_SETTINGS

  const { data, error } = await createPublicClient()
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle<StoreSettings>()

  if (error) console.error('[settings] could not load store settings', error.message)
  return data ?? DEFAULT_STORE_SETTINGS
})
