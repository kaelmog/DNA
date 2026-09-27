import { Callout } from '@/components/todo/callout'
import { CodeBlock } from '@/components/todo/code-block'
import { ClickPath, Code, ExternalLink } from '@/components/todo/prose'
import type { ChecklistContext, SectionDefinition } from '@/components/todo/types'

const FIRST_PUSH = [
  'git init',
  'git add .',
  'git commit -m "Knotted Studio"',
  'git branch -M main',
  'git remote add origin https://github.com/YOUR-NAME/knotted-studio.git',
  'git push -u origin main',
].join('\n')

export function deploySection({ status }: ChecklistContext): SectionDefinition {
  const liveSiteUrlSet = status.isProduction && status.env.NEXT_PUBLIC_SITE_URL && !status.siteUrlIsLocal

  return {
    id: 'deploy',
    title: 'Deploy to Vercel',
    summary: 'Vercel hosts the site, gives it HTTPS and redeploys automatically every time the code on GitHub changes.',
    badge: { label: 'Required', tone: 'info' },
    steps: [
      {
        id: 'deploy-github',
        title: 'Put the code in a private GitHub repository',
        content: (
          <>
            <p>
              Create a repository at <ExternalLink href="https://github.com/new">github.com/new</ExternalLink> and set
              it to <strong>Private</strong>. Then, in a terminal in the project folder:
            </p>
            <CodeBlock code={FIRST_PUSH} label="Terminal" />
            <Callout tone="warning">
              Before pushing, make sure <Code>.env.local</Code> is not listed by <Code>git status</Code>. It must never
              reach GitHub.
            </Callout>
          </>
        ),
      },
      {
        id: 'deploy-import',
        title: 'Import the project into Vercel',
        content: (
          <ol>
            <li>
              Open <ExternalLink href="https://vercel.com/new">vercel.com/new</ExternalLink> and import the GitHub
              repository. Vercel detects Next.js by itself; keep the default build settings.
            </li>
            <li>Before clicking Deploy, open Environment Variables and add everything from section B.</li>
            <li>
              Click <strong>Deploy</strong>. From now on every push to <Code>main</Code> goes live, and other branches
              get their own preview address.
            </li>
          </ol>
        ),
      },
      {
        id: 'deploy-domain',
        title: 'Connect your domain',
        content: (
          <p>
            Open <ClickPath items={['Project', 'Settings', 'Domains']} /> and add <Code>yourdomain.com</Code> and{' '}
            <Code>www.yourdomain.com</Code>. At your domain registrar, add the DNS records Vercel shows you (usually an
            A record for the bare domain and a CNAME for www). HTTPS certificates are issued automatically once DNS
            has updated, which can take up to a few hours.
          </p>
        ),
      },
      {
        id: 'deploy-site-url',
        title: 'Set NEXT_PUBLIC_SITE_URL to your domain and redeploy',
        verified: liveSiteUrlSet,
        content: (
          <p>
            Change <Code>NEXT_PUBLIC_SITE_URL</Code> in Vercel to <Code>https://yourdomain.com</Code> (no slash at the
            end) and redeploy. Public variables are built into the site, so the change only shows after a new
            deployment. Emails, the sitemap and payment redirects all use this address.
          </p>
        ),
      },
      {
        id: 'deploy-update-services',
        title: 'Point Supabase (and later Stripe) at the live domain',
        content: (
          <ul>
            <li>
              Supabase: update the Site URL and redirect URLs in{' '}
              <ClickPath items={['Authentication', 'URL Configuration']} /> (section C).
            </li>
            <li>Stripe, once you use it: the webhook endpoint must use the live domain too (section F).</li>
          </ul>
        ),
      },
    ],
  }
}
