'use client'

import { useEffect, useRef, useState } from 'react'

import { createProduct, updateProduct } from '@/app/admin/products/actions'
import { ProductFormFields } from '@/components/admin/products/product-form-fields'
import { ProductSaveBar } from '@/components/admin/products/product-save-bar'
import { useFormAction } from '@/components/forms/use-form-action'
import type { Category, ProductDetail } from '@/lib/types'

interface ProductFormProps {
  /** The product being edited. Leave it out to create a new product. */
  product?: ProductDetail
  /** Every category, hidden ones included. */
  categories: Category[]
  currency: string
}

/**
 * Create / edit form for a product, shared by /admin/products/new and
 * /admin/products/[id]. Creating redirects to the new product's page;
 * saving an existing product shows the result in the save bar.
 */
export function ProductForm({ product, categories, currency }: ProductFormProps) {
  const save = product ? updateProduct.bind(null, product.id) : createProduct
  // Submits through onSubmit, so React does not reset the form (and the
  // controlled variant checkboxes) after an error.
  const { state, formAction, onSubmit, pending } = useFormAction(save)
  const [uploading, setUploading] = useState(false)
  const fieldsRef = useRef<HTMLDivElement>(null)

  // The save bar sits at the bottom, so after a failed save bring the first problem into view.
  useEffect(() => {
    if (state.ok !== false) return
    const problem = fieldsRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]')
    if (!problem) return
    problem.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (problem.matches('input, select, textarea')) problem.focus({ preventScroll: true })
  }, [state])

  return (
    <form action={formAction} onSubmit={onSubmit} className="grid gap-6">
      <div ref={fieldsRef}>
        {/*
          Keyed on updated_at: after a save the fields remount from the saved
          product, so new photos and variants pick up their database ids and
          text shows the cleaned-up values. Failed validation changes nothing
          on the server, so the admin's input stays put.
        */}
        <ProductFormFields
          key={product?.updated_at ?? 'new'}
          product={product}
          categories={categories}
          currency={currency}
          errors={state.fieldErrors ?? {}}
          onUploadingChange={setUploading}
        />
      </div>
      <ProductSaveBar state={state} isNew={!product} pending={pending} uploading={uploading} />
    </form>
  )
}
