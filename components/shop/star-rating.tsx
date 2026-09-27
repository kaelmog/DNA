import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'

const STAR_SIZES = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5',
} as const

interface StarRatingProps {
  /** 0 to 5; fractions render as partially filled stars. */
  rating: number
  /** Number of reviews, shown as "(12)". */
  count?: number
  size?: keyof typeof STAR_SIZES
  className?: string
}

function formatRating(rating: number) {
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1)
}

/** Five stars filled to match a rating, with a screen-reader sentence instead of the icons. */
export function StarRating({ rating, count, size = 'md', className }: StarRatingProps) {
  const clamped = Math.min(5, Math.max(0, rating))
  const starSize = STAR_SIZES[size]
  const reviewsText = count === undefined ? '' : `, ${count} ${count === 1 ? 'review' : 'reviews'}`

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="inline-flex gap-0.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => {
          // Portion of this star to fill: 1 = full, 0.5 = half, 0 = empty.
          const fill = Math.min(1, Math.max(0, clamped - index))
          return (
            <span key={index} className={cn('relative inline-block shrink-0', starSize)}>
              <Star className={cn('absolute inset-0 text-oat', starSize)} strokeWidth={1.5} />
              {fill > 0 && (
                <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star className={cn('max-w-none fill-clay-light text-clay-light', starSize)} strokeWidth={1.5} />
                </span>
              )}
            </span>
          )
        })}
      </span>
      <span className="sr-only">
        Rated {formatRating(clamped)} out of 5{reviewsText}
      </span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground" aria-hidden="true">
          ({count})
        </span>
      )}
    </span>
  )
}
