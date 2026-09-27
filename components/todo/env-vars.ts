/**
 * Every environment variable the store reads, in the same order as .env.example.
 * The launch checklist uses this list for the configuration status panel and
 * for the variables table, so the two can never drift apart.
 */

export type EnvVarVisibility = 'public' | 'secret' | 'server'
export type EnvVarRequirement = 'required' | 'recommended' | 'optional'

export interface EnvVarInfo {
  name: string
  /** Short name for the status panel. */
  label: string
  purpose: string
  whereToFind: string
  /** public = visible in the browser, secret = server only and sensitive, server = server only. */
  visibility: EnvVarVisibility
  requirement: EnvVarRequirement
}

export const ENV_VARS = [
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    label: 'Site URL',
    purpose: 'The public address of the shop, without a trailing slash. Used in emails, SEO tags and payment redirects.',
    whereToFind: 'Your domain, e.g. https://yourdomain.com. Use http://localhost:3000 on your computer.',
    visibility: 'public',
    requirement: 'required',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    label: 'Supabase URL',
    purpose: 'The address of your Supabase project (database, sign-in and file storage).',
    whereToFind: 'Supabase → Project Settings → Data API → Project URL (or the Connect button at the top).',
    visibility: 'public',
    requirement: 'required',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    label: 'Supabase publishable key',
    purpose: 'Lets the browser talk to Supabase. Safe to expose: the database security rules still apply.',
    whereToFind: 'Supabase → Project Settings → API Keys → Publishable key (starts with sb_publishable_).',
    visibility: 'public',
    requirement: 'required',
  },
  {
    name: 'SUPABASE_SECRET_KEY',
    label: 'Supabase secret key',
    purpose: 'Creates orders, saves form submissions and runs rate limits on the server. It bypasses every security rule.',
    whereToFind: 'Supabase → Project Settings → API Keys → Secret keys (starts with sb_secret_).',
    visibility: 'secret',
    requirement: 'required',
  },
  {
    name: 'STRIPE_SECRET_KEY',
    label: 'Stripe secret key',
    purpose: 'Switches checkout to Stripe card payments. Leave it empty to keep taking manual payments.',
    whereToFind: 'Stripe → Developers → API keys → Secret key (sk_test_ while testing, sk_live_ when live).',
    visibility: 'secret',
    requirement: 'optional',
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    label: 'Stripe webhook secret',
    purpose: 'Verifies Stripe payment notifications so paid orders are marked as paid. Needed as soon as the Stripe key is set.',
    whereToFind: 'Stripe → Developers → Webhooks → your endpoint → Signing secret (starts with whsec_).',
    visibility: 'secret',
    requirement: 'optional',
  },
  {
    name: 'RESEND_API_KEY',
    label: 'Resend API key',
    purpose: 'Sends order, payment, shipping and form emails. Without it the shop sends no emails of its own.',
    whereToFind: 'Resend → API Keys → Create API key (Sending access).',
    visibility: 'secret',
    requirement: 'recommended',
  },
  {
    name: 'EMAIL_FROM',
    label: 'Email sender',
    purpose: 'The sender of store emails, e.g. "Knotted Studio <orders@yourdomain.com>". Needed together with the Resend key.',
    whereToFind: 'You choose it. The domain must be verified in Resend → Domains.',
    visibility: 'server',
    requirement: 'recommended',
  },
  {
    name: 'ADMIN_NOTIFICATION_EMAIL',
    label: 'Admin notification email',
    purpose: 'Where new-order, custom request and contact form notifications are sent.',
    whereToFind: 'Your own inbox, e.g. you@yourdomain.com.',
    visibility: 'server',
    requirement: 'recommended',
  },
] as const satisfies readonly EnvVarInfo[]

export type EnvVarName = (typeof ENV_VARS)[number]['name']

export const VISIBILITY_LABEL: Record<EnvVarVisibility, string> = {
  public: 'Public',
  secret: 'Secret',
  server: 'Server only',
}

export const REQUIREMENT_LABEL: Record<EnvVarRequirement, string> = {
  required: 'Required',
  recommended: 'Recommended',
  optional: 'Optional',
}
