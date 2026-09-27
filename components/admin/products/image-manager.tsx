'use client'

import { ArrowLeft, ArrowRight, ImagePlus, LoaderCircle, Trash } from 'lucide-react'
import Image from 'next/image'
import { useId, useRef, useState } from 'react'

import {
  MAX_PRODUCT_IMAGES,
  PRODUCT_IMAGE_BUCKET,
  PRODUCT_IMAGE_TYPES,
} from '@/components/admin/products/constants'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { MAX_PRODUCT_IMAGE_BYTES } from '@/lib/constants'
import { isSupabaseConfigured } from '@/lib/env'
import { pluralize } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import type { ProductImage } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ManagedImage {
  key: string
  /** Set for images already saved on the product. */
  id?: string
  /** Public URL, or a local preview (blob:) while uploading. */
  url: string
  storagePath: string | null
  altText: string
  uploading: boolean
}

const ACCEPT = Object.keys(PRODUCT_IMAGE_TYPES).join(',')
const MAX_MEGABYTES = Math.round(MAX_PRODUCT_IMAGE_BYTES / (1024 * 1024))

function toManaged(image: ProductImage): ManagedImage {
  return {
    key: image.id,
    id: image.id,
    url: image.url,
    storagePath: image.storage_path,
    altText: image.alt_text,
    uploading: false,
  }
}

/** The JSON the server action reads from the hidden "images" input. Position = list order. */
function serialize(images: ManagedImage[]) {
  return JSON.stringify(
    images
      .filter((image) => !image.uploading)
      .map((image) => ({ id: image.id, url: image.url, storage_path: image.storagePath, alt_text: image.altText })),
  )
}

/** Checks type and size before uploading. Returns a message for each rejected file. */
function checkFiles(files: File[], room: number) {
  const problems: string[] = []
  const accepted = files.filter((file) => {
    if (!PRODUCT_IMAGE_TYPES[file.type]) {
      problems.push(`${file.name}: use a JPG, PNG, WebP or AVIF image.`)
      return false
    }
    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      problems.push(`${file.name}: images must be ${MAX_MEGABYTES} MB or smaller.`)
      return false
    }
    return true
  })
  if (accepted.length > room) {
    problems.push(room > 0 ? `Only ${pluralize(room, 'more photo')} can be added.` : 'This product already has the maximum number of photos.')
  }
  return { accepted: accepted.slice(0, Math.max(room, 0)), problems }
}

interface ImageManagerProps {
  initialImages: ProductImage[]
  /** Pre-fills the alt text of new photos. */
  productName: string
  errors?: string[]
  /** Lets the form disable saving while files are still uploading. */
  onUploadingChange: (uploading: boolean) => void
}

/**
 * Uploads photos straight from the browser to Supabase Storage (the admin's
 * session passes the bucket's policy), then lets the admin reorder them and
 * write alt text. The first photo is the product's primary image.
 */
