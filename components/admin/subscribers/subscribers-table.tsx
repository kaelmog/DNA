import { deleteSubscriber, setSubscriberStatus } from '@/app/admin/subscribers/actions'
import { ActionButton } from '@/components/admin/confirm-button'
import { StatusBadge } from '@/components/ui/badge'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { SUBSCRIBER_STATUS } from '@/lib/data/admin/subscribers'
import { formatDate, humanize } from '@/lib/format'
import type { NewsletterSubscriber } from '@/lib/types'

function SubscriberActions({ subscriber }: { subscriber: NewsletterSubscriber }) {
  const isSubscribed = subscriber.status === 'subscribed'
  return (
    <div className="flex flex-wrap items-center gap-2 md:justify-end">
      <ActionButton
        action={setSubscriberStatus}
        fields={{ id: subscriber.id, status: isSubscribed ? 'unsubscribed' : 'subscribed' }}
        variant="outline"
        size="sm"
        className="h-10"
        pendingText="Saving…"
        aria-label={`${isSubscribed ? 'Unsubscribe' : 'Resubscribe'} ${subscriber.email}`}
      >
        {isSubscribed ? 'Unsubscribe' : 'Resubscribe'}
      </ActionButton>
      <ActionButton
        action={deleteSubscriber}
        fields={{ id: subscriber.id }}
        confirm={`Delete ${subscriber.email} from the list completely? This cannot be undone.`}
        variant="destructive"
        size="sm"
        className="h-10"
        pendingText="Deleting…"
        aria-label={`Delete ${subscriber.email}`}
      >
        Delete
      </ActionButton>
    </div>
  )
}

/** Where the address signed up ("footer" -> "Footer"). */
function sourceLabel(source: string | null) {
  return source ? humanize(source) : '—'
}

/** Newsletter subscribers: cards on phones, a table from md up. */
export function SubscribersTable({ subscribers }: { subscribers: NewsletterSubscriber[] }) {
  return (
    <>
      <ul className="grid gap-3 md:hidden">
        {subscribers.map((subscriber) => (
          <li key={subscriber.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 font-medium break-all">{subscriber.email}</p>
              <StatusBadge meta={SUBSCRIBER_STATUS[subscriber.status]} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Joined {formatDate(subscriber.created_at)} · {sourceLabel(subscriber.source)}
            </p>
            <div className="mt-3 border-t border-border pt-3">
              <SubscriberActions subscriber={subscriber} />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden md:block">
        <Table>
          <THead>
            <tr>
              <TH>Email</TH>
              <TH>Status</TH>
              <TH>Source</TH>
              <TH>Joined</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {subscribers.map((subscriber) => (
              <TR key={subscriber.id}>
                <TD className="max-w-[20rem] truncate font-medium">{subscriber.email}</TD>
                <TD>
                  <StatusBadge meta={SUBSCRIBER_STATUS[subscriber.status]} />
                </TD>
                <TD className="text-muted-foreground">{sourceLabel(subscriber.source)}</TD>
                <TD className="whitespace-nowrap text-muted-foreground">{formatDate(subscriber.created_at)}</TD>
                <TD>
                  <SubscriberActions subscriber={subscriber} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  )
}
