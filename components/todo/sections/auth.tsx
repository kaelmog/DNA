import { Callout } from '@/components/todo/callout'
import { CodeBlock } from '@/components/todo/code-block'
import { ClickPath, Code, ExternalLink } from '@/components/todo/prose'
import type { ChecklistContext, SectionDefinition } from '@/components/todo/types'

/**
 * Token-hash links are verified by app/auth/confirm/route.ts. Unlike the default
 * links they also work when the email is opened on another device or browser.
 */
const EMAIL_TEMPLATES = [
  {
    name: 'Confirm signup',
    code: '<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/account">Confirm your email</a>',
  },
  {
    name: 'Reset password',
    code: '<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Choose a new password</a>',
  },
  {
    name: 'Change email address',
    code: '<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/account">Confirm your new email</a>',
  },
]

export function authSection({ liveUrl }: ChecklistContext): SectionDefinition {
  return {
    id: 'auth',
    title: 'Supabase Auth (customer accounts)',
    summary:
      'Tells Supabase where your shop lives so sign-up, password reset and email-change links bring customers back to the right place.',
    badge: { label: 'Required', tone: 'info' },
    steps: [
      {
        id: 'auth-urls',
        title: 'Set the Site URL and redirect URLs',
        content: (
          <>
            <p>
              Open <ClickPath items={['Authentication', 'URL Configuration']} />.
            </p>
            <p>
              <strong>Site URL</strong>: your domain, without a trailing slash. Use <Code>http://localhost:3000</Code>{' '}
              only until the site is live.
            </p>
            <CodeBlock code={liveUrl} label="Site URL" />
            <p>
              <strong>Redirect URLs</strong>: click <strong>Add URL</strong> and add each of these lines, one at a time.
            </p>
            <CodeBlock
              code={[`${liveUrl}/auth/callback`, `${liveUrl}/auth/confirm`, 'http://localhost:3000/**'].join('\n')}
              label="Redirect URLs"
            />
            <p className="text-sm">
              Want sign-in emails to work on Vercel preview deployments too? Also add{' '}
              <Code>https://*-your-team.vercel.app/**</Code> with your Vercel team name.
            </p>
          </>
        ),
      },
      {
        id: 'auth-confirm-email',
        title: 'Keep “Confirm email” switched on',
        content: (
          <p>
            In <ClickPath items={['Authentication', 'Sign In / Providers', 'Email']} /> leave{' '}
            <strong>Confirm email</strong> on. It proves each customer owns their address and stops fake accounts.
          </p>
        ),
      },
      {
        id: 'auth-passwords',
        title: 'Set password rules',
        content: (
          <ul>
            <li>
              On the same Email provider page, set <strong>Minimum password length</strong> to <Code>8</Code> (the
              site’s forms ask for at least 8 characters too).
            </li>
            <li>
              Turn on <strong>Prevent use of leaked passwords</strong> (under{' '}
              <ClickPath items={['Authentication', 'Attack Protection']} /> in newer dashboards). It blocks passwords
              known from data breaches and needs the Pro plan.
            </li>
          </ul>
        ),
      },
      {
        id: 'auth-email-templates',
        title: 'Update the email templates',
        content: (
          <>
            <p>
              Open <ClickPath items={['Authentication', 'Emails', 'Templates']} />. In each template below, replace
              the link that uses <Code>{'{{ .ConfirmationURL }}'}</Code> with the snippet, then click Save. These links
              work even if the customer opens the email on a different phone or computer.
            </p>
            {EMAIL_TEMPLATES.map((template) => (
              <CodeBlock key={template.name} code={template.code} label={`${template.name} template link`} />
            ))}
            <p>While you are there, rewrite the subject lines and wording in your own voice.</p>
          </>
        ),
      },
      {
        id: 'auth-smtp',
        title: 'Send auth emails through your own email service (custom SMTP)',
        content: (
          <>
            <Callout tone="warning" title="The built-in sender is only for testing">
              Without custom SMTP, Supabase only delivers a few emails per hour and only to your own team’s addresses,
              so real customers would never receive their confirmation emails.
            </Callout>
            <p>
              Open <ClickPath items={['Authentication', 'Emails', 'SMTP Settings']} /> and enable custom SMTP. With
              Resend (section G) the values are:
            </p>
            <ul>
              <li>
                Host <Code>smtp.resend.com</Code>, port <Code>465</Code>, username <Code>resend</Code>
              </li>
              <li>Password: a Resend API key</li>
              <li>
                Sender email e.g. <Code>no-reply@yourdomain.com</Code> (on your verified domain), sender name{' '}
                <Code>Knotted Studio</Code>
              </li>
            </ul>
            <p>
              Then raise the email limit in <ClickPath items={['Authentication', 'Rate Limits']} /> (for example 100
              per hour). Guide:{' '}
              <ExternalLink href="https://resend.com/docs/send-with-supabase-smtp">Resend + Supabase SMTP</ExternalLink>.
            </p>
          </>
        ),
      },
      {
        id: 'auth-captcha',
        title: 'Optional: CAPTCHA against sign-up bots',
        content: (
          <>
            <p>
              Supabase can require a CAPTCHA (Cloudflare Turnstile or hCaptcha) in{' '}
              <ClickPath items={['Authentication', 'Attack Protection']} />. Start without it: the built-in rate limits
              are enough for most small shops.
            </p>
            <Callout tone="danger" title="Needs a code change first">
              The sign-up and login forms do not send a CAPTCHA token yet. Switching CAPTCHA on before a developer adds
              it to the forms blocks every customer from signing in. Tick this step once you have decided.
            </Callout>
          </>
        ),
      },
    ],
  }
}
