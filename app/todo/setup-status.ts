import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { EnvVarName } from '@/components/todo/env-vars'
import type { DatabaseStatus, SetupStatus } from '@/components/todo/types'
import { isCurrentUserAdmin } from '@/lib/auth'
import { isSupabaseConfigured, siteUrl, supabasePublishableKey, supabaseUrl } from '@/lib/env'
import { isEmailConfigured, isStripeConfigured, isSupabaseAdminConfigured, serverEnv } from '@/lib/env.server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPublicClient } from '@/lib/supabase/public'
import { createClient } from '@/lib/supabase/server'

/** A slow or unreachable database must not hang the checklist. */
const CHECK_TIMEOUT_MS = 5000

type CountResponse = { count: number | null; error: { code?: string; message: string } | null }

function isLocalUrl(url: string) {
  try {
    const { hostname } = new URL(url)
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')
  } catch {
    return false
  }
}

/** Booleans only: the values themselves never leave this file. */
function readEnvFlags(): Record<EnvVarName, boolean> {
  return {
    NEXT_PUBLIC_SITE_URL: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(supabaseUrl),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: Boolean(supabasePublishableKey),
    SUPABASE_SECRET_KEY: Boolean(serverEnv.supabaseSecretKey),
    STRIPE_SECRET_KEY: Boolean(serverEnv.stripeSecretKey),
    STRIPE_WEBHOOK_SECRET: Boolean(serverEnv.stripeWebhookSecret),
    RESEND_API_KEY: Boolean(serverEnv.resendApiKey),
    EMAIL_FROM: Boolean(serverEnv.emailFrom),
    ADMIN_NOTIFICATION_EMAIL: Boolean(serverEnv.adminNotificationEmail),
  }
}

function readStripeMode(): SetupStatus['stripeMode'] {
  if (!isStripeConfigured) return null
  return /^(sk|rk)_live_/.test(serverEnv.stripeSecretKey) ? 'live' : 'test'
}

/** Runs a head-only count query. Returns null (unknown) when it fails. */
async function readCount(label: string, request: PromiseLike<CountResponse>) {
  const { count, error } = await request
  if (error) {
    console.error(`[todo] ${label} check failed`, error.code || error.message)
    return null
  }
  return count ?? 0
}

/** True once schema.sql has run: PostgREST reports a missing table as PGRST205 (or 42P01). */
async function checkSchemaInstalled() {
  const { error } = await createPublicClient()
    .from('store_settings')
    .select('id')
    .limit(1)
    .abortSignal(AbortSignal.timeout(CHECK_TIMEOUT_MS))
  if (!error) return true
  if (error.code === 'PGRST205' || error.code === '42P01') return false
  console.error('[todo] schema check failed', error.code || error.message)
  return null
}

async function checkStarterData() {
  const count = await readCount(
    'starter data',
    createPublicClient()
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .abortSignal(AbortSignal.timeout(CHECK_TIMEOUT_MS)),
  )
  return count === null ? null : count > 0
}

/**
 * Admin and demo-data counts read tables that are private to admins.
 * An admin reads them through their own session (RLS lets admins see
 * everything). Before launch the page is also open to whoever runs the site
 * locally, so the secret-key client is used instead: the queries are head-only
 * counts, so no rows ever leave the database.
 */
async function privateCountsClient(viewerIsAdmin: boolean): Promise<SupabaseClient | null> {
  if (viewerIsAdmin) return createClient()
  return isSupabaseAdminConfigured ? createAdminClient() : null
}

async function checkPrivateCounts(viewerIsAdmin: boolean) {
  const client = await privateCountsClient(viewerIsAdmin)
  if (!client) return { adminExists: null, demoCustomers: null, demoProducts: null }

  const count = (table: string) =>
    client.from(table).select('id', { count: 'exact', head: true }).abortSignal(AbortSignal.timeout(CHECK_TIMEOUT_MS))

  // Demo data from `npm run seed:demo`: customers use @example.com emails, products carry the 'demo' tag.
  const [admins, demoCustomers, demoProducts] = await Promise.all([
    viewerIsAdmin ? 1 : readCount('admin', count('profiles').eq('role', 'admin')),
    readCount('demo customers', count('profiles').ilike('email', '%@example.com')),
    readCount('demo products', count('products').contains('tags', ['demo'])),
  ])

  return { adminExists: admins === null ? null : admins > 0, demoCustomers, demoProducts }
}

async function checkDatabase(viewerIsAdmin: boolean): Promise<DatabaseStatus> {
  if (!isSupabaseConfigured) {
    return { schemaInstalled: null, starterData: null, adminExists: null, demoCustomers: null, demoProducts: null }
  }

  const [schemaInstalled, starterData, privateCounts] = await Promise.all([
    checkSchemaInstalled(),
    checkStarterData(),
    checkPrivateCounts(viewerIsAdmin),
  ])
  return { schemaInstalled, starterData, ...privateCounts }
}

/** Everything the launch checklist shows about the current setup, computed per request. */
export async function getSetupStatus(): Promise<SetupStatus> {
  const viewerIsAdmin = await isCurrentUserAdmin()

  return {
    siteUrl,
    siteUrlIsLocal: isLocalUrl(siteUrl),
    isProduction: process.env.NODE_ENV === 'production',
    env: readEnvFlags(),
    supabaseConfigured: isSupabaseConfigured,
    supabaseAdminConfigured: isSupabaseAdminConfigured,
    stripeConfigured: isStripeConfigured,
    stripeMode: readStripeMode(),
    emailConfigured: isEmailConfigured,
    viewerIsAdmin,
    database: await checkDatabase(viewerIsAdmin),
  }
}
