import { Callout } from '@/components/todo/callout'
import { CodeBlock } from '@/components/todo/code-block'
import { ClickPath, Code, ExternalLink } from '@/components/todo/prose'
import type { SectionDefinition } from '@/components/todo/types'

export function securitySection(): SectionDefinition {
  return {
    id: 'security',
    title: 'Security hardening',
    summary:
      'The code already protects data with security rules, rate limits and strict headers. These steps protect the accounts around it.',
    badge: { label: 'Required', tone: 'info' },
    steps: [
      {
        id: 'security-2fa',
        title: 'Turn on two-factor authentication everywhere',
        content: (
          <p>
            Supabase, Vercel, GitHub, your domain registrar, the email account you use for the shop, and Stripe once
            you use it. Use an authenticator app or passkey rather than SMS, and keep the recovery codes in your
            password manager. Most shop break-ins start with one of these accounts.
          </p>
        ),
      },
      {
        id: 'security-private-repo',
        title: 'Keep the repository private',
        content: (
          <p>
            In GitHub, <ClickPath items={['Settings', 'General']} /> should show the repository as private. Only invite
            people who need the code.
          </p>
        ),
      },
      {
        id: 'security-advisors',
        title: 'Run the Supabase Advisors',
        content: (
          <p>
            Open <ClickPath items={['Advisors', 'Security Advisor']} /> and then <strong>Performance Advisor</strong>.
            Fix anything marked as an error (a developer can help) and check again after every database change.
          </p>
        ),
      },
      {
        id: 'security-rls',
        title: 'Never switch off Row Level Security',
        content: (
          <Callout tone="danger" title="RLS is what keeps customers’ data apart">
            It stops shoppers from reading each other’s orders and addresses. If Supabase ever shows a table as “RLS
            disabled”, do not ignore it: run <Code>supabase/schema.sql</Code> again to restore the rules.
          </Callout>
        ),
      },
      {
        id: 'security-rotate',
        title: 'Know how to replace a leaked key',
        content: (
          <>
            <p>If a secret ends up somewhere public, replace it straight away, then redeploy on Vercel:</p>
            <ul>
              <li>
                Supabase: <ClickPath items={['Project Settings', 'API Keys']} />, create a new secret key, update
                Vercel, then delete the old key.
              </li>
              <li>
                Stripe: <ClickPath items={['Developers', 'API keys']} />, then <strong>Roll key</strong>.
              </li>
              <li>Resend: delete the key and create a new one.</li>
            </ul>
          </>
        ),
      },
      {
        id: 'security-firewall',
        title: 'Turn on Vercel’s firewall protections',
        content: (
          <p>
            In <ClickPath items={['Project', 'Firewall']} /> enable <strong>Bot Protection</strong>. During an attack,
            switch on <strong>Attack Challenge Mode</strong>; add a rate-limit rule for <Code>/login</Code> or{' '}
            <Code>/checkout</Code> if you ever see abuse there. The site already rate-limits sign-ups, forms and
            checkout on its own.
          </p>
        ),
      },
      {
        id: 'security-turnstile',
        title: 'Add Cloudflare Turnstile if spam appears',
        content: (
          <p>
            If the contact or custom request forms start receiving spam despite the built-in honeypot and rate limits,
            ask a developer to add{' '}
            <ExternalLink href="https://www.cloudflare.com/application-services/products/turnstile/">
              Cloudflare Turnstile
            </ExternalLink>{' '}
            (free, privacy-friendly). No action needed until then.
          </p>
        ),
      },
      {
        id: 'security-dependencies',
        title: 'Keep dependencies patched',
        content: (
          <>
            <p>
              In GitHub, open <ClickPath items={['Settings', 'Code security']} /> and enable Dependabot alerts and
              security updates. Now and then run:
            </p>
            <CodeBlock code="npm audit" label="Terminal" />
          </>
        ),
      },
      {
        id: 'security-backups',
        title: 'Make sure you have backups',
        content: (
          <p>
            The Supabase Free plan has no backups you can restore, and inactive free projects get paused. Before
            launch, move to the Pro plan: it keeps daily backups (<ClickPath items={['Database', 'Backups']} />). Add
            Point-in-Time Recovery if losing even a day of orders would hurt.
          </p>
        ),
      },
      {
        id: 'security-csp',
        title: 'Update the Content Security Policy when adding scripts',
        content: (
          <p>
            The site only lets the browser load scripts from approved places (see <Code>contentSecurityPolicy</Code> in{' '}
            <Code>next.config.ts</Code>). If you add a chat widget, analytics or an ad pixel, its domains must be added
            there too, or the browser will block it.
          </p>
        ),
      },
    ],
  }
}
