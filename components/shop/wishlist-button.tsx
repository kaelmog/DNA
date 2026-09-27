'use client'

import { Heart } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { startTransition, useOptimistic, useState } from 'react'
import { toast } from 'sonner'

import { toggleWishlist } from '@/lib/actions/wishlist'
import { cn } from '@/lib/utils'

interface WishlistButtonProps {
  productId: string
  productName: string
  initialWishlisted: boolean
  className?: string
}

/**
 * Heart toggle for saving a product. The heart flips immediately (optimistic)
 * and settles on whatever the server confirms. Signed-out visitors are sent
 * to /login and brought back to this page afterwards.
 */
export function WishlistButton({ productId, productName, initialWishlisted, className }: WishlistButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [optimisticWishlisted, setOptimisticWishlisted] = useOptimistic(wishlisted)

  function handleClick() {
    startTransition(async () => {
      // Flip what is on screen, so rapid double clicks match the two server toggles.
      setOptimisticWishlisted(!optimisticWishlisted)
      const result = await toggleWishlist(productId)

      if (result.requiresLogin) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }
      if (!result.ok) {
        toast.error(result.message ?? 'We could not update your wishlist.')
        return
      }
      // State set after an await must be wrapped again to stay part of the transition.
      startTransition(() => setWishlisted(result.wishlisted))
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={optimisticWishlisted}
      aria-label={optimisticWishlisted ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      className={cn(
        'inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-cream/90 text-espresso shadow-sm backdrop-blur-sm transition-colors hover:bg-cream',
        className,
      )}
    >
      <Heart
        className={cn('size-4 transition-colors', optimisticWishlisted && 'fill-clay-light text-clay-light')}
        aria-hidden="true"
      />
    </button>
  )
}
