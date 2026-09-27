'use client'

import { startTransition, useState } from 'react'
import { toast } from 'sonner'

import { createCategory, updateCategory } from '@/app/admin/categories/actions'
import {
  CATEGORY_DESCRIPTION_MAX,
  CATEGORY_NAME_MAX,
  CATEGORY_POSITION_MAX,
  CATEGORY_SLUG_MAX,
} from '@/components/admin/categories/constants'
import { CategoryImageField } from '@/components/admin/categories/category-image-field'
import { useSlugField } from '@/components/admin/products/use-slug-field'
import { CharacterCount } from '@/components/forms/character-count'
import { describedBy, useFormAction } from '@/components/forms/use-form-action'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { Checkbox, Input, Textarea } from '@/components/ui/input'
import type { ActionState } from '@/lib/actions'
import type { Category } from '@/lib/types'

type FieldErrors = NonNullable<ActionState['fieldErrors']>

interface CategoryFormProps {
  /** The category being edited. Leave it out to create a new one. */
  category?: Category
  /** Pre-filled position for a new category (after the last one). */
  defaultPosition?: number
  /** Edit mode: called after a successful save, e.g. to close the inline editor. */
  onSaved?: () => void
  /** Edit mode: shows a Cancel button. */
  onCancel?: () => void
}

/**
 * Create and inline-edit form for categories. The fields lay themselves out
 * by the space they get (container queries), so the same form works in the
 * narrow "New category" card and in a wide list row.
 */
export function CategoryForm({ category, defaultPosition = 0, onSaved, onCancel }: CategoryFormProps) {
  // Bumped after each successful create, which remounts the fields empty for the next category.
  const [fieldsKey, setFieldsKey] = useState(0)
  const [uploading, setUploading] = useState(false)

  const { state, formAction, onSubmit, pending } = useFormAction(async (previous, formData) => {
    const result = await (category ? updateCategory : createCategory)(previous, formData)
    if (result.ok) {
      // The inline editor closes on save, so its message goes to a toast instead.
      if (category && result.message) toast.success(result.message)
      // Updates after an await need their own transition to land together with the refreshed list.
      startTransition(() => {
        if (category) onSaved?.()
        else setFieldsKey((key) => key + 1)
      })
    }
    return result
  })

  return (
    <form action={formAction} onSubmit={onSubmit} className="@container grid gap-4">
      {category && <input type="hidden" name="id" value={category.id} />}

      <CategoryFields
        key={fieldsKey}
        idPrefix={category ? `category-${category.id}` : 'new-category'}
        category={category}
        defaultPosition={defaultPosition}
        errors={state.fieldErrors ?? {}}
        onUploadingChange={setUploading}
      />

      <div className="flex flex-col-reverse gap-2 @md:flex-row @md:justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        )}
        <SubmitButton disabled={pending || uploading} pendingText="Saving…">
          {category ? 'Save category' : 'Add category'}
        </SubmitButton>
      </div>

      <FormMessage state={state} />
    </form>
  )
}

interface CategoryFieldsProps {
  idPrefix: string
  category?: Category
  defaultPosition: number
  errors: FieldErrors
  onUploadingChange: (uploading: boolean) => void
}

function CategoryFields({ idPrefix, category, defaultPosition, errors, onUploadingChange }: CategoryFieldsProps) {
  const slugField = useSlugField({ name: category?.name ?? '', slug: category?.slug ?? '' })
  const [descriptionLength, setDescriptionLength] = useState(category?.description?.length ?? 0)
  const id = (field: string) => `${idPrefix}-${field}`

  const slugHint = slugField.followsName
    ? 'Filled in from the name. Used in the shop link.'
    : category
      ? 'Changing it breaks links people have saved.'
      : 'Lowercase letters, numbers and hyphens.'

  return (
    <>
      <div className="grid gap-4 @lg:grid-cols-2">
        <Field id={id('name')} label="Name" required errors={errors.name}>
          <Input
            {...describedBy(id('name'), errors.name)}
            name="name"
            value={slugField.name}
            onChange={(event) => slugField.changeName(event.target.value)}
            required
            maxLength={CATEGORY_NAME_MAX}
            placeholder="e.g. Wall hangings"
            autoComplete="off"
            // The inline editor opens on request, so move focus into it.
            autoFocus={Boolean(category)}
          />
        </Field>

        <Field id={id('slug')} label="Slug" required hint={slugHint} errors={errors.slug}>
          <Input
            {...describedBy(id('slug'), errors.slug, true)}
            name="slug"
            value={slugField.slug}
            onChange={(event) => slugField.changeSlug(event.target.value)}
            onBlur={slugField.normalizeSlug}
            required
            maxLength={CATEGORY_SLUG_MAX}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
          />
        </Field>
      </div>

      <Field
        id={id('description')}
        label="Description"
        hint="Optional. Shown at the top of the category in the shop."
        errors={errors.description}
      >
        <Textarea
          id={id('description')}
          name="description"
          rows={3}
          maxLength={CATEGORY_DESCRIPTION_MAX}
          defaultValue={category?.description ?? ''}
          onChange={(event) => setDescriptionLength(event.target.value.length)}
          aria-invalid={Boolean(errors.description?.length) || undefined}
          aria-describedby={`${id('description')}-count ${id('description')}-description`}
        />
        <CharacterCount id={`${id('description')}-count`} count={descriptionLength} max={CATEGORY_DESCRIPTION_MAX} />
      </Field>

      <CategoryImageField
        id={id('image')}
        initialUrl={category?.image_url ?? null}
        errors={errors.image_url}
        onUploadingChange={onUploadingChange}
      />

      <div className="grid gap-4 @lg:grid-cols-2">
        <Field id={id('position')} label="Position" hint="Lower numbers come first." errors={errors.position}>
          <Input
            {...describedBy(id('position'), errors.position, true)}
            name="position"
            type="number"
            min={0}
            max={CATEGORY_POSITION_MAX}
            step={1}
            inputMode="numeric"
            required
            defaultValue={category?.position ?? defaultPosition}
          />
        </Field>

        <label className="flex min-h-10 cursor-pointer items-start gap-3 text-sm @lg:pt-7">
          <Checkbox
            name="is_active"
            defaultChecked={category?.is_active ?? true}
            className="mt-0.5"
            aria-describedby={id('active-help')}
          />
          <span>
            <span className="font-medium">Visible in the shop</span>
            <span id={id('active-help')} className="block text-xs text-muted-foreground">
              Hidden categories are left out of the shop&apos;s filters. Their products stay on sale.
            </span>
          </span>
        </label>
      </div>
    </>
  )
}
