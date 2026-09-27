import { Callout } from '@/components/todo/callout'
import { CodeBlock } from '@/components/todo/code-block'
import { ClickPath, Code, ExternalLink, TextLink } from '@/components/todo/prose'
import type { ChecklistContext, SectionDefinition } from '@/components/todo/types'

export function emailSection({ status }: ChecklistContext): SectionDefinition {
  return {
    id: 'email',
    title: 'Email (recommended)',
    summary:
      'Resend delivers the shop’s own emails: order received, payment confirmed, shipped with tracking, and your notifications about new orders and messages.',
    badge: status.emailConfigured ? { label: 'Active', tone: 'success' } : { label: 'Recommended', tone: 'warning' },
    intro: !status.emailConfigured && (
      <Callout tone="warning" title="No store emails are sent right now">
        Without Resend, customers get no order or shipping emails and you get no notification of new orders. Keep an
        eye on the admin area until this is set up.
      </Callout>
    ),
    steps: [
      {
        id: 'email-domain',
        title: 'Create a Resend account and verify your domain',
        content: (
          <>
            <p>
              Sign up at <ExternalLink href="https://resend.com">resend.com</ExternalLink>, open{' '}
              <ClickPath items={['Domains', 'Add domain']} /> and enter your domain. Resend shows a few DNS records:
              add them at your domain registrar exactly as shown (they cover <strong>SPF</strong> and{' '}
              <strong>DKIM</strong>) and wait until the domain says <strong>Verified</strong>.
            </p>
            <p>
              Also add a <strong>DMARC</strong> record at your registrar, so inboxes trust your mail. Type{' '}
              <Code>TXT</Code>, name <Code>_dmarc</Code>, value:
            </p>
            <CodeBlock code="v=DMARC1; p=none; rua=mailto:you@yourdomain.com" label="DMARC record value" />
          </>
        ),
      },
      {
        id: 'email-api-key',
        title: 'Create an API key',
        verified: status.env.RESEND_API_KEY,
        content: (
          <p>
            Open <ClickPath items={['API Keys', 'Create API key']} />, choose <strong>Sending access</strong> limited to
            your domain and save the key as <Code>RESEND_API_KEY</Code>. You can create a second key for Supabase’s
            custom SMTP (section C).
          </p>
        ),
      },
      {
        id: 'email-addresses',
        title: 'Set the sender and your notification address',
        verified: status.emailConfigured && status.env.ADMIN_NOTIFICATION_EMAIL,
        content: (
          <ul>
            <li>
              <Code>EMAIL_FROM</Code>: the sender customers see, on your verified domain:{' '}
              <Code>Knotted Studio &lt;orders@yourdomain.com&gt;</Code>
            </li>
            <li>
              <Code>ADMIN_NOTIFICATION_EMAIL</Code>: the inbox that should hear about new orders, custom requests and
              contact messages.
            </li>
          </ul>
        ),
      },
      {
        id: 'email-test',
        title: 'Send yourself a test',
        content: (
          <p>
            Redeploy, then send a message through the <TextLink href="/contact">contact form</TextLink> and place a
            small test order. Check that the emails arrive, and look in the spam folder too. Nothing arriving? Check
            the Resend dashboard’s <strong>Logs</strong> for the reason.
          </p>
        ),
      },
    ],
  }
}
