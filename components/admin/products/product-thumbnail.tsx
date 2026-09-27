import { ImageOff } from 'lucide-react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

/** 48px square product photo for admin lists, with a placeholder when the product has no image. */
export function ProductThumbnail({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  return (
    <div className={cn('relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted', className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes="48px" className="object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <ImageOff className="size-4" aria-hidden="true" />
          <span className="sr-only">No image</span>
        </div>
      )}
    </div>
  )
}
