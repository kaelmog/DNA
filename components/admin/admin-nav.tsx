'use client'

import {
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Mail,
  Menu,
  MessageSquareQuote,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/discounts', label: 'Discounts', icon: Percent },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/requests', label: 'Custom requests', icon: Sparkles },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquareQuote },
  { href: '/admin/subscribers', label: 'Subscribers', icon: Mail },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
] as const

function isActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`)
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              active ? 'bg-cream/15 font-semibold text-white' : 'text-sand hover:bg-cream/10 hover:text-white',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function FooterLinks({ email }: { email: string }) {
  return (
    <div className="mt-6 grid gap-0.5 border-t border-cream/15 pt-4 text-sm">
      <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sand hover:bg-cream/10 hover:text-white">
        <ExternalLink className="size-4" aria-hidden="true" /> View store
      </Link>
      <Link href="/todo" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sand hover:bg-cream/10 hover:text-white">
        <ListChecks className="size-4" aria-hidden="true" /> Launch checklist
      </Link>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sand hover:bg-cream/10 hover:text-white"
        >
          <LogOut className="size-4" aria-hidden="true" /> Sign out
        </button>
      </form>
      <p className="mt-3 truncate px-3 text-xs text-sand/70" title={email}>
        {email}
      </p>
    </div>
  )
}

/** Sidebar on large screens, top bar with a slide-down menu on phones and tablets. */
export function AdminNav({ email }: { email: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto bg-espresso px-4 py-6 lg:flex">
        <Link href="/admin" className="mb-6 px-3">
          <span className="block text-[10px] tracking-[0.25em] text-sand uppercase">Knotted Studio</span>
          <span className="font-serif text-2xl text-cream">Store admin</span>
        </Link>
        <NavLinks />
        <FooterLinks email={email} />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 bg-espresso lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/admin" className="font-serif text-xl text-cream">
            Store admin
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-cream hover:bg-cream/10"
            aria-label={open ? 'Close admin menu' : 'Open admin menu'}
            aria-expanded={open}
            aria-controls="admin-mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
        {open && (
          <div id="admin-mobile-menu" className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto px-4 pb-6">
            <NavLinks onNavigate={() => setOpen(false)} />
            <FooterLinks email={email} />
          </div>
        )}
      </div>
    </>
  )
}

