import { MessageSquareQuote } from 'lucide-react'
import type { Metadata } from 'next'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { MessageCard } from '@/components/admin/messages/message-card'
import { FilterTabs, listHref, readPage, readParam, type SearchParams } from '@/components/admin/orders/list-controls'
import { EmptyState } from '@/components/ui/misc'
import { Pagination } from '@/components/ui/pagination'
import { requireAdmin } from '@/lib/auth'
import { getContactMessages, getMessageCounts, parseMessageStatus } from '@/lib/data/admin/messages'
import type { MessageStatus } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Messages',
}

const BASE_PATH = '/admin/messages'

const TABS: { value: MessageStatus; label: string; empty: { title: string; description: string } }[] = [
  {
    value: 'new',
    label: 'New',
    empty: { title: 'Inbox zero', description: 'Messages sent from the Contact page land here.' },
  },
  {
    value: 'read',
    label: 'Read',
    empty: { title: 'No read messages', description: 'Messages you mark as read move here.' },
  },
  {
    value: 'archived',
    label: 'Archived',
    empty: { title: 'Nothing archived', description: 'Archive messages you have dealt with to keep the inbox tidy.' },
  },
]

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin()

  const params = await searchParams
  const status = parseMessageStatus(readParam(params.status))
  const page = readPage(params.page)
  // "new" is the default tab, so it does not need to be in the URL.
  const statusParam = status === 'new' ? undefined : status
  const activeTab = TABS.find((tab) => tab.value === status) ?? TABS[0]

  const [messages, counts] = await Promise.all([getContactMessages({ status, page }), getMessageCounts()])

  return (
    <>
      <AdminPageHeader
        title="Messages"
        description="Messages from the Contact page. Reply opens your email app with the subject filled in."
      />

      <FilterTabs
        label="Filter messages by status"
        active={status}
        tabs={TABS.map((tab) => ({
          value: tab.value,
          label: tab.label,
          count: counts[tab.value],
          highlight: tab.value === 'new',
          href: listHref(BASE_PATH, { status: tab.value === 'new' ? undefined : tab.value }),
        }))}
      />

      {messages.items.length > 0 ? (
        <>
          <h2 className="sr-only">{activeTab.label} messages</h2>
          <ul className="grid gap-4">
            {messages.items.map((message) => (
              <li key={message.id}>
                <MessageCard message={message} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState icon={<MessageSquareQuote />} title={activeTab.empty.title} description={activeTab.empty.description} />
      )}

      <Pagination
        page={page}
        pageCount={messages.pageCount}
        basePath={BASE_PATH}
        searchParams={{ status: statusParam }}
        className="mt-6"
      />
    </>
  )
}
