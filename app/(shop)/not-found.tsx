import type { Metadata } from 'next'

import { NotFoundContent } from '@/components/content/not-found-content'
import { Container } from '@/components/ui/misc'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
}

/** Shown inside the shop layout when a page calls notFound(), e.g. an unknown product. */
export default function ShopNotFound() {
  return (
    <Container className="py-20 sm:py-28">
      <NotFoundContent />
    </Container>
  )
}
