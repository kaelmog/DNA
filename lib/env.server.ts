import 'server-only'

import { isSupabaseConfigured } from '@/lib/env'

/** Server-only secrets. Importing this file from a client component fails the build. */
export const serverEnv = {
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  emailFrom: process.env.EMAIL_FROM ?? '',
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? '',
}

/** The secret-key client is available (needed for checkout, webhooks and public forms). */
export const isSupabaseAdminConfigured = isSupabaseConfigured && Boolean(serverEnv.supabaseSecretKey)

export const isStripeConfigured = Boolean(serverEnv.stripeSecretKey)

export const isEmailConfigured = Boolean(serverEnv.resendApiKey && serverEnv.emailFrom)
