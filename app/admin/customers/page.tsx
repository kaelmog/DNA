import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { CustomersTable } from '@/components/admin/customers/customers-table'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import {
  FilterTabs,
  ListSearch,
  listHref,
  readPage,
  readParam,
  type SearchParams,
} from '@/components/admin/orders/list-controls'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/misc'
import { Pagination } from '@/components/ui/pagination'
import { requireAdmin } from '@/lib/auth'
import { getCustomers, type CustomerSort } from '@/lib/data/admin/customers'
import { getStoreSettings } from '@/lib/data/settings'
import { pluralize } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Customers',
}

const BASE_PATH = '/admin/customers'

const SORT_TABS: { value: CustomerSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'top', label: 'Top spenders' },
]

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin()

  const params = await searchParams
  const sort: CustomerSort = readParam(params.sort) === 'top' ? 'top' : 'newest'
  const query = readParam(params.q)?.trim() || undefined
  const page = readPage(params.page)
  // "newest" is the default, so it does not need to be in the URL.
  const sortParam = sort === 'newest' ? undefined : sort

  const [customers, settings] = await Promise.all([getCustomers({ search: query, sort, page }), getStoreSettings()])

  return (
    <>
      <AdminPageHeader
        title="Customers"
        description={`${pluralize(customers.total, 'account')}${query ? ` matching “${query}”` : ''}. Guests who check out without an account are not listed.`}
      />

      <FilterTabs
        label="Sort customers"
        active={sort}
        tabs={SORT_TABS.map((tab) => ({
          ...tab,
          href: listHref(BASE_PATH, { sort: tab.value === 'newest' ? undefined : tab.value, q: query }),
        }))}
      />

      <ListSearch
        action={BASE_PATH}
        query={query}
        label="Search customers"
        placeholder="Name or email"
        keep={{ sort: sortParam }}
      />

      {customers.items.length > 0 ? (
        <CustomersTable customers={customers.items} currency={settings.currency} />
      ) : (
        <EmptyState
          icon={<Users />}
          title={query ? 'No matching customers' : 'No customers yet'}
          description={
            query ? `Nobody matches “${query}”.` : 'Customers appear here when they create an account.'
          }
          action={
            query ? (
              <Link href={listHref(BASE_PATH, { sort: sortParam })} className={buttonVariants({ variant: 'outline' })}>
                Clear search
              </Link>
            ) : undefined
          }
        />
      )}

      <Pagination page={page} pageCount={customers.pageCount} basePath={BASE_PATH} searchParams={{ sort: sortParam, q: query }} />
    </>
  )
}
