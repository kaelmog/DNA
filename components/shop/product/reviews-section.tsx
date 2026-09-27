import { CheckCircle2, MessageSquareText, PenLine } from 'lucide-react'
import Link from 'next/link'

import { ReviewForm } from '@/components/shop/product/review-form'
import { ReviewList } from '@/components/shop/product/review-list'
import { StarRating } from '@/components/shop/star-rating'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/misc'
import type { ActionState } from '@/lib/actions'
import type { ReviewSummary } from '@/lib/data/reviews'
import { pluralize } from '@/lib/format'
import type { Review } from '@/lib/types'

/** Who is looking at the page, as far as reviews are concerned. */
export type ReviewViewer =
  | { kind: 'demo' }
  | { kind: 'signed-out'; loginHref: string }
  | { kind: 'reviewed'; review: Review }
  | { kind: 'can-review'; defaultName: string; action: (state: ActionState, formData: FormData) => Promise<ActionState> }

interface ReviewsSectionProps {
  reviews: Review[]
  summary: ReviewSummary
  viewer: ReviewViewer
}

/** Rating summary, the visitor's way to leave a review, and the approved reviews. */
export function ReviewsSection({ reviews, summary, viewer }: ReviewsSectionProps) {
  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-28 border-t border-border py-14 sm:py-20">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
        <div>
          <p className="eyebrow mb-2">Reviews</p>
          <h2 id="reviews-heading" className="font-serif text-3xl tracking-tight sm:text-4xl">
            What people are saying
          </h2>

          {summary.count > 0 && summary.average !== null && (
            <div className="mt-6 flex items-center gap-4">
              <p className="font-serif text-5xl leading-none" aria-hidden="true">
                {summary.average.toFixed(1)}
              </p>
              <div>
                <StarRating rating={summary.average} size="lg" />
                <p className="mt-1 text-sm text-muted-foreground">Based on {pluralize(summary.count, 'review')}</p>
              </div>
            </div>
          )}

          <div className="mt-8">
            <WriteReview viewer={viewer} />
          </div>
        </div>

        <div>
          {reviews.length > 0 ? (
            <ReviewList reviews={reviews} />
          ) : (
            <EmptyState
              icon={<MessageSquareText />}
              title="No reviews yet"
              description="Own this piece? Be the first to share how it looks in your home."
            />
          )}
        </div>
      </div>
    </section>
  )
}

function WriteReview({ viewer }: { viewer: ReviewViewer }) {
  switch (viewer.kind) {
    case 'demo':
      return (
        <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          Reviews open here once the store database is connected.
        </p>
      )

    case 'signed-out':
      return (
        <Link href={viewer.loginHref} className={buttonVariants({ variant: 'outline' })}>
          <PenLine aria-hidden="true" /> Sign in to write a review
        </Link>
      )

    case 'reviewed':
      return <ReviewStatusNote review={viewer.review} />

    case 'can-review':
      return (
        <details className="group rounded-2xl border border-border bg-card">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-2xl px-5 text-sm font-semibold transition-colors hover:text-clay [&::-webkit-details-marker]:hidden">
            <PenLine className="size-4" aria-hidden="true" />
            Write a review
          </summary>
          <div className="border-t border-border px-5 py-5">
            <ReviewForm action={viewer.action} defaultName={viewer.defaultName} />
          </div>
        </details>
      )
  }
}

/** Shown instead of the form once the visitor has reviewed this product. */
function ReviewStatusNote({ review }: { review: Review }) {
  const message =
    review.status === 'approved'
      ? 'Thank you for your review. It is live on this page.'
      : review.status === 'pending'
        ? 'Thanks — your review is awaiting moderation.'
        : null

  if (!message) {
    return (
      <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
        Your review was not published. Questions?{' '}
        <Link href="/contact" className="font-medium text-clay underline-offset-4 hover:underline">
          Contact us
        </Link>
        .
      </p>
    )
  }

  return (
    <p className="flex items-start gap-2 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  )
}
