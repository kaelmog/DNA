import { Sparkles } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { FilterTabs, listHref, readPage, readParam, type SearchParams } from '@/components/admin/orders/list-controls'
import { RequestCard } from '@/components/admin/requests/request-card'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/misc'
import { Pagination } from '@/components/ui/pagination'
import { requireAdmin } from '@/lib/auth'
import { CUSTOM_REQUEST_STATUS } from '@/lib/constants'
import { getCustomRequests, getRequestCounts, parseRequestFilter, type RequestFilter } from '@/lib/data/admin/requests'
import { getStoreSettings } from '@/lib/data/settings'
import type { CustomRequestStatus } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Custom requests',
}

const BASE_PATH = '/admin/requests'

const TABS: { value: RequestFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...(Object.entries(CUSTOM_REQUEST_STATUS) as [CustomRequestStatus, { label: string }][]).map(([value, meta]) => ({
    value,
    label: meta.label,
  })),
]

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin()

  const params = await searchParams
  const filter = parseRequestFilter(readParam(params.status))
  const page = readPage(params.page)
  // "all" is the default, so it does not need to be in the URL.
  const statusParam = filter === 'all' ? undefined : filter

  const [requests, counts, settings] = await Promise.all([
    getCustomRequests({ status: filter, page }),
    getRequestCounts(),
    getStoreSettings(),
  ])

  return (
    <>
      <AdminPageHeader
        title="Custom requests"
        description="Made-to-order enquiries from the Custom work page. Reply by email, then track the status and your quote here."
      />

      <FilterTabs
        label="Filter requests by status"
        active={filter}
        tabs={TABS.map((tab) => ({
          value: tab.value,
          label: tab.label,
          count: counts[tab.value],
          highlight: tab.value === 'new',
          href: listHref(BASE_PATH, { status: tab.value === 'all' ? undefined : tab.value }),
        }))}
      />

      {requests.items.length > 0 ? (
        <>
          <h2 className="sr-only">
            {filter === 'all' ? 'All requests' : `${CUSTOM_REQUEST_STATUS[filter].label} requests`}
          </h2>
          <ul className="grid gap-5">
            {requests.items.map((request) => (
              <li key={request.id}>
                <RequestCard request={request} currency={settings.currency} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState
          icon={<Sparkles />}
          title={filter === 'all' ? 'No custom requests yet' : `No ${CUSTOM_REQUEST_STATUS[filter].label.toLowerCase()} requests`}
          description={
            filter === 'all'
              ? 'Requests sent from the Custom work page appear here.'
              : 'Requests move between tabs when you change their status.'
          }
          action={
            filter === 'all' ? undefined : (
              <Link href={BASE_PATH} className={buttonVariants({ variant: 'outline' })}>
                Show all requests
              </Link>
            )
          }
        />
      )}

      <Pagination
        page={page}
        pageCount={requests.pageCount}
        basePath={BASE_PATH}
        searchParams={{ status: statusParam }}
        className="mt-6"
      />
    </>
  )
}
