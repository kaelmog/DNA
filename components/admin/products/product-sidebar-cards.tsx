'use client'

import Link from 'next/link'
import { useState } from 'react'

import { MAX_PRODUCT_TAGS } from '@/components/admin/products/constants'
import { describedBy } from '@/components/forms/use-form-action'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Checkbox, Input, Select } from '@/components/ui/input'
import type { ActionState } from '@/lib/actions'
import type { Category, ProductStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Right-hand column of the product editor: status, category and organisation. */

type FieldErrors = NonNullable<ActionState['fieldErrors']>

const STATUS_OPTIONS: { value: ProductStatus; label: string; help: string }[] = [
  { value: 'draft', label: 'Draft', help: 'Hidden from the shop while you work on it.' },
  { value: 'active', label: 'Active', help: 'Live in the shop and available to buy.' },
  { value: 'archived', label: 'Archived', help: 'Hidden from the shop, but kept for your order history.' },
]

export function ProductStatusCard({
  initialStatus,
  initialFeatured,
  errors,
}: {
  initialStatus: ProductStatus
  initialFeatured: boolean
  errors: FieldErrors
}) {
  // Controlled so the explanation under the select follows the choice.
  const [status, setStatus] = useState<ProductStatus>(initialStatus)
  const help = STATUS_OPTIONS.find((option) => option.value === status)?.help

  return (
    <Card>
      <CardTitle className="mb-4">Status</CardTitle>
      <div className="grid gap-4">
        <Field id="product-status" label="Visibility" hint={help} errors={errors.status}>
          <Select
            {...describedBy('product-status', errors.status, true)}
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as ProductStatus)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <label className="flex min-h-10 cursor-pointer items-start gap-3 text-sm">
          <Checkbox
            name="is_featured"
            defaultChecked={initialFeatured}
            className="mt-0.5"
            aria-describedby="product-featured-help"
          />
          <span>
            <span className="font-medium">Featured</span>
            <span id="product-featured-help" className="block text-xs text-muted-foreground">
              Shown in the featured section of the home page while the product is active.
            </span>
          </span>
        </label>
      </div>
    </Card>
  )
}

export function ProductCategoryCard({
  categories,
  initialCategoryId,
  errors,
}: {
  /** Every category, hidden ones included. */
  categories: Category[]
  initialCategoryId: string | null
  errors?: string[]
}) {
  const hasErrors = Boolean(errors?.length)
  const hint =
    categories.length === 0
      ? 'You have no categories yet. Add them from the categories page.'
      : 'Shoppers can browse the shop by category. Hidden categories are marked.'

  return (
    <Card>
      <CardHeader className="mb-3 items-center">
        {/* The card title doubles as the select's label. */}
        <CardTitle>
          <label htmlFor="product-category" className="cursor-pointer">
            Category
          </label>
        </CardTitle>
        <Link
          href="/admin/categories"
          className="inline-flex min-h-10 items-center text-sm font-medium text-clay hover:underline"
        >
          Manage<span className="sr-only"> categories</span>
        </Link>
      </CardHeader>
      <Select
        id="product-category"
        name="category_id"
        defaultValue={initialCategoryId ?? ''}
        aria-invalid={hasErrors || undefined}
        aria-describedby="product-category-description"
      >
        <option value="">No category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
            {category.is_active ? '' : ' (hidden)'}
          </option>
        ))}
      </Select>
      <p
        id="product-category-description"
        className={cn('mt-1.5 text-xs', hasErrors ? 'text-destructive' : 'text-muted-foreground')}
      >
        {hasErrors ? errors!.join(' ') : hint}
      </p>
    </Card>
  )
}

export function ProductOrganisationCard({
  initialBadge,
  initialTags,
  errors,
}: {
  initialBadge: string
  initialTags: string[]
  errors: FieldErrors
}) {
  return (
    <Card>
      <CardTitle className="mb-4">Organisation</CardTitle>
      <div className="grid gap-4">
        <Field
          id="product-badge"
          label="Badge"
          hint="A short label on the product, like New or Bestseller."
          errors={errors.badge}
        >
          <Input
            {...describedBy('product-badge', errors.badge, true)}
            name="badge"
            maxLength={30}
            defaultValue={initialBadge}
            placeholder="e.g. New"
            autoComplete="off"
          />
        </Field>

        <Field
          id="product-tags"
          label="Tags"
          hint={`Comma separated, up to ${MAX_PRODUCT_TAGS}. For your own organisation; not shown in the shop.`}
          errors={errors.tags}
        >
          <Input
            {...describedBy('product-tags', errors.tags, true)}
            name="tags"
            defaultValue={initialTags.join(', ')}
            placeholder="boho, cotton, gift"
            autoCapitalize="none"
            autoComplete="off"
          />
        </Field>
      </div>
    </Card>
  )
}
