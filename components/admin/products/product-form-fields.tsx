'use client'

import { useState } from 'react'

import { ImageManager } from '@/components/admin/products/image-manager'
import { ProductSeoCard } from '@/components/admin/products/product-seo-card'
import {
  ProductCategoryCard,
  ProductOrganisationCard,
  ProductStatusCard,
} from '@/components/admin/products/product-sidebar-cards'
import { useSlugField } from '@/components/admin/products/use-slug-field'
import { VariantsEditor } from '@/components/admin/products/variants-editor'
import { describedBy } from '@/components/forms/use-form-action'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input, Textarea } from '@/components/ui/input'
import type { ActionState } from '@/lib/actions'
import type { Category, ProductDetail } from '@/lib/types'

type FieldErrors = NonNullable<ActionState['fieldErrors']>

const DETAILS_PLACEHOLDER =
  'Materials: 100% cotton cord, driftwood\nSize: approx. 24 × 36 in (61 × 91 cm)\nCare: dust gently or use a hairdryer on cool'

interface ProductFormFieldsProps {
  product?: ProductDetail
  categories: Category[]
  currency: string
  errors: FieldErrors
  onUploadingChange: (uploading: boolean) => void
}

/**
 * Every input of the product editor, laid out in two columns on large screens
 * (content left, settings right) and one column on phones. Input names match
 * what createProduct / updateProduct parse; photos and variants travel as JSON
 * in hidden inputs rendered by ImageManager and VariantsEditor.
 */
export function ProductFormFields({ product, categories, currency, errors, onUploadingChange }: ProductFormFieldsProps) {
  const slugField = useSlugField({ name: product?.name ?? '', slug: product?.slug ?? '' })
  // Controlled because the search preview falls back to it.
  const [description, setDescription] = useState(product?.description ?? '')

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="grid min-w-0 content-start gap-6 lg:col-span-2">
        <Card>
          <CardTitle className="mb-5">Details</CardTitle>
          <div className="grid gap-5">
            <Field id="product-name" label="Name" required errors={errors.name}>
              <Input
                {...describedBy('product-name', errors.name)}
                name="name"
                value={slugField.name}
                onChange={(event) => slugField.changeName(event.target.value)}
                required
                maxLength={160}
                placeholder="e.g. Sol Wall Hanging"
                autoComplete="off"
              />
            </Field>

            <Field
              id="product-slug"
              label="URL slug"
              required
              errors={errors.slug}
              hint={
                <SlugHint slug={slugField.slug} followsName={slugField.followsName} isLive={product?.status === 'active'} />
              }
            >
              <Input
                {...describedBy('product-slug', errors.slug, true)}
                name="slug"
                value={slugField.slug}
                onChange={(event) => slugField.changeSlug(event.target.value)}
                onBlur={slugField.normalizeSlug}
                required
                maxLength={80}
                autoCapitalize="none"
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
              />
            </Field>

            <Field
              id="product-description"
              label="Description"
              hint="Shown on the product page. Line breaks are kept."
              errors={errors.description}
            >
              <Textarea
                {...describedBy('product-description', errors.description, true)}
                name="description"
                rows={6}
                maxLength={10_000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What makes this piece special? The feel, the colours, where it looks best."
              />
            </Field>

            <Field
              id="product-details"
              label="Details and care"
              hint="One line per material, size or care note. Shown under “Details & care” on the product page."
              errors={errors.details}
            >
              <Textarea
                {...describedBy('product-details', errors.details, true)}
                name="details"
                rows={4}
                maxLength={5000}
                defaultValue={product?.details ?? ''}
                placeholder={DETAILS_PLACEHOLDER}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Photos</CardTitle>
              <CardDescription>The first photo is the main image in the shop. Use the arrows to reorder.</CardDescription>
            </div>
          </CardHeader>
          <ImageManager
            initialImages={product?.images ?? []}
            productName={slugField.name}
            errors={errors.images}
            onUploadingChange={onUploadingChange}
          />
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Pricing and stock</CardTitle>
              <CardDescription>Each variant has its own price, SKU and stock level.</CardDescription>
            </div>
          </CardHeader>
          <VariantsEditor initialVariants={product?.variants ?? []} currency={currency} errors={errors.variants} />
        </Card>
      </div>

      <div className="grid min-w-0 content-start gap-6">
        <ProductStatusCard
          initialStatus={product?.status ?? 'draft'}
          initialFeatured={product?.is_featured ?? false}
          errors={errors}
        />
        <ProductCategoryCard
          categories={categories}
          initialCategoryId={product?.category_id ?? null}
          errors={errors.category_id}
        />
        <ProductOrganisationCard initialBadge={product?.badge ?? ''} initialTags={product?.tags ?? []} errors={errors} />
        <ProductSeoCard
          name={slugField.name}
          slug={slugField.slug}
          description={description}
          initialTitle={product?.seo_title ?? ''}
          initialDescription={product?.seo_description ?? ''}
          errors={errors}
        />
      </div>
    </div>
  )
}

/** "/products/sol-wall-hanging · Filled in from the name." */
function SlugHint({ slug, followsName, isLive }: { slug: string; followsName: boolean; isLive: boolean }) {
  const note = followsName
    ? 'Filled in from the name.'
    : isLive
      ? 'Changing it breaks links people have saved.'
      : 'Lowercase letters, numbers and hyphens.'
  return (
    <>
      <span className="font-mono break-all">/products/{slug || '…'}</span> · {note}
    </>
  )
}
