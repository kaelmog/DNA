'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { actionError, actionSuccess, formDataToObject, type ActionState } from '@/lib/actions'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { NewsletterSubscriber } from '@/lib/types'
import { uuidField } from '@/lib/validation'

const SUBSCRIBER_MISSING = 'This subscriber no longer exists.'

const statusSchema = z.object({
  id: uuidField,
  status: z.enum(['subscribed', 'unsubscribed']),
})

/** Unsubscribes or re-subscribes an address (for example after a request by email). */
export async function setSubscriberStatus(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const parsed = statusSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionError('Invalid request.')
  const { id, status } = parsed.data

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update({ status })
    .eq('id', id)
    .select('email')
    .maybeSingle<Pick<NewsletterSubscriber, 'email'>>()

  if (error) {
    console.error('[admin/subscribers] status update failed', error.message)
    return actionError('Could not update the subscriber. Please try again.')
  }
  if (!data) return actionError(SUBSCRIBER_MISSING)

  revalidatePath('/admin/subscribers')
  return actionSuccess(status === 'subscribed' ? `${data.email} re-subscribed.` : `${data.email} unsubscribed.`)
}

const deleteSchema = z.object({ id: uuidField })

/** Removes an address completely (for privacy requests). Unsubscribing keeps a record instead. */
export async function deleteSubscriber(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const parsed = deleteSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionError('Invalid request.')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .delete()
    .eq('id', parsed.data.id)
    .select('email')
    .maybeSingle<Pick<NewsletterSubscriber, 'email'>>()

  if (error) {
    console.error('[admin/subscribers] delete failed', error.message)
    return actionError('Could not delete the subscriber. Please try again.')
  }
  if (!data) return actionError(SUBSCRIBER_MISSING)

  revalidatePath('/admin/subscribers')
  return actionSuccess(`${data.email} deleted.`)
}
