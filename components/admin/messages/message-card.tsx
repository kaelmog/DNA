import { Reply } from 'lucide-react'

import { deleteMessage, setMessageStatus } from '@/app/admin/messages/actions'
import { ActionButton } from '@/components/admin/confirm-button'
import { buttonVariants } from '@/components/ui/button'
import { formatDateTime } from '@/lib/format'
import type { ContactMessage, MessageStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

/** mailto: link that answers with "Re: <subject>". */
function replyHref(message: ContactMessage) {
  const subject = message.subject ? `Re: ${message.subject}` : 'Re: your message'
  return `mailto:${message.email}?subject=${encodeURIComponent(subject)}`
}

/** Status moves offered for each tab: new -> read/archived, read -> archived/new, archived -> new. */
const STATUS_MOVES: Record<MessageStatus, { status: MessageStatus; label: string }[]> = {
  new: [
    { status: 'read', label: 'Mark as read' },
    { status: 'archived', label: 'Archive' },
  ],
  read: [
    { status: 'archived', label: 'Archive' },
    { status: 'new', label: 'Move back to new' },
  ],
  archived: [{ status: 'new', label: 'Move back to new' }],
}

function MessageActions({ message }: { message: ContactMessage }) {
  const from = `the message from ${message.name}`
  return (
    <div className="flex flex-wrap gap-2">
      <a href={replyHref(message)} className={cn(buttonVariants({ variant: 'accent', size: 'sm' }), 'h-10')}>
        <Reply aria-hidden="true" /> Reply
      </a>
      {STATUS_MOVES[message.status].map((move) => (
        <ActionButton
          key={move.status}
          action={setMessageStatus}
          fields={{ id: message.id, status: move.status }}
          variant="outline"
          size="sm"
          className="h-10"
          pendingText="Saving…"
          aria-label={`${move.label}: ${from}`}
        >
          {move.label}
        </ActionButton>
      ))}
      <ActionButton
        action={deleteMessage}
        fields={{ id: message.id }}
        confirm={`Delete ${from}? This cannot be undone.`}
        variant="destructive"
        size="sm"
        className="h-10"
        pendingText="Deleting…"
        aria-label={`Delete ${from}`}
      >
        Delete
      </ActionButton>
    </div>
  )
}

/** One contact form message. New ones get a coloured edge so they stand out. */
export function MessageCard({ message }: { message: ContactMessage }) {
  return (
    <article
      className={cn(
        'rounded-2xl border border-border bg-card p-4 sm:p-5',
        message.status === 'new' && 'border-l-4 border-l-clay',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h3 className="font-semibold break-words">{message.subject || 'No subject'}</h3>
          <p className="text-sm break-words">
            <span className="font-medium">{message.name}</span>{' '}
            <a href={replyHref(message)} className="break-all text-clay hover:underline">
              {message.email}
            </a>
          </p>
        </div>
        <time dateTime={message.created_at} className="text-xs whitespace-nowrap text-muted-foreground">
          {formatDateTime(message.created_at)}
        </time>
      </div>

      <p className="mt-3 text-sm leading-6 break-words whitespace-pre-wrap">{message.message}</p>

      <div className="mt-4 border-t border-border pt-4">
        <MessageActions message={message} />
      </div>
    </article>
  )
}
