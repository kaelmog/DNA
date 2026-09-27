import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { Container } from '@/components/ui/misc'
import { Callout } from '@/components/todo/callout'
import { ConfigStatusPanel } from '@/components/todo/config-status-panel'
import { LaunchChecklist } from '@/components/todo/launch-checklist'
import { buildChecklistSections } from '@/components/todo/sections'
import { TodoHeader } from '@/components/todo/todo-header'
import { isCurrentUserAdmin } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/env'

import { getSetupStatus } from './setup-status'
import { readSqlFile } from './sql-files'

export const metadata: Metadata = {
  title: 'Launch checklist',
  robots: { index: false, follow: false },
}

const PLACEHOLDER_URL = 'https://yourdomain.com'

/**
 * Open while the shop is being set up (no database yet, or running locally).
 * On a live production site only signed-in admins can see it; everyone else gets a 404.
 */
async function canViewChecklist() {
  if (!isSupabaseConfigured || process.env.NODE_ENV !== 'production') return true
  return isCurrentUserAdmin()
}

export default async function LaunchChecklistPage() {
  // The status panel must reflect the current environment and database, never a build-time snapshot.
  await connection()
  if (!(await canViewChecklist())) notFound()

  const [status, schemaSql, seedSql] = await Promise.all([
    getSetupStatus(),
    readSqlFile('schema.sql'),
    readSqlFile('seed.sql'),
  ])
  const liveUrl = status.siteUrlIsLocal ? PLACEHOLDER_URL : status.siteUrl
  const sections = buildChecklistSections({ status, schemaSql, seedSql, liveUrl })

  return (
    <div className="flex min-h-dvh flex-col">
      <TodoHeader />
      <main id="main-content" className="flex-1">
        <Container className="max-w-5xl py-10 sm:py-14">
          <div className="max-w-3xl">
            <p className="eyebrow mb-3">Before you open the doors</p>
            <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">Launch checklist</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Everything that turns this site into a live shop, in order. Work through it top to bottom: each step
              says exactly where to click. Tick steps off as you go; the ones this site can check for itself are
              ticked for you.
            </p>
          </div>

          {status.isProduction && status.supabaseConfigured && (
            <Callout tone="info" className="mt-6 max-w-3xl">
              Only signed-in admins can open this page on the live site. Customers get a “page not found” instead.
            </Callout>
          )}

          <div className="mt-8 grid grid-cols-1 gap-10">
            <ConfigStatusPanel status={status} />
            <LaunchChecklist sections={sections} />
          </div>
        </Container>
      </main>
    </div>
  )
}
