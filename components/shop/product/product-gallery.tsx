'use client'

import Image from 'next/image'
import { useState } from 'react'

import type { ProductImage } from '@/lib/types'
import { cn } from '@/lib/utils'

type GalleryImage = Pick<ProductImage, 'id' | 'url' | 'alt_text'>

interface ProductGalleryProps {
  images: GalleryImage[]
  productName: string
}

const PLACEHOLDER: GalleryImage = { id: 'placeholder', url: '/placeholder.svg', alt_text: '' }

/** Large product photo with thumbnail buttons to switch between images. */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const slides = images.length > 0 ? images : [PLACEHOLDER]
  const active = slides[Math.min(activeIndex, slides.length - 1)]

  return (
    <div className="grid gap-3 sm:gap-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-sand">
        <Image
          src={active.url}
          alt={active.alt_text || productName}
          fill
          sizes="(min-width: 1280px) 600px, (min-width: 1024px) 50vw, 100vw"
          // The main photo is the largest thing on the page, so fetch it first.
          loading="eager"
          fetchPriority="high"
          className="object-cover"
        />
      </div>

      {slides.length > 1 && (
        <ul className="grid grid-cols-5 gap-2 sm:gap-3">
          {slides.map((image, index) => {
            const isActive = index === activeIndex
            return (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show image ${index + 1} of ${slides.length}`}
                  aria-pressed={isActive}
                  className={cn(
                    'relative block aspect-square w-full cursor-pointer overflow-hidden rounded-xl bg-sand ring-offset-2 ring-offset-background transition',
                    isActive ? 'ring-2 ring-clay' : 'opacity-75 hover:opacity-100',
                  )}
                >
                  <Image src={image.url} alt="" fill sizes="(min-width: 1024px) 120px, 20vw" className="object-cover" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
