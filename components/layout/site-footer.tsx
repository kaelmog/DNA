import Link from 'next/link'

import { NewsletterForm } from '@/components/forms/newsletter-form'
import { Logo } from '@/components/layout/logo'
import { Container } from '@/components/ui/misc'
import { FOOTER_NAV } from '@/lib/constants'
import { getStoreSettings } from '@/lib/data/settings'

export async function SiteFooter() {
  const settings = await getStoreSettings()
  const socials = [
    { label: 'Instagram', href: settings.instagram_url },
    { label: 'Pinterest', href: settings.pinterest_url },
    { label: 'Facebook', href: settings.facebook_url },
    { label: 'TikTok', href: settings.tiktok_url },
  ].filter((social): social is { label: string; href: string } => Boolean(social.href))

  return (
    <footer className="mt-auto border-t border-border bg-linen/60">
      <Container className="grid gap-10 py-12 lg:grid-cols-[1.2fr_2fr] lg:py-16">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {settings.tagline ?? 'Soft things for everyday living.'}
          </p>
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold">Join the studio letter</p>
            <p className="mb-3 text-sm text-muted-foreground">New pieces, restocks and behind-the-scenes. No spam.</p>
            <NewsletterForm source="footer" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {FOOTER_NAV.map((group) => (
            <div key={group.title}>
              <p className="mb-3 text-sm font-semibold">{group.title}</p>
              <ul className="grid gap-2.5 text-sm text-muted-foreground">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-clay">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <Container className="flex flex-col gap-3 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {settings.store_name}. Hand-knotted in small batches.
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {settings.support_email && (
            <a href={`mailto:${settings.support_email}`} className="hover:text-clay">
              {settings.support_email}
            </a>
          )}
          {socials.map((social) => (
            <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="hover:text-clay">
              {social.label}
            </a>
          ))}
        </div>
      </Container>
    </footer>
  )
}