export function ImageManager({ initialImages, productName, errors, onUploadingChange }: ImageManagerProps) {
  const inputId = useId()
  const [images, setImages] = useState<ManagedImage[]>(() => initialImages.map(toManaged))
  const [problem, setProblem] = useState<string | null>(null)
  // Counts uploads across overlapping batches; only read in event handlers.
  const activeUploads = useRef(0)

  const uploadingCount = images.filter((image) => image.uploading).length
  const room = MAX_PRODUCT_IMAGES - images.length

  function patchImage(key: string, patch: Partial<ManagedImage>) {
    setImages((current) => current.map((image) => (image.key === key ? { ...image, ...patch } : image)))
  }

  async function uploadFiles(files: File[]) {
    const { accepted, problems } = checkFiles(files, room)
    setProblem(problems.length ? problems.join(' ') : null)
    if (!accepted.length) return

    const uploads = accepted.map((file) => ({
      file,
      key: crypto.randomUUID(),
      path: `products/${crypto.randomUUID()}.${PRODUCT_IMAGE_TYPES[file.type]}`,
      preview: URL.createObjectURL(file),
    }))
    setImages((current) => [
      ...current,
      ...uploads.map((upload) => ({
        key: upload.key,
        url: upload.preview,
        storagePath: upload.path,
        altText: productName.slice(0, 200),
        uploading: true,
      })),
    ])
    activeUploads.current += uploads.length
    onUploadingChange(true)

    const storage = createClient().storage.from(PRODUCT_IMAGE_BUCKET)
    const failed: string[] = []
    await Promise.all(
      uploads.map(async (upload) => {
        const { error } = await storage.upload(upload.path, upload.file, {
          contentType: upload.file.type,
          cacheControl: '31536000',
          upsert: false,
        })
        if (error) {
          console.error('[image-manager] upload failed', error.message)
          failed.push(upload.file.name)
          setImages((current) => current.filter((image) => image.key !== upload.key))
        } else {
          patchImage(upload.key, { url: storage.getPublicUrl(upload.path).data.publicUrl, uploading: false })
        }
        URL.revokeObjectURL(upload.preview)
      }),
    )

    activeUploads.current -= uploads.length
    onUploadingChange(activeUploads.current > 0)
    if (failed.length) setProblem(`Could not upload ${failed.join(', ')}. Please try again.`)
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = '' // lets the same file be picked again after removing it
    void uploadFiles(files)
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    if (canUpload) void uploadFiles(Array.from(event.dataTransfer.files))
  }

  function moveImage(index: number, offset: -1 | 1) {
    setImages((current) => {
      const next = [...current]
      const [moved] = next.splice(index, 1)
      next.splice(index + offset, 0, moved)
      return next
    })
  }

  function removeImage(image: ManagedImage) {
    setImages((current) => current.filter((item) => item.key !== image.key))
    // A photo uploaded in this session is not saved on the product yet, so its
    // file can go now. Saved photos are deleted by the server when the form is saved.
    if (!image.id && image.storagePath) {
      void createClient()
        .storage.from(PRODUCT_IMAGE_BUCKET)
        .remove([image.storagePath])
        .then(({ error }) => {
          if (error) console.error('[image-manager] could not delete unsaved upload', error.message)
        })
    }
  }

  const canUpload = isSupabaseConfigured && room > 0

  return (
    <div className="grid gap-4">
      <input type="hidden" name="images" value={serialize(images)} />

      {errors?.length ? (
        <ul role="alert" className="grid gap-1 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.key} className="grid gap-2 rounded-2xl border border-border bg-background/60 p-2">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                <Image
                  src={image.url}
                  alt={image.altText || productName || `Product photo ${index + 1}`}
                  fill
                  sizes="(min-width: 1024px) 180px, (min-width: 640px) 30vw, 45vw"
                  className={cn('object-cover', image.uploading && 'opacity-60')}
                />
                {index === 0 && (
                  <span className="absolute top-2 left-2 rounded-full bg-espresso/85 px-2 py-0.5 text-[11px] font-semibold text-cream">
                    Primary
                  </span>
                )}
                {image.uploading && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <LoaderCircle className="size-6 animate-spin text-espresso" aria-hidden="true" />
                    <span className="sr-only">Uploading</span>
                  </span>
                )}
              </div>

              <Field id={`image-${image.key}-alt`} label={<span className="text-xs">Alt text</span>}>
                <Input
                  id={`image-${image.key}-alt`}
                  value={image.altText}
                  maxLength={200}
                  placeholder="Describe the photo"
                  className="h-10"
                  onChange={(event) => patchImage(image.key, { altText: event.target.value })}
                />
              </Field>

              <div className="flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-10"
                    aria-label={`Move photo ${index + 1} earlier`}
                    disabled={index === 0 || image.uploading}
                    onClick={() => moveImage(index, -1)}
                  >
                    <ArrowLeft />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-10"
                    aria-label={`Move photo ${index + 1} later`}
                    disabled={index === images.length - 1 || image.uploading}
                    onClick={() => moveImage(index, 1)}
                  >
                    <ArrowRight />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-10 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove photo ${index + 1}`}
                  disabled={image.uploading}
                  onClick={() => removeImage(image)}
                >
                  <Trash />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!isSupabaseConfigured ? (
        <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          Photo uploads work once Supabase is connected (see the setup checklist).
        </p>
      ) : canUpload ? (
        <label
          htmlFor={inputId}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-input bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground transition-colors focus-within:ring-3 focus-within:ring-ring/25 hover:bg-muted"
        >
          <ImagePlus className="mb-1 size-7" aria-hidden="true" />
          <span className="font-medium text-foreground">Add photos</span>
          <span>
            Click or drop files. JPG, PNG, WebP or AVIF, up to {MAX_MEGABYTES} MB each ({room} left).
          </span>
          <input
            id={inputId}
            type="file"
            accept={ACCEPT}
            multiple
            className="sr-only"
            onChange={handleInputChange}
          />
        </label>
      ) : (
        <p className="text-sm text-muted-foreground">
          This product has the maximum of {MAX_PRODUCT_IMAGES} photos. Remove one to add another.
        </p>
      )}

      <p role="status" aria-live="polite" className="text-sm text-muted-foreground empty:hidden">
        {uploadingCount > 0 ? `Uploading ${pluralize(uploadingCount, 'photo')}…` : ''}
      </p>
      {problem && (
        <p role="alert" className="text-sm text-destructive">
          {problem}
        </p>
      )}
    </div>
  )
}
