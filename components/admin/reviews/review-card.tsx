import { BadgeCheck, ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { deleteReview, setReviewStatus } from '@/app/admin/reviews/actions'
import { ActionButton } from '@/components/admin/confirm-button'
import { StarRating } from '@/components/shop/star-rating'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { REVIEW_STATUS } from '@/lib/constants'
import type { AdminReview } from '@/lib/data/admin/reviews'
import { formatDate } from '@/lib/format'

/** Approve / reject / delete buttons. Only the moves that make sense for the current status are shown. */
function ReviewActions({ review }: { review: AdminReview }) {
  const label = review.title ? `“${review.title}”` : `the review by ${review.author_name}`
  return (
    <div className="flex flex-wrap gap-2">
      {review.status !== 'approved' && (
        <ActionButton
          action={setReviewStatus}
          fields={{ id: review.id, status: 'approved' }}
          variant="accent"
          size="sm"
          className="h-10"
          pendingText="Approving…"
          aria-label={`Approve ${label}`}
        >
          Approve
        </ActionButton>
      )}
      {review.status !== 'rejected' && (
        <ActionButton
          action={setReviewStatus}
          fields={{ id: review.id, status: 'rejected' }}
          variant="outline"
          size="sm"
          className="h-10"
          pendingText="Rejecting…"
          aria-label={review.status === 'approved' ? `Hide ${label} from the store` : `Reject ${label}`}
        >
          {review.status === 'approved' ? 'Hide (reject)' : 'Reject'}
        </ActionButton>
      )}
      <ActionButton
        action={deleteReview}
        fields={{ id: review.id }}
        confirm={`Delete ${label}? This cannot be undone.`}
        variant="destructive"
        size="sm"
        className="h-10"
        pendingText="Deleting…"
        aria-label={`Delete ${label}`}
      >
        Delete
      </ActionButton>
    </div>
  )
}

/** Links to the product in the admin and in the store (the join is empty only if the product cannot be read). */
function ReviewProduct({ product }: { product: AdminReview['product'] }) {
  if (!product) return <p className="text-sm text-muted-foreground">Product unavailable</p>
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <Link href={`/admin/products/${product.id}`} className="font-semibold text-clay hover:underline">
        {product.name}
      </Link>
      <Link
        href={`/products/${product.slug}`}
        target="_blank"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        View in store <ExternalLink className="size-3" aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </Link>
    </p>
  )
}

/** One review in the moderation queue. */
export function ReviewCard({ review }: { review: AdminReview }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1.5">
          <ReviewProduct product={review.product} />
          <StarRating rating={review.rating} size="sm" />
        </div>
        <StatusBadge meta={REVIEW_STATUS[review.status]} />
      </div>

      {review.title && <h3 className="mt-3 font-semibold break-words">{review.title}</h3>}
      <p className="mt-2 text-sm leading-6 break-words whitespace-pre-wrap">{review.body}</p>

      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>
          By{' '}
          <Link href={`/admin/customers/${review.user_id}`} className="font-medium text-foreground hover:underline">
            {review.author_name}
          </Link>
        </span>
        {review.is_verified_purchase && (
          <Badge tone="success">
            <BadgeCheck className="size-3" aria-hidden="true" /> Verified purchase
          </Badge>
        )}
        <span aria-hidden="true">·</span>
        <time dateTime={review.created_at}>{formatDate(review.created_at)}</time>
      </p>

      <div className="mt-4 border-t border-border pt-4">
        <ReviewActions review={review} />
      </div>
    </article>
  )
}
