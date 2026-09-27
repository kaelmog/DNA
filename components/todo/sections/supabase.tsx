import { Callout } from '@/components/todo/callout'
import { ClickPath, Code, ExternalLink } from '@/components/todo/prose'
import { SqlFileBlock } from '@/components/todo/sql-file-block'
import type { ChecklistContext, SectionDefinition } from '@/components/todo/types'

export function supabaseSection({ status, schemaSql, seedSql }: ChecklistContext): SectionDefinition {
  return {
    id: 'supabase',
    title: 'Supabase',
    summary:
      'Supabase is your database, customer sign-in and photo storage. The project is connected; these steps confirm it is completely set up.',
    badge: status.supabaseConfigured ? { label: 'Connected', tone: 'success' } : { label: 'Start here', tone: 'warning' },
    steps: [
      {
        id: 'supabase-project',
        title: 'Create the Supabase project and connect it',
        verified: status.supabaseConfigured,
        content: (
          <>
            <p>
              Sign in at <ExternalLink href="https://supabase.com/dashboard">supabase.com/dashboard</ExternalLink>,
              click <strong>New project</strong>, pick the region closest to your customers and save the database
              password in your password manager.
            </p>
            <p>
              Then copy the project URL and keys into your environment variables (section B). This site reads them
              when it starts.
            </p>
          </>
        ),
      },
      {
        id: 'supabase-schema',
        title: 'Run the database schema (schema.sql)',
        verified: status.database.schemaInstalled === true,
        content: (
          <>
            <p>
              The schema creates every table, the security rules (Row Level Security), the order and stock functions
              and the two storage buckets: <Code>product-images</Code> (public) and <Code>custom-requests</Code>{' '}
              (private).
            </p>
            <ol>
              <li>
                In Supabase open <ClickPath items={['SQL Editor', 'New query']} />.
              </li>
              <li>Click Copy below, paste the whole file into the editor and click Run.</li>
              <li>
                You should see “Success. No rows returned”. Running it again later is safe: it only adds what is
                missing and refreshes functions and rules.
              </li>
            </ol>
            <SqlFileBlock file={schemaSql} />
            <Callout tone="warning">
              Do not change tables by hand in the Table Editor. The site expects exactly the tables in this file; ask a
              developer to update <Code>supabase/schema.sql</Code> instead.
            </Callout>
          </>
        ),
      },
      {
        id: 'supabase-seed',
        title: 'Load the starter data (seed.sql)',
        verified: status.database.starterData === true,
        content: (
          <>
            <p>
              Optional. Adds four categories, the four launch products (using the photos that ship with the site) and
              a <Code>WELCOME10</Code> discount code. Run it the same way as the schema. Rows that already exist are
              skipped, so it is safe to run twice.
            </p>
            <SqlFileBlock file={seedSql} />
          </>
        ),
      },
      {
        id: 'supabase-keys',
        title: 'Know where your keys live',
        content: (
          <ul>
            <li>
              <strong>Project URL</strong>: <ClickPath items={['Project Settings', 'Data API']} />, or the{' '}
              <strong>Connect</strong> button at the top of the dashboard.
            </li>
            <li>
              <strong>Publishable key</strong> (<Code>sb_publishable_…</Code>):{' '}
              <ClickPath items={['Project Settings', 'API Keys']} />. It is meant to be public.
            </li>
            <li>
              <strong>Secret key</strong> (<Code>sb_secret_…</Code>): same page, under <strong>Secret keys</strong>.
              Older projects can use the <Code>anon</Code> and <Code>service_role</Code> keys from the “Legacy API
              Keys” tab instead.
            </li>
          </ul>
        ),
      },
      {
        id: 'supabase-secret-key',
        title: 'Keep the secret key on the server only',
        content: (
          <>
            <Callout tone="danger" title="The secret key opens everything">
              It bypasses every security rule: anyone who has it can read and change all orders and customer data.
            </Callout>
            <ul>
              <li>
                Only put it in <Code>.env.local</Code> on your computer and in Vercel’s environment variables.
              </li>
              <li>Never paste it into chats, emails, screenshots, support tickets or GitHub.</li>
              <li>
                If it ever leaks: <ClickPath items={['Project Settings', 'API Keys']} />, create a new secret key,
                update Vercel, redeploy, then delete the old key.
              </li>
            </ul>
          </>
        ),
      },
    ],
  }
}
