import 'server-only'

import { ADMIN_PAGE_SIZE, MESSAGE_STATUS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import type { ContactMessage, MessageStatus } from '@/lib/types'

/** Contact form message queries for the admin area. Callers must run requireAdmin() first. */

const MESSAGE_STATUSES = Object.keys(MESSAGE_STATUS) as MessageStatus[]

/** Unknown values fall back to "new", the inbox. */
export function parseMessageStatus(value: string | undefined): MessageStatus {
  return MESSAGE_STATUSES.find((status) => status === value) ?? 'new'
}

/** One page of messages with a given status, newest first. */
export async function getContactMessages({
  status,
  page,
}: {
  status: MessageStatus
  page: number
}): Promise<{ items: ContactMessage[]; total: number; pageCount: number }> {
  const supabase = await createClient()
  const from = (page - 1) * ADMIN_PAGE_SIZE

  const { data, count, error } = await supabase
    .from('contact_messages')
    .select('*', { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1)
    .overrideTypes<ContactMessage[], { merge: false }>()

  if (error) {
    console.error('[admin/messages] list failed', error.message)
    return { items: [], total: 0, pageCount: 1 }
  }

  const total = count ?? data.length
  return { items: data, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) }
}

/** Number of messages per status. */
export async function getMessageCounts(): Promise<Record<MessageStatus, number>> {
  const supabase = await createClient()
  const results = await Promise.all(
    MESSAGE_STATUSES.map((status) =>
      supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', status),
    ),
  )

  return Object.fromEntries(
    MESSAGE_STATUSES.map((status, index) => {
      const { count, error } = results[index]
      if (error) console.error('[admin/messages] count failed', error.message)
      return [status, count ?? 0]
    }),
  ) as Record<MessageStatus, number>
}
