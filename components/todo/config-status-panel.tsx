import { CircleCheck, CircleDashed, CircleHelp, CircleX, CreditCard, Landmark, TriangleAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Callout } from '@/components/todo/callout'
import { ENV_VARS, REQUIREMENT_LABEL, type EnvVarName } from '@/components/todo/env-vars'
import type { SetupStatus } from '@/components/todo/types'
import { cn } from '@/lib/utils'

type RowState = 'ok' | 'missing' | 'warning' | 'optional' | 'unknown'

const stateStyles: Record<RowState, { Icon: typeof CircleCheck; className: string }> = {
  ok: { Icon: CircleCheck, className: 'text-success' },
  missing: { Icon: CircleX, className: 'text-destructive' },
  warning: { Icon: TriangleAlert, className: 'text-warning' },
  optional: { Icon: CircleDashed, className: 'text-muted-foreground' },
  unknown: { Icon: CircleHelp, className: 'text-muted-foreground' },
}

interface StatusRow {
  key: string
  label: string
  state: RowState
  detail: string
  tag?: string
}

function StatusList({ title, rows }: { title: string; rows: StatusRow[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
        {rows.map((row) => {
          const { Icon, className } = stateStyles[row.state]
          return (
            <li key={row.key} className="flex items-start gap-3 px-3.5 py-3">
              <Icon className={cn('mt-0.5 size-5 shrink-0', className)} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-medium">{row.label}</span>
                  {row.tag && <span className="text-xs text-muted-foreground">{row.tag}</span>}
                </div>
                <p className="mt-0.5 text-sm break-words text-muted-foreground">{row.detail}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** One row per environment variable. Only says whether it is set, never what it is. */
function envRow(info: (typeof ENV_VARS)[number], status: SetupStatus): StatusRow {
  const isSet = status.env[info.name]
  const row = { key: info.name, label: info.label, tag: REQUIREMENT_LABEL[info.requirement] }

  if (info.name === 'NEXT_PUBLIC_SITE_URL') {
    if (!isSet) return { ...row, state: 'missing', detail: `Not set, so the site uses ${status.siteUrl}.` }
    if (status.siteUrlIsLocal && status.isProduction) {
      return { ...row, state: 'warning', detail: `${status.siteUrl}: change it to your real domain and redeploy.` }
    }
    return { ...row, state: 'ok', detail: status.siteUrl }
  }

  // The webhook secret becomes required as soon as Stripe is switched on.
  if (info.name === 'STRIPE_WEBHOOK_SECRET' && status.stripeConfigured && !isSet) {
    return {
      ...row,
      tag: 'Required with Stripe',
      state: 'missing',
      detail: 'Missing: paid Stripe orders would never be marked as paid.',
    }
  }

  if (isSet) {
    const detail = info.name === 'STRIPE_SECRET_KEY' && status.stripeMode ? `Set (${status.stripeMode} mode)` : 'Set'
    return { ...row, state: 'ok', detail }
  }
  if (info.requirement === 'required') return { ...row, state: 'missing', detail: 'Missing' }
  if (info.requirement === 'recommended') return { ...row, state: 'warning', detail: 'Not set' }
  return { ...row, state: 'optional', detail: 'Not set' }
}

/**
 * A live database check. `null` (could not check) shows `details.unknown`;
 * otherwise `pass` decides between the ok and the failing state.
 */
function checkRow(
  key: string,
  label: string,
  pass: boolean | null,
  details: { ok: string; fail: string; failState: RowState; unknown: string },
): StatusRow {
  if (pass === null) return { key, label, state: 'unknown', detail: details.unknown }
  return pass
    ? { key, label, state: 'ok', detail: details.ok }
    : { key, label, state: details.failState, detail: details.fail }
}

function databaseRows({ database, supabaseConfigured, supabaseAdminConfigured }: SetupStatus): StatusRow[] {
  const unknown = supabaseConfigured
    ? 'Could not check right now. Reload the page to try again.'
    : 'Connect Supabase first.'
  // Admin and demo-data checks read tables that only admins (or the secret key) can see.
  const unknownPrivate =
    supabaseConfigured && !supabaseAdminConfigured ? 'Sign in as an admin, or add the secret key, to check.' : unknown
  const { demoCustomers, demoProducts } = database
  const hasDemoData = demoCustomers === null || demoProducts === null ? null : demoCustomers + demoProducts > 0

  return [
    checkRow('schema', 'Database schema (schema.sql)', database.schemaInstalled, {
      ok: 'Installed',
      fail: 'Not installed yet: run supabase/schema.sql (section A).',
      failState: 'missing',
      unknown,
    }),
    checkRow('starter', 'Starter data (seed.sql)', database.starterData, {
      ok: 'Categories found',
      fail: 'No categories yet. Optional: run supabase/seed.sql or add your own in Admin.',
      failState: 'optional',
      unknown,
    }),
    checkRow('admin', 'Admin account', database.adminExists, {
      ok: 'At least one admin exists',
      fail: 'No admin yet: see section D.',
      failState: 'missing',
      unknown: unknownPrivate,
    }),
    checkRow('demo', 'Demo data', hasDemoData === null ? null : !hasDemoData, {
      ok: 'None found',
      fail: `${demoCustomers} demo customers and ${demoProducts} demo products: remove them before launch (section J).`,
      failState: 'warning',
      unknown: unknownPrivate,
    }),
  ]
}

function PaymentMode({ status }: { status: SetupStatus }) {
  const Icon = status.stripeConfigured ? CreditCard : Landmark
  return (
    <div className="flex items-start gap-3 rounded-xl bg-muted px-4 py-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-clay" aria-hidden="true" />
      <div className="text-sm leading-6">
        <p className="font-semibold">
          Payment mode:{' '}
          {status.stripeConfigured ? `Stripe checkout active (${status.stripeMode} mode)` : 'Manual payments (no Stripe keys)'}
        </p>
        <p className="text-muted-foreground">
          {status.stripeConfigured
            ? 'Customers pay by card on Stripe, and the Stripe webhook marks their orders as paid.'
            : 'Orders arrive as “Awaiting payment” and you mark them paid in Admin → Orders once the money is in.'}
        </p>
      </div>
    </div>
  )
}

/** Warnings for combinations that look fine one by one but break something together. */
function ConfigWarnings({ status }: { status: SetupStatus }) {
  const warnings: string[] = []
  if (status.supabaseConfigured && !status.supabaseAdminConfigured) {
    warnings.push('The Supabase secret key is missing, so checkout, the contact form and custom requests cannot save anything.')
  }
  if (status.env.RESEND_API_KEY !== status.env.EMAIL_FROM) {
    warnings.push('Email needs both RESEND_API_KEY and EMAIL_FROM. With only one of them set, no emails are sent.')
  }
  if (status.isProduction && status.stripeMode === 'test') {
    warnings.push('Stripe is in test mode: real cards will be declined. Switch to live keys when you are ready (section F).')
  }
  if (warnings.length === 0) return null

  return (
    <Callout tone="warning" title="Needs attention">
      <ul className="list-disc space-y-1 pl-5">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </Callout>
  )
}

/**
 * Configuration status, computed on the server for every visit. Shows only
 * whether each value is present (plus the public site URL), never the value.
 */
export function ConfigStatusPanel({ status }: { status: SetupStatus }) {
  const rowsFor = (names: EnvVarName[]) =>
    ENV_VARS.filter((info) => names.includes(info.name)).map((info) => envRow(info, status))

  return (
    <section aria-labelledby="config-status-title" className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="config-status-title" className="font-serif text-2xl tracking-tight">
          Configuration status
        </h2>
        <Badge tone={status.isProduction ? 'info' : 'neutral'}>
          {status.isProduction ? 'Production build' : 'Development'}
        </Badge>
      </div>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
        Read from this server every time the page loads. Secret values are never shown, only whether they are set.
        After changing a variable, restart <code className="font-mono">npm run dev</code> or redeploy on Vercel.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4">
        <PaymentMode status={status} />
        <ConfigWarnings status={status} />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <StatusList
            title="Site and database"
            rows={rowsFor([
              'NEXT_PUBLIC_SITE_URL',
              'NEXT_PUBLIC_SUPABASE_URL',
              'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
              'SUPABASE_SECRET_KEY',
            ])}
          />
          <StatusList title="Database checks" rows={databaseRows(status)} />
          <StatusList title="Payments (Stripe)" rows={rowsFor(['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'])} />
          <StatusList
            title="Email (Resend)"
            rows={rowsFor(['RESEND_API_KEY', 'EMAIL_FROM', 'ADMIN_NOTIFICATION_EMAIL'])}
          />
        </div>
      </div>
    </section>
  )
}
