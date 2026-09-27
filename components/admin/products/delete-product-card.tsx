'use client'

import { Trash } from 'lucide-react'
import { useActionState } from 'react'

import { deleteProduct } from '@/app/admin/products/actions'
import { ConfirmButton } from '@/components/admin/confirm-button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form-status'
import { initialActionState, type ActionState } from '@/lib/actions'

/**
 * "Danger zone" under the product editor. deleteProduct redirects to the list
 * on success; it refuses products that appear in orders (the message says to
 * archive them instead), so order history always keeps its products.
 */
export function DeleteProductCard({ productId, productName }: { productId: string; productName: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    () => deleteProduct(productId),
    initialActionState,
  )

  return (
    <Card className="border-destructive/25">
      <CardTitle>Delete product</CardTitle>
      <CardDescription className="mt-1.5 max-w-2xl">
        Removes the product with its photos, variants and reviews for good. Products that have been ordered can&apos;t
        be deleted: set their status to <span className="font-medium text-foreground">Archived</span> instead to hide
        them from the shop and keep your order history complete.
      </CardDescription>
      <form action={formAction} className="mt-4">
        <ConfirmButton
          message={`Delete “${productName}”? Its photos, variants and reviews are removed too. This cannot be undone.`}
          variant="destructive"
          pendingText="Deleting…"
          className="w-full sm:w-auto"
        >
          <Trash aria-hidden="true" /> Delete product
        </ConfirmButton>
      </form>
      <FormMessage state={state} className="mt-4" />
    </Card>
  )
}
