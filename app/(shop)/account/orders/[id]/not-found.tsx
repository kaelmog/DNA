import { PackageOpen } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/misc'

/** Shown for unknown order ids and for orders that belong to someone else (the two look the same on purpose). */
export default function OrderNotFound() {
  return (
    <EmptyState
      icon={<PackageOpen />}
      title="We couldn't find that order"
      description="It may have been placed with a different account or email address. Your orders are listed on the order history page."
      action={
        <Link href="/account/orders" className={buttonVariants()}>
          View your orders
        </Link>
      }
    />
  )
}
