'use client'

import { useState } from 'react'

import { CharacterCount } from '@/components/forms/character-count'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input, Textarea } from '@/components/ui/input'
import type { ActionState } from '@/lib/actions'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/constants'
import { siteUrl } from '@/lib/env'
import { truncate } from '@/lib/format'

type FieldErrors = NonNullable<ActionState['fieldErrors']>

/** Limits match the seo_title / seo_description columns. */
const SEO_TITLE_MAX = 70
const SEO_DESCRIPTION_MAX = 160

const SITE_HOST = (() => {
  try {
    return new URL(siteUrl).host
  } catch {
    return 'your-store.com'
  }
})()

/** Links an input to its live counter, plus the hint/error text when there is one. */
const describedByIds = (id: string, hasDescription: boolean) =>
  `${id}-count${hasDescription ? ` ${id}-description` : ''}`

interface ProductSeoCardProps {
  /** Live values from the details card, used as fallbacks in the preview. */
  name: string
  slug: string
  description: string
  initialTitle: string
  initialDescription: string
  errors: FieldErrors
}

/**
 * SEO title and description with live counters and a search-result preview.
 * The fallbacks mirror the product page's generateMetadata: the product name
 * and the first 160 characters of the description.
 */
export function ProductSeoCard({ name, slug, description, initialTitle, initialDescription, errors }: ProductSeoCardProps) {
  const [title, setTitle] = useState(initialTitle)
  const [metaDescription, setMetaDescription] = useState(initialDescription)

  const previewTitle = `${title.trim() || name.trim() || 'Product name'} · ${SITE_NAME}`
  const previewDescription =
    metaDescription.trim() || truncate(description.replace(/\s+/g, ' ').trim(), SEO_DESCRIPTION_MAX) || SITE_DESCRIPTION

  return (
    <Card>
      <CardHeader className="mb-4">
        <div>
          <CardTitle>Search engines</CardTitle>
          <CardDescription>How the product can appear in Google and when a link is shared.</CardDescription>
        </div>
      </CardHeader>

      <div className="grid gap-4">
        <Field id="product-seo-title" label="SEO title" hint="Leave empty to use the product name." errors={errors.seo_title}>
          <Input
            id="product-seo-title"
            name="seo_title"
            value={title}
            maxLength={SEO_TITLE_MAX}
            placeholder={name.trim() || 'Product name'}
            autoComplete="off"
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={Boolean(errors.seo_title?.length) || undefined}
            aria-describedby={describedByIds('product-seo-title', true)}
          />
          <CharacterCount id="product-seo-title-count" count={title.length} max={SEO_TITLE_MAX} />
        </Field>

        <Field
          id="product-seo-description"
          label="SEO description"
          hint="Leave empty to use the start of the description."
          errors={errors.seo_description}
        >
          <Textarea
            id="product-seo-description"
            name="seo_description"
            rows={3}
            value={metaDescription}
            maxLength={SEO_DESCRIPTION_MAX}
            onChange={(event) => setMetaDescription(event.target.value)}
            aria-invalid={Boolean(errors.seo_description?.length) || undefined}
            aria-describedby={describedByIds('product-seo-description', true)}
          />
          <CharacterCount id="product-seo-description-count" count={metaDescription.length} max={SEO_DESCRIPTION_MAX} />
        </Field>

        <figure className="min-w-0 rounded-xl border border-border bg-background p-3.5">
          <figcaption className="mb-2 text-xs font-medium text-muted-foreground">Search result preview</figcaption>
          <p className="truncate text-xs text-muted-foreground">
            {SITE_HOST} › products › {slug || '…'}
          </p>
          <p className="mt-0.5 line-clamp-2 text-base leading-snug wrap-anywhere text-info">{previewTitle}</p>
          <p className="mt-1 line-clamp-3 text-xs leading-5 wrap-anywhere text-muted-foreground">{previewDescription}</p>
        </figure>
      </div>
    </Card>
  )
}
