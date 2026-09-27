import { CodeBlock } from '@/components/todo/code-block'
import { ClickPath, ExternalLink, TextLink } from '@/components/todo/prose'
import type { ChecklistContext, SectionDefinition } from '@/components/todo/types'

const GRANT_ADMIN_SQL = "update public.profiles set role = 'admin' where email = 'you@yourdomain.com';"

export function adminsSection({ status }: ChecklistContext): SectionDefinition {
  const adminExists = status.database.adminExists === true

  return {
    id: 'admins',
    title: 'Admins',
    summary: 'Admins can see every order and customer and change the whole catalogue, so keep the list short.',
    badge: adminExists ? { label: 'Done', tone: 'success' } : { label: 'Required', tone: 'info' },
    steps: [
      {
        id: 'admins-account',
        title: 'Create your own customer account',
        verified: adminExists,
        content: (
          <p>
            Sign up on <TextLink href="/signup">/signup</TextLink> with the email address you will use to run the shop,
            then click the confirmation link in the email. Use a long, unique password from your password manager.
          </p>
        ),
      },
      {
        id: 'admins-grant',
        title: 'Make yourself an admin',
        verified: adminExists,
        content: (
          <>
            <p>
              In Supabase open <ClickPath items={['SQL Editor', 'New query']} />, paste this with your own email
              address and click Run:
            </p>
            <CodeBlock code={GRANT_ADMIN_SQL} label="SQL" />
            <p>
              Sign out and back in. An <strong>Admin</strong> link appears in the shop header and{' '}
              <TextLink href="/admin">/admin</TextLink> opens the dashboard. To remove someone’s admin rights later, run
              the same query with <strong>role = &apos;customer&apos;</strong>.
            </p>
          </>
        ),
      },
      {
        id: 'admins-minimal',
        title: 'Keep admins to a minimum',
        content: (
          <p>
            Only give admin rights to people who pack orders or manage products. Everyone else, including friends who
            help test, should stay a normal customer. Review the list now and then in{' '}
            <TextLink href="/admin/customers">Admin → Customers</TextLink>.
          </p>
        ),
      },
      {
        id: 'admins-mfa',
        title: 'Turn on two-factor authentication for Supabase',
        content: (
          <p>
            The Supabase dashboard can change anything, so protect it: open{' '}
            <ExternalLink href="https://supabase.com/dashboard/account/security">Account → Security</ExternalLink> and
            add an authenticator app. Store the recovery codes in your password manager.
          </p>
        ),
      },
    ],
  }
}
