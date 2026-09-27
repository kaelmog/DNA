import type { Metadata } from 'next'

import { NotFoundContent } from '@/components/content/not-found-content'
import { Logo } from '@/components/layout/logo'
import { Container } from '@/components/ui/misc'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
}

/**
 * 404 for URLs that match no route. It renders outside the shop layout,
 * so it brings its own minimal header.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border/70">
        <Container className="flex h-16 items-center justify-center lg:h-20">
          <Logo />
        </Container>
      </header>
      <main id="main-content" className="flex flex-1 items-center">
        <Container className="py-16 sm:py-24">
          <NotFoundContent />
        </Container>
      </main>
    </div>
  )
}
