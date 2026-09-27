import { notFound } from 'next/navigation'

import { getProductBySlug } from '@/lib/data/catalog'

/**
 * Checks that the product exists before the page's loading.tsx starts
 * streaming. Once streaming starts the status is locked at 200, so a missing
 * product would only be a "soft 404". This layout renders outside that loading
 * boundary, so it can still answer with a real 404. getProductBySlug is cached
 * per request, so the page reuses this lookup.
 */
export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!(await getProductBySlug(slug))) notFound()
  return children
}
