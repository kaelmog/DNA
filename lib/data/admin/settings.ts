import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { StoreSettings } from '@/lib/types'

/**
 * The store settings row for the admin form. Unlike getStoreSettings() it does
 * not fall back to defaults: saving a form filled with defaults after a failed
 * load would overwrite the real settings. Callers must run requireAdmin() first.
 */
export async function getAdminStoreSettings(): Promise<StoreSettings | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).maybeSingle<StoreSettings>()
  if (error) console.error('[admin/settings] load failed', error.message)
  return data ?? null
}
