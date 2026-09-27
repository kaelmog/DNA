import { Search, X } from 'lucide-react'
import Form from 'next/form'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Building blocks shared by every admin operations list page (orders,
 * customers, discounts, reviews, requests, messages, subscribers): status tabs,
 * a search box, and helpers for reading and writing query strings.
 */

export type SearchParams = Record<string, string | string[] | undefined>

/** A query-string value as a single string (repeated keys use the first value). */
export function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

/** ?page= as a whole number of at least 1. */
export function readPage(value: string | string[] | undefined) {
  const page = Number.parseInt(readParam(value) ?? '', 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

/** Builds "/path?a=1&b=2", leaving out empty values. */
export function listHref(basePath: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })
  const search = query.toString()
  return search ? `${basePath}?${search}` : basePath
}

export interface FilterTab {
  value: string
  label: string
  href: string
  /** Shown as a small number next to the label when provided. */
  count?: number
  /** Draws attention to a non-zero count (something waits for the admin). */
  highlight?: boolean
}

/** Pill-shaped filter links. They wrap onto a new line on small screens instead of scrolling. */
export function FilterTabs({ tabs, active, label }: { tabs: FilterTab[]; active: string; label: string }) {
  return (
    <nav aria-label={label} className="mb-5">
      <ul className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab.value === active
          return (
            <li key={tab.value}>
              <Link
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground hover:bg-accent',
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs tabular-nums',
                      isActive
                        ? 'bg-primary-foreground/15'
                        : tab.highlight && tab.count > 0
                          ? 'bg-warning/15 font-semibold text-warning'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * GET search form that keeps the other filters (passed as `keep`) and resets
 * to page 1. It navigates client-side thanks to next/form.
 */
export function ListSearch({
  action,
  query,
  label,
  placeholder,
  keep = {},
}: {
  /** The list page path, e.g. "/admin/orders". */
  action: string
  /** The current search text. */
  query?: string
  /** Accessible label for the input. */
  label: string
  placeholder: string
  /** Other query params to keep when searching, e.g. { status: 'paid' }. */
  keep?: Record<string, string | undefined>
}) {
  return (
    <Form action={action} role="search" className="mb-5 flex gap-2">
      {Object.entries(keep).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
      <div className="relative min-w-0 flex-1">
        <label htmlFor="admin-list-search" className="sr-only">
          {label}
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        {/* key resets the input when the query changes through a link (e.g. "Clear"). */}
        <Input
          key={query ?? ''}
          id="admin-list-search"
          type="search"
          name="q"
          defaultValue={query}
          placeholder={placeholder}
          className="pl-10"
          maxLength={100}
        />
      </div>
      <Button type="submit" variant="outline">
        <Search className="sm:hidden" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">Search</span>
      </Button>
      {query && (
        <Link
          href={listHref(action, keep)}
          aria-label="Clear search"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-input bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </Link>
      )}
    </Form>
  )
}
