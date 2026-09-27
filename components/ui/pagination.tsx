import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  pageCount: number
  /** Path without query string, e.g. "/shop". */
  basePath: string
  /** Current query params to keep (filters, search, sort). `page` is replaced. */
  searchParams?: Record<string, string | undefined>
  className?: string
}

/** Previous / next links with "Page X of Y". Renders nothing for a single page. */
export function Pagination({ page, pageCount, basePath, searchParams = {}, className }: PaginationProps) {
  if (pageCount <= 1) return null

  const hrefFor = (target: number) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') params.set(key, value)
    })
    if (target > 1) params.set('page', String(target))
    const query = params.toString()
    return query ? `${basePath}?${query}` : basePath
  }

  const linkClass = buttonVariants({ variant: 'outline', size: 'sm' })

  return (
    <nav aria-label="Pagination" className={cn('mt-10 flex items-center justify-between gap-4', className)}>
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkClass} rel="prev">
          <ChevronLeft /> Previous
        </Link>
      ) : (
        <span className={cn(linkClass, 'invisible')} aria-hidden="true">
          <ChevronLeft /> Previous
        </span>
      )}
      <p className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </p>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={linkClass} rel="next">
          Next <ChevronRight />
        </Link>
      ) : (
        <span className={cn(linkClass, 'invisible')} aria-hidden="true">
          Next <ChevronRight />
        </span>
      )}
    </nav>
  )
}
