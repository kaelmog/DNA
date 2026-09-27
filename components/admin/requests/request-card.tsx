import { ImageOff, Mail, Phone, UserRound } from 'lucide-react'
import Link from 'next/link'

import { deleteCustomRequest } from '@/app/admin/requests/actions'
import { ActionButton } from '@/components/admin/confirm-button'
import { RequestUpdateForm } from '@/components/admin/requests/request-update-form'
import { StatusBadge } from '@/components/ui/badge'
import { CUSTOM_REQUEST_STATUS } from '@/lib/constants'
import type { AdminCustomRequest } from '@/lib/data/admin/requests'
import { formatDate, formatDateTime, formatMoney } from '@/lib/format'

/** mailto: link with a subject line ready for the reply. */
function replyHref(request: AdminCustomRequest) {
  const subject = `Re: your custom request (${request.request_type})`
  return `mailto:${request.customer_email}?subject=${encodeURIComponent(subject)}`
}

/** `deadline` is a plain date ("2026-11-30"): format it in UTC so no time zone shifts it by a day. */
function formatDeadline(deadline: string) {
  return formatDate(deadline, { dateStyle: 'medium', timeZone: 'UTC' })
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  )
}

function CustomerContact({ request }: { request: AdminCustomRequest }) {
  return (
    <div className="grid gap-1.5 text-sm">
      <p className="font-medium">{request.customer_name}</p>
      <a
        href={replyHref(request)}
        className="inline-flex min-h-10 items-center gap-2 break-all text-clay hover:underline sm:min-h-0"
      >
        <Mail className="size-4 shrink-0" aria-hidden="true" />
        {request.customer_email}
      </a>
      {request.phone && (
        <a
          href={`tel:${request.phone}`}
          className="inline-flex min-h-10 items-center gap-2 text-muted-foreground hover:text-foreground sm:min-h-0"
        >
          <Phone className="size-4 shrink-0" aria-hidden="true" />
          {request.phone}
        </a>
      )}
      {request.user_id && (
        <Link
          href={`/admin/customers/${request.user_id}`}
          className="inline-flex min-h-10 items-center gap-2 text-muted-foreground hover:text-foreground sm:min-h-0"
        >
          <UserRound className="size-4 shrink-0" aria-hidden="true" />
          View customer profile
        </Link>
      )}
    </div>
  )
}

function ReferenceImage({ request }: { request: AdminCustomRequest }) {
  if (!request.reference_image_path) return null
  if (!request.reference_image_url) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <ImageOff className="size-4" aria-hidden="true" /> The reference image could not be loaded.
      </p>
    )
  }
  return (
    <a
      href={request.reference_image_url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block overflow-hidden rounded-xl border border-border hover:opacity-90"
    >
      {/*
        A plain <img>: the signed URL expires after an hour and changes on every
        page load, so the next/image optimiser would only cache throwaway copies.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={request.reference_image_url}
        alt={`Reference image sent by ${request.customer_name}`}
        className="h-40 w-auto max-w-full object-cover"
        loading="lazy"
      />
      <span className="sr-only">(opens the full image in a new tab)</span>
    </a>
  )
}

/** One custom request: what the customer asked for on the left, the admin's status/quote/notes on the right. */
export function RequestCard({ request, currency }: { request: AdminCustomRequest; currency: string }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-xl break-words">{request.request_type}</h3>
          <p className="text-xs text-muted-foreground">
            Received <time dateTime={request.created_at}>{formatDateTime(request.created_at)}</time>
          </p>
        </div>
        <StatusBadge meta={CUSTOM_REQUEST_STATUS[request.status]} />
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid content-start gap-5">
          <CustomerContact request={request} />

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Detail label="Budget">{request.budget_cents ? formatMoney(request.budget_cents, currency) : '—'}</Detail>
            <Detail label="Deadline">{request.deadline ? formatDeadline(request.deadline) : '—'}</Detail>
            <Detail label="Colours">{request.preferred_colors || '—'}</Detail>
            <Detail label="Dimensions">{request.dimensions || '—'}</Detail>
          </dl>

          <div>
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="mt-1 text-sm leading-6 break-words whitespace-pre-wrap">{request.description}</p>
          </div>

          <ReferenceImage request={request} />
        </div>

        <div className="grid content-start gap-4 border-t border-border pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <RequestUpdateForm
            request={{
              id: request.id,
              status: request.status,
              quoted_price_cents: request.quoted_price_cents,
              seller_notes: request.seller_notes,
            }}
            currency={currency}
          />
          <div className="border-t border-border pt-4">
            <ActionButton
              action={deleteCustomRequest}
              fields={{ id: request.id }}
              confirm={`Delete the request from ${request.customer_name}? Its reference image is deleted too. This cannot be undone.`}
              variant="destructive"
              size="sm"
              className="h-10"
              pendingText="Deleting…"
            >
              Delete request
            </ActionButton>
          </div>
        </div>
      </div>
    </article>
  )
}
