import { Star } from 'lucide-react'
import type { Metadata } from 'next'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { FilterTabs, listHref, readPage, readParam, type SearchParams } from '@/components/admin/orders/list-controls'
import { ReviewCard } from '@/components/admin/reviews/review-card'
import { EmptyState } from '@/components/ui/misc'
import { Pagination } from '@/components/ui/pagination'
import { requireAdmin } from '@/lib/auth'
import { REVIEW_STATUS } from '@/lib/constants'
import { getAdminReviews, getReviewCounts, parseReviewStatus } from '@/lib/data/admin/reviews'
import type { ReviewStatus } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Reviews',
}

const BASE_PATH = '/admin/reviews'

const TABS: { value: ReviewStatus; label: string }[] = [
  { value: 'pending', label: 'To moderate' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const EMPTY_TEXT: Record<ReviewStatus, { title: string; description: string }> = {
  pending: {
    title: 'All caught up',
    description: 'New reviews wait here until you approve them, so nothing shows in the store without your OK.',
  },
  approved: { title: 'No approved reviews yet', description: 'Approved reviews appear on their product pages.' },
  rejected: { title: 'No rejected reviews', description: 'Reviews you reject stay here, hidden from the store.' },
}

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin()

  const params = await searchParams
  const status = parseReviewStatus(readParam(params.status))
  const page = readPage(params.page)
  // "pending" is the default tab, so it does not need to be in the URL.
  const statusParam = status === 'pending' ? undefined : status

  const [reviews, counts] = await Promise.all([getAdminReviews({ status, page }), getReviewCounts()])

  return (
    <>
      <AdminPageHeader
        title="Reviews"
        description="Customer reviews stay hidden until you approve them. Verified purchase means the reviewer bought the product."
      />

      <FilterTabs
        label="Filter reviews by status"
        active={status}
        tabs={TABS.map((tab) => ({
          value: tab.value,
          label: tab.label,
          count: counts[tab.value],
          highlight: tab.value === 'pending',
          href: listHref(BASE_PATH, { status: tab.value === 'pending' ? undefined : tab.value }),
        }))}
      />

      {reviews.items.length > 0 ? (
        <>
          <h2 className="sr-only">{REVIEW_STATUS[status].label} reviews</h2>
          <ul className="grid gap-4">
            {reviews.items.map((review) => (
              <li key={review.id}>
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState icon={<Star />} title={EMPTY_TEXT[status].title} description={EMPTY_TEXT[status].description} />
      )}

      <Pagination
        page={page}
        pageCount={reviews.pageCount}
        basePath={BASE_PATH}
        searchParams={{ status: statusParam }}
        className="mt-6"
      />
    </>
  )
}
