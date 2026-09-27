import { Callout } from '@/components/todo/callout'
import { CodeBlock } from '@/components/todo/code-block'
import { EnvVarTable } from '@/components/todo/env-var-table'
import { ClickPath, Code } from '@/components/todo/prose'
import type { ChecklistContext, SectionDefinition } from '@/components/todo/types'

export function environmentSection({ status }: ChecklistContext): SectionDefinition {
  const requiredSet = status.supabaseAdminConfigured && status.env.NEXT_PUBLIC_SITE_URL

  return {
    id: 'environment',
    title: 'Environment variables',
    summary:
      'Environment variables hold the addresses and keys the site needs. They live outside the code, so secrets never end up in GitHub.',
    badge: { label: 'Required', tone: 'info' },
    steps: [
      {
        id: 'environment-overview',
        title: 'Understand every variable',
        content: (
          <>
            <p>
              <strong>Public</strong> values are visible in the browser by design. <strong>Secret</strong> values must
              stay private. You need the four required ones to run the shop; the rest switch on extra features.
            </p>
            <EnvVarTable />
          </>
        ),
      },
      {
        id: 'environment-local',
        title: 'On your computer: .env.local',
        content: (
          <>
            <p>
              In a terminal opened in the project folder, copy the example file, then fill in the values with a text
              editor:
            </p>
            <CodeBlock code="copy .env.example .env.local" label="Windows (PowerShell or Command Prompt)" />
            <CodeBlock code="cp .env.example .env.local" label="Mac, Linux or Git Bash" />
            <p>
              Restart <Code>npm run dev</Code> after every change: the values are read when the server starts.
            </p>
            <Callout tone="warning">
              Never commit <Code>.env.local</Code> to Git. It is already listed in <Code>.gitignore</Code>, so leave
              that line in place.
            </Callout>
          </>
        ),
      },
      {
        id: 'environment-vercel',
        title: 'In production: add them in Vercel',
        content: (
          <ol>
            <li>
              Open <ClickPath items={['Vercel', 'your project', 'Settings', 'Environment Variables']} />.
            </li>
            <li>
              Add each variable for <strong>Production</strong> and <strong>Preview</strong>. Mark the secret ones as{' '}
              <strong>Sensitive</strong> so nobody can read them back.
            </li>
            <li>
              Changes only apply to new deployments: open <ClickPath items={['Deployments']} />, click the ⋯ menu on
              the latest one and choose <strong>Redeploy</strong>.
            </li>
          </ol>
        ),
      },
      {
        id: 'environment-verify',
        title: 'Check the configuration status panel',
        verified: requiredSet,
        content: (
          <p>
            The panel at the top of this page reads the live values each time you load it. Every required row should
            be green. On Vercel, open this page on your live site (signed in as an admin) to check production.
          </p>
        ),
      },
    ],
  }
}
