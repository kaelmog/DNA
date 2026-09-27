import { ImageOff } from 'lucide-react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

/** Small portrait product image for cart and order lines, with a calm placeholder when missing. */
export function LineThumbnail({
  src,
  alt,
  sizes,
  className,
}: {
  src: string | null
  alt: string
  /** Rendered width, e.g. "96px". */
  sizes: string
  className?: string
}) {
  return (
    <div className={cn('relative aspect-[4/5] shrink-0 overflow-hidden rounded-xl bg-linen', className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-taupe">
          <ImageOff className="size-5" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}
