import { Percent, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { DiscountsTable } from '@/components/admin/discounts/discounts-table'
import { ListSearch, readPage, readParam, type SearchParams } from '@/components/admin/orders/list-controls'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/misc'
import { Pagination } from '@/components/ui/pagination'
import { requireAdmin } from '@/lib/auth'
import { getDiscountCodes } from '@/lib/data/admin/discounts'
import { getStoreSettings } from '@/lib/data/settings'
import { pluralize } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Discounts',
}

const BASE_PATH = '/admin/discounts'

export default async function AdminDiscountsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin()

  const params = await searchParams
  const query = readParam(params.q)?.trim().slice(0, 100) || undefined
  const page = readPage(params.page)

  const [discounts, settings] = await Promise.all([getDiscountCodes({ page, search: query }), getStoreSettings()])

  const newCodeLink = (
    <Link href="/admin/discounts/new" className={buttonVariants({ variant: 'accent' })}>
      <Plus aria-hidden="true" /> New code
    </Link>
  )

  return (
    <>
      <AdminPageHeader
        title="Discounts"
        description={
          discounts.total > 0
            ? `${pluralize(discounts.total, 'code')}${query ? ` matching “${query}”` : ''}. Customers enter codes in the cart.`
            : 'Codes customers can enter in the cart for a percentage or fixed amount off.'
        }
        actions={newCodeLink}
      />

      <ListSearch action={BASE_PATH} query={query} label="Search discount codes" placeholder="Code or description" />

      {discounts.items.length > 0 ? (
        <DiscountsTable discounts={discounts.items} currency={settings.currency} />
      ) : query ? (
        <EmptyState
          icon={<Percent />}
          title="No matching codes"
          description={`No discount code matches “${query}”.`}
          action={
            <Link href={BASE_PATH} className={buttonVariants({ variant: 'outline' })}>
              Clear search
            </Link>
          }
        />
      ) : (
        <EmptyState
          icon={<Percent />}
          title="No discount codes yet"
          description="Create a code for a newsletter welcome, a seasonal sale or a thank-you to loyal customers."
          action={newCodeLink}
        />
      )}

      <Pagination
        page={page}
        pageCount={discounts.pageCount}
        basePath={BASE_PATH}
        searchParams={{ q: query }}
        className="mt-6"
      />
    </>
  )
}
