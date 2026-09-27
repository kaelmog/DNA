'use client'

import { CheckCircle2 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import type { ProductStatus } from '@/lib/types'

/**
 * Confirmation shown once after creating a product (the create action
 * redirects here with ?created=1). The query is removed from the address bar
 * so a reload or a later save does not announce it again.
 */
export function ProductCreatedBanner({ status }: { status: ProductStatus }) {
  const pathname = usePathname()

  useEffect(() => {
    window.history.replaceState(null, '', pathname)
  }, [pathname])

  return (
    <p role="status" className="mb-6 flex items-start gap-2.5 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>
        <span className="font-semibold">Product created.</span>{' '}
        {status === 'active'
          ? 'It is live in the shop now.'
          : 'It stays hidden from the shop until you set its status to Active.'}
      </span>
    </p>
  )
}
