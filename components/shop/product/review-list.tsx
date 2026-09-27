import { BadgeCheck } from 'lucide-react'

import { StarRating } from '@/components/shop/star-rating'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import type { Review } from '@/lib/types'

/** Approved reviews, newest first. */
export function ReviewList({ reviews }: { reviews: Review[] }) {
  return (
    <ul className="divide-y divide-border">
      {reviews.map((review) => (
        <li key={review.id} className="py-6 first:pt-0 last:pb-0">
          <article>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <StarRating rating={review.rating} size="sm" />
              {review.is_verified_purchase && (
                <Badge tone="success">
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                  Verified purchase
                </Badge>
              )}
            </div>
            {review.title && <h3 className="mt-3 font-semibold wrap-anywhere">{review.title}</h3>}
            <p className="mt-2 text-sm leading-6 whitespace-pre-line wrap-anywhere text-muted-foreground">{review.body}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="font-medium wrap-anywhere text-foreground">{review.author_name}</span>
              {' · '}
              <time dateTime={review.created_at}>{formatDate(review.created_at)}</time>
            </p>
          </article>
        </li>
      ))}
    </ul>
  )
}
