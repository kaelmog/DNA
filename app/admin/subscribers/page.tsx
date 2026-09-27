import { Download, Mail } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import {
  FilterTabs,
  ListSearch,
  listHref,
  readPage,
  readParam,
  type SearchParams,
} from '@/components/admin/orders/list-controls'
import { SubscribersTable } from '@/components/admin/subscribers/subscribers-table'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/misc'
import { Pagination } from '@/components/ui/pagination'
import { requireAdmin } from '@/lib/auth'
import {
  getSubscriberCounts,
  getSubscribers,
  parseSubscriberFilter,
  type SubscriberFilter,
} from '@/lib/data/admin/subscribers'
import { pluralize } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Subscribers',
}

const BASE_PATH = '/admin/subscribers'

const TABS: { value: SubscriberFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'subscribed', label: 'Subscribed' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
]

export default async function AdminSubscribersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin()

  const params = await searchParams
  const status = parseSubscriberFilter(readParam(params.status))
  const query = readParam(params.q)?.trim().slice(0, 100) || undefined
  const page = readPage(params.page)
  // "all" is the default tab, so it does not need to be in the URL.
  const statusParam = status === 'all' ? undefined : status

  const [subscribers, counts] = await Promise.all([
    getSubscribers({ search: query, status, page }),
    getSubscriberCounts(),
  ])

  return (
    <>
      <AdminPageHeader
        title="Subscribers"
        description={`${pluralize(counts.subscribed, 'person', 'people')} on your newsletter list. Export them to send campaigns from your email tool.`}
        actions={
          counts.subscribed > 0 ? (
            // A plain link: the export is a file download from a route handler, not a page.
            <a href={`${BASE_PATH}/export`} download className={buttonVariants({ variant: 'outline' })}>
              <Download aria-hidden="true" /> Export CSV
            </a>
          ) : undefined
        }
      />

      <FilterTabs
        label="Filter subscribers by status"
        active={status}
        tabs={TABS.map((tab) => ({
          value: tab.value,
          label: tab.label,
          count: counts[tab.value],
          href: listHref(BASE_PATH, { status: tab.value === 'all' ? undefined : tab.value, q: query }),
        }))}
      />

      <ListSearch
        action={BASE_PATH}
        query={query}
        label="Search subscribers"
        placeholder="Email address"
        keep={{ status: statusParam }}
      />

      {subscribers.items.length > 0 ? (
        <SubscribersTable subscribers={subscribers.items} />
      ) : query ? (
        <EmptyState
          icon={<Mail />}
          title="No matching subscribers"
          description={`No address in this tab contains “${query}”.`}
          action={
            <Link href={listHref(BASE_PATH, { status: statusParam })} className={buttonVariants({ variant: 'outline' })}>
              Clear search
            </Link>
          }
        />
      ) : (
        <EmptyState
          icon={<Mail />}
          title="No subscribers here yet"
          description="People who sign up with the newsletter form in the footer appear here."
        />
      )}

      <Pagination
        page={page}
        pageCount={subscribers.pageCount}
        basePath={BASE_PATH}
        searchParams={{ status: statusParam, q: query }}
        className="mt-6"
      />
    </>
  )
}
