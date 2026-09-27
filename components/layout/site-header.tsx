import { User } from 'lucide-react'
import Link from 'next/link'

import { CartButton } from '@/components/layout/cart-button'
import { HeaderSearch } from '@/components/layout/header-search'
import { Logo } from '@/components/layout/logo'
import { MobileNav } from '@/components/layout/mobile-nav'
import { buttonVariants } from '@/components/ui/button'
import { Container } from '@/components/ui/misc'
import { getCurrentProfile } from '@/lib/auth'
import { MAIN_NAV } from '@/lib/constants'
import { getStoreSettings } from '@/lib/data/settings'

export async function SiteHeader() {
  const [settings, profile] = await Promise.all([getStoreSettings(), getCurrentProfile()])
  const isAdmin = profile?.role === 'admin'

  return (
    <>
      {settings.announcement_text && (
        <div className="border-b border-border bg-sand px-4 py-2 text-center text-[10px] font-semibold tracking-[0.2em] text-clay-dark uppercase sm:text-[11px]">
          {settings.announcement_text}
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <Container className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-2 lg:h-20">
          <div className="flex items-center">
            <MobileNav isSignedIn={Boolean(profile)} isAdmin={isAdmin} />
            <nav aria-label="Main" className="hidden items-center gap-7 text-sm lg:flex">
              {MAIN_NAV.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-clay">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <Logo />

          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            {isAdmin && (
              <Link
                href="/admin"
                className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'hidden sm:inline-flex' })}
              >
                Admin
              </Link>
            )}
            <HeaderSearch />
            <Link
              href={profile ? '/account' : '/login'}
              aria-label={profile ? 'Your account' : 'Sign in'}
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'rounded-full' })}
            >
              <User className="size-5" />
            </Link>
            <CartButton />
          </div>
        </Container>
      </header>
    </>
  )
}
