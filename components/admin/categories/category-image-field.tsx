'use client'

import { ImagePlus, LoaderCircle, Trash } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState } from 'react'

import { CATEGORY_IMAGE_FOLDER } from '@/components/admin/categories/constants'
import { PRODUCT_IMAGE_BUCKET, PRODUCT_IMAGE_TYPES } from '@/components/admin/products/constants'
import { Button, buttonVariants } from '@/components/ui/button'
import { MAX_PRODUCT_IMAGE_BYTES } from '@/lib/constants'
import { isSupabaseConfigured } from '@/lib/env'
import { createClient } from '@/lib/supabase/client'

const ACCEPT = Object.keys(PRODUCT_IMAGE_TYPES).join(',')
const MAX_MEGABYTES = Math.round(MAX_PRODUCT_IMAGE_BYTES / (1024 * 1024))

interface CategoryImageFieldProps {
  id: string
  initialUrl: string | null
  errors?: string[]
  /** Lets the form disable saving while the file uploads. */
  onUploadingChange: (uploading: boolean) => void
}

/**
 * One optional photo for the home page's "Shop by category" tile. It uploads
 * straight from the browser to Supabase Storage (the admin's session passes the
 * bucket policy) and the form saves the resulting public URL.
 */
export function CategoryImageField({ id, initialUrl, errors, onUploadingChange }: CategoryImageFieldProps) {
  const [url, setUrl] = useState(initialUrl)
  const [uploading, setUploading] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  // A file uploaded in this session but not saved yet. Replacing or removing it deletes it straight away;
  // files that are already saved on the category are cleaned up by the server when the form is saved.
  const unsavedPath = useRef<string | null>(null)

  function discardUnsavedUpload() {
    const path = unsavedPath.current
    unsavedPath.current = null
    if (!path) return
    void createClient()
      .storage.from(PRODUCT_IMAGE_BUCKET)
      .remove([path])
      .then(({ error }) => {
        if (error) console.error('[category-image] could not delete unsaved upload', error.message)
      })
  }

  async function upload(file: File) {
    const extension = PRODUCT_IMAGE_TYPES[file.type]
    if (!extension) return setProblem('Use a JPG, PNG, WebP or AVIF image.')
    if (file.size > MAX_PRODUCT_IMAGE_BYTES) return setProblem(`Images must be ${MAX_MEGABYTES} MB or smaller.`)

    setProblem(null)
    setUploading(true)
    onUploadingChange(true)

    const path = `${CATEGORY_IMAGE_FOLDER}/${crypto.randomUUID()}.${extension}`
    const storage = createClient().storage.from(PRODUCT_IMAGE_BUCKET)
    const { error } = await storage.upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false })

    if (error) {
      console.error('[category-image] upload failed', error.message)
      setProblem('The photo could not be uploaded. Please try again.')
    } else {
      discardUnsavedUpload()
      unsavedPath.current = path
      setUrl(storage.getPublicUrl(path).data.publicUrl)
    }
    setUploading(false)
    onUploadingChange(false)
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // lets the same file be picked again after removing it
    if (file) void upload(file)
  }

  function remove() {
    discardUnsavedUpload()
    setUrl(null)
    setProblem(null)
  }

  const inputId = `${id}-file`
  const errorText = problem ?? errors?.[0] ?? null

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-medium">Photo</legend>
      <input type="hidden" name="image_url" value={url ?? ''} />

      <div className="flex items-start gap-4">
        <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
          {url ? (
            <Image src={url} alt="" fill sizes="96px" className="object-cover" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <ImagePlus className="size-6" aria-hidden="true" />
            </span>
          )}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-background/60">
              <LoaderCircle className="size-6 animate-spin text-espresso" aria-hidden="true" />
            </span>
          )}
        </div>

        <div className="grid min-w-0 gap-2">
          <p id={`${id}-description`} className="text-xs text-muted-foreground">
            Optional. Shown on the home page&apos;s category tile. Portrait photos (4:5) work best; JPG, PNG, WebP or
            AVIF up to {MAX_MEGABYTES} MB.
          </p>
          {isSupabaseConfigured ? (
            <div className="flex flex-wrap gap-2">
              <label
                htmlFor={inputId}
                className={buttonVariants({
                  variant: 'outline',
                  size: 'sm',
                  className: 'h-10 cursor-pointer focus-within:ring-3 focus-within:ring-ring/25',
                })}
                aria-disabled={uploading || undefined}
              >
                <ImagePlus aria-hidden="true" />
                {url ? 'Replace photo' : 'Upload photo'}
                <input
                  id={inputId}
                  type="file"
                  accept={ACCEPT}
                  className="sr-only"
                  disabled={uploading}
                  onChange={handleChange}
                  aria-describedby={`${id}-description`}
                />
              </label>
              {url && (
                <Button type="button" variant="ghost" size="sm" className="h-10" onClick={remove} disabled={uploading}>
                  <Trash aria-hidden="true" /> Remove
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Photo uploads work once Supabase is connected.</p>
          )}
        </div>
      </div>

      <p role="status" aria-live="polite" className="text-sm text-muted-foreground empty:hidden">
        {uploading ? 'Uploading photo…' : ''}
      </p>
      {errorText && (
        <p role="alert" className="text-sm text-destructive">
          {errorText}
        </p>
      )}
    </fieldset>
  )
}
