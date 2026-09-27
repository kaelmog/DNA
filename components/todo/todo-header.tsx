import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { Logo } from '@/components/layout/logo'
import { buttonVariants } from '@/components/ui/button'
import { Container } from '@/components/ui/misc'

/** The checklist lives outside the shop layout, so it has its own small header. */
export function TodoHeader() {
  return (
    <header className="border-b border-border/70 bg-background">
      <Container className="flex h-16 max-w-5xl items-center justify-between gap-2 lg:h-20">
        <Logo />
        <nav aria-label="Site" className="flex items-center gap-1">
          <Link href="/" className={buttonVariants({ variant: 'ghost', className: 'px-3' })}>
            <ArrowLeft aria-hidden="true" />
            {/* Shorter label on phones so the header fits at 375px. */}
            <span className="sm:hidden">Store</span>
            <span className="hidden sm:inline">Back to store</span>
          </Link>
          <Link href="/admin" className={buttonVariants({ variant: 'outline', className: 'px-3.5' })}>
            Admin
          </Link>
        </nav>
      </Container>
    </header>
  )
}
