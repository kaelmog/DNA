'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { actionError, actionSuccess, actionValidationError, formDataToObject, type ActionState } from '@/lib/actions'
import { requireAdmin } from '@/lib/auth'
import { CUSTOM_REQUEST_STATUS } from '@/lib/constants'
import { CUSTOM_REQUEST_BUCKET } from '@/lib/data/admin/requests'
import { createClient } from '@/lib/supabase/server'
import type { CustomRequest, CustomRequestStatus } from '@/lib/types'
import { optionalMoneyField, optionalText, uuidField } from '@/lib/validation'

const REQUEST_MISSING = 'This request no longer exists.'
const SAVE_FAILED = 'Could not save the request. Please try again.'

/** Largest quote accepted ($100,000), to catch a mistyped amount. */
const MAX_QUOTE_CENTS = 10_000_000

const REQUEST_STATUSES = Object.keys(CUSTOM_REQUEST_STATUS) as [CustomRequestStatus, ...CustomRequestStatus[]]

/** Pages that list requests: the queue, the dashboard count and the customer's profile. */
function revalidateRequestPages(userId: string | null) {
  revalidatePath('/admin/requests')
  revalidatePath('/admin')
  if (userId) revalidatePath(`/admin/customers/${userId}`)
}

const updateSchema = z
  .object({
    id: uuidField,
    status: z.enum(REQUEST_STATUSES, { error: 'Choose a status.' }),
    quoted_price: optionalMoneyField.refine(
      (cents) => cents === null || cents <= MAX_QUOTE_CENTS,
      'That amount looks too high. Enter the price in dollars, for example 180 or 180.50.',
    ),
    seller_notes: optionalText(4000),
  })
  .refine((data) => data.status !== 'quoted' || data.quoted_price !== null, {
    path: ['quoted_price'],
    message: 'Add the price you quoted.',
  })

/** Saves the status, quoted price and private notes of a custom request. */
export async function updateCustomRequest(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const parsed = updateSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionValidationError(parsed.error)
  const { id, status, quoted_price, seller_notes } = parsed.data

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('custom_requests')
    .update({ status, quoted_price_cents: quoted_price, seller_notes })
    .eq('id', id)
    .select('id, user_id')
    .maybeSingle<Pick<CustomRequest, 'id' | 'user_id'>>()

  if (error) {
    console.error('[admin/requests] update failed', error.message)
    return actionError(SAVE_FAILED)
  }
  if (!data) return actionError(REQUEST_MISSING)

  revalidateRequestPages(data.user_id)
  return actionSuccess('Request saved.')
}

const deleteSchema = z.object({ id: uuidField })

/** Deletes a request and its private reference image. */
export async function deleteCustomRequest(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const parsed = deleteSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionError('Invalid request.')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('custom_requests')
    .delete()
    .eq('id', parsed.data.id)
    .select('id, user_id, reference_image_path')
    .maybeSingle<Pick<CustomRequest, 'id' | 'user_id' | 'reference_image_path'>>()

  if (error) {
    console.error('[admin/requests] delete failed', error.message)
    return actionError('Could not delete the request. Please try again.')
  }
  if (!data) return actionError(REQUEST_MISSING)

  // The row is gone either way; a leftover image is only logged (it is private and unguessable).
  if (data.reference_image_path) {
    const { error: storageError } = await supabase.storage
      .from(CUSTOM_REQUEST_BUCKET)
      .remove([data.reference_image_path])
    if (storageError) console.error('[admin/requests] image delete failed', storageError.message)
  }

  revalidateRequestPages(data.user_id)
  return actionSuccess('Request deleted.')
}
