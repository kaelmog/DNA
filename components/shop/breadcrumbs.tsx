import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { JsonLd } from '@/components/seo/json-ld'
import { absoluteUrl } from '@/lib/seo'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href: string
}

/**
 * Breadcrumb trail plus matching BreadcrumbList structured data. The last item
 * is the current page: it renders as plain text with aria-current.
 */
export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className={cn('text-xs text-muted-foreground', className)}>
        <ol className="flex flex-wrap items-center gap-x-1.5">
          {items.map((item, index) => {
            const isCurrent = index === items.length - 1
            return (
              <li key={item.href} className="flex min-w-0 items-center gap-1.5">
                {isCurrent ? (
                  <span aria-current="page" className="max-w-[14rem] truncate text-foreground sm:max-w-md">
                    {item.label}
                  </span>
                ) : (
                  <>
                    <Link href={item.href} className="inline-flex min-h-10 items-center transition-colors hover:text-clay">
                      {item.label}
                    </Link>
                    <ChevronRight className="size-3 shrink-0" aria-hidden="true" />
                  </>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.label,
            item: absoluteUrl(item.href),
          })),
        }}
      />
    </>
  )
}
