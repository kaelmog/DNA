import { Package } from 'lucide-react'
import Image from 'next/image'

import { supabaseUrl } from '@/lib/env'
import { cn } from '@/lib/utils'

const supabaseHostname = (() => {
  try {
    return supabaseUrl ? new URL(supabaseUrl).hostname : ''
  } catch {
    return ''
  }
})()

/**
 * Order items keep a snapshot of the product image URL: either a /public path
 * or a Supabase Storage URL. Those are the sources next.config.ts allows for
 * next/image; anything else would throw, so it falls back to a placeholder.
 */
function isAllowedImageSource(src: string) {
  if (src.startsWith('/') && !src.startsWith('//')) return true
  try {
    const { protocol, hostname } = new URL(src)
    return protocol === 'https:' && (hostname.endsWith('.supabase.co') || hostname === supabaseHostname)
  } catch {
    return false
  }
}

/** Square product thumbnail for order lists and order details. */
export function OrderItemImage({
  src,
  alt,
  className,
  sizes = '64px',
}: {
  src: string | null
  alt: string
  className?: string
  /** next/image `sizes`; match the rendered width. */
  sizes?: string
}) {
  return (
    <div className={cn('relative size-16 shrink-0 overflow-hidden rounded-xl bg-sand', className)}>
      {src && isAllowedImageSource(src) ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-clay-dark/60">
          <Package className="size-5" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}
