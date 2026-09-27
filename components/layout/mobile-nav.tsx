'use client'

import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { MAIN_NAV } from '@/lib/constants'

/** Hamburger menu for phones and tablets (hidden on large screens). */
export function MobileNav({ isSignedIn, isAdmin }: { isSignedIn: boolean; isAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const links = [
    ...MAIN_NAV,
    { href: isSignedIn ? '/account' : '/login', label: isSignedIn ? 'My account' : 'Sign in' },
    ...(isSignedIn ? [{ href: '/account/orders', label: 'My orders' }] : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="-ml-2 rounded-full"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full z-50 h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-background"
        >
          <nav aria-label="Mobile" className="flex flex-col px-4 py-6 sm:px-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="border-b border-border py-4 font-serif text-2xl tracking-tight transition-colors hover:text-clay"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}
