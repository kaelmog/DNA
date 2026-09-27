'use client'

import { Pencil, Trash } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { deleteCategory } from '@/app/admin/categories/actions'
import { CategoryForm } from '@/components/admin/categories/category-form'
import { ActionButton } from '@/components/admin/confirm-button'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import type { CategoryWithCount } from '@/lib/data/admin/catalog'
import { pluralize } from '@/lib/format'

function deleteConfirmation({ name, product_count }: CategoryWithCount) {
  const products =
    product_count > 0
      ? `Its ${pluralize(product_count, 'product')} will stay in your catalog but become uncategorised.`
      : 'No products use it.'
  return `Delete “${name}”? ${products} This cannot be undone.`
}

/** One category card. "Edit" swaps the card for an inline form in the same spot. */
export function CategoryListItem({ category }: { category: CategoryWithCount }) {
  const [editing, setEditing] = useState(false)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const restoreFocus = useRef(false)

  // When the editor closes, return focus to the Edit button so keyboard users keep their place.
  useEffect(() => {
    if (editing || !restoreFocus.current) return
    restoreFocus.current = false
    editButtonRef.current?.focus()
  }, [editing])

  function closeEditor() {
    restoreFocus.current = true
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="rounded-2xl border border-clay/40 bg-card p-4 ring-3 ring-clay/10 sm:p-5">
        <h3 className="mb-4 font-serif text-lg tracking-tight wrap-anywhere">
          Edit “{category.name}”
        </h3>
        <CategoryForm category={category} onSaved={closeEditor} onCancel={closeEditor} />
      </li>
    )
  }

  return (
    <li className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          {category.image_url && (
            <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image src={category.image_url} alt="" fill sizes="56px" className="object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium wrap-anywhere">
                {category.name}
              </h3>
              <Badge tone={category.is_active ? 'success' : 'neutral'}>{category.is_active ? 'Visible' : 'Hidden'}</Badge>
            </div>
            <p className="mt-0.5 font-mono text-xs break-all text-muted-foreground">{category.slug}</p>
            {category.description && (
              <p className="mt-2 text-sm wrap-anywhere text-muted-foreground">{category.description}</p>
            )}
            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <div className="flex gap-1.5">
                <dt className="text-muted-foreground">Position</dt>
                <dd className="font-medium tabular-nums">{category.position}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-muted-foreground">Products</dt>
                <dd className="font-medium tabular-nums">
                  {category.product_count > 0 ? (
                    <Link
                      href={`/admin/products?category=${category.id}`}
                      className="text-clay hover:underline"
                      aria-label={`View the ${pluralize(category.product_count, 'product')} in ${category.name}`}
                    >
                      {category.product_count}
                    </Link>
                  ) : (
                    0
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            ref={editButtonRef}
            type="button"
            onClick={() => setEditing(true)}
            className={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-10' })}
            aria-label={`Edit ${category.name}`}
          >
            <Pencil aria-hidden="true" /> Edit
          </button>
          <ActionButton
            action={deleteCategory}
            fields={{ id: category.id }}
            confirm={deleteConfirmation(category)}
            variant="destructive"
            size="sm"
            className="h-10"
            pendingText="Deleting…"
            aria-label={`Delete ${category.name}`}
          >
            <Trash aria-hidden="true" /> Delete
          </ActionButton>
        </div>
      </div>
    </li>
  )
}
