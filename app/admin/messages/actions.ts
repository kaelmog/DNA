'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { actionError, actionSuccess, formDataToObject, type ActionState } from '@/lib/actions'
import { requireAdmin } from '@/lib/auth'
import { MESSAGE_STATUS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import type { MessageStatus } from '@/lib/types'
import { uuidField } from '@/lib/validation'

const MESSAGE_MISSING = 'This message no longer exists.'

const MESSAGE_STATUSES = Object.keys(MESSAGE_STATUS) as [MessageStatus, ...MessageStatus[]]

const SUCCESS_TEXT: Record<MessageStatus, string> = {
  new: 'Message moved back to new.',
  read: 'Message marked as read.',
  archived: 'Message archived.',
}

/** The inbox and the dashboard's "new messages" count. */
function revalidateMessagePages() {
  revalidatePath('/admin/messages')
  revalidatePath('/admin')
}

const statusSchema = z.object({
  id: uuidField,
  status: z.enum(MESSAGE_STATUSES),
})

export async function setMessageStatus(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const parsed = statusSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionError('Invalid request.')
  const { id, status } = parsed.data

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contact_messages')
    .update({ status })
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[admin/messages] status update failed', error.message)
    return actionError('Could not update the message. Please try again.')
  }
  if (!data) return actionError(MESSAGE_MISSING)

  revalidateMessagePages()
  return actionSuccess(SUCCESS_TEXT[status])
}

const deleteSchema = z.object({ id: uuidField })

export async function deleteMessage(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const parsed = deleteSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionError('Invalid request.')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contact_messages')
    .delete()
    .eq('id', parsed.data.id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[admin/messages] delete failed', error.message)
    return actionError('Could not delete the message. Please try again.')
  }
  if (!data) return actionError(MESSAGE_MISSING)

  revalidateMessagePages()
  return actionSuccess('Message deleted.')
}
