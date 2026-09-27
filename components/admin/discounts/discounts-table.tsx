import { Pencil } from 'lucide-react'
import Link from 'next/link'

import { deleteDiscount, setDiscountActive } from '@/app/admin/discounts/actions'
import { ActionButton } from '@/components/admin/confirm-button'
import { StatusBadge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { DISCOUNT_STATE, type DiscountListItem } from '@/lib/data/admin/discounts'
import { formatDate, formatMoney } from '@/lib/format'
import type { DiscountCode } from '@/lib/types'

function formatValue(code: DiscountCode, currency: string) {
  return code.discount_type === 'percentage' ? `${code.value}% off` : `${formatMoney(code.value, currency)} off`
}

function formatWindow(code: DiscountCode) {
  if (code.starts_at && code.ends_at) return `${formatDate(code.starts_at)} – ${formatDate(code.ends_at)}`
  if (code.starts_at) return `From ${formatDate(code.starts_at)}`
  if (code.ends_at) return `Until ${formatDate(code.ends_at)}`
  return 'No end date'
}

function formatUsage(code: DiscountCode) {
  return `${code.times_redeemed} / ${code.max_redemptions ?? '∞'}`
}

function formatMinimum(code: DiscountCode, currency: string) {
  return code.min_subtotal_cents > 0 ? formatMoney(code.min_subtotal_cents, currency) : null
}

/** Edit link, enable/disable toggle and (for unused codes) delete. */
function DiscountActions({ discount }: { discount: DiscountListItem }) {
  return (
    <div className="flex flex-wrap items-center gap-2 md:justify-end">
      <Link
        href={`/admin/discounts/${discount.id}`}
        className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        aria-label={`Edit ${discount.code}`}
      >
        <Pencil aria-hidden="true" />
      </Link>
      <ActionButton
        action={setDiscountActive}
        fields={{ id: discount.id, active: String(!discount.is_active) }}
        variant="outline"
        size="sm"
        className="h-10"
        pendingText="Saving…"
        aria-label={`${discount.is_active ? 'Disable' : 'Enable'} ${discount.code}`}
      >
        {discount.is_active ? 'Disable' : 'Enable'}
      </ActionButton>
      {/* Used codes are kept so past orders still make sense; they can only be disabled. */}
      {discount.times_redeemed === 0 && (
        <ActionButton
          action={deleteDiscount}
          fields={{ id: discount.id }}
          confirm={`Delete ${discount.code}? This cannot be undone.`}
          variant="destructive"
          size="sm"
          className="h-10"
          pendingText="Deleting…"
          aria-label={`Delete ${discount.code}`}
        >
          Delete
        </ActionButton>
      )}
    </div>
  )
}

/** Discount codes with their derived status and row actions: cards on phones, a table from md up. */
export function DiscountsTable({ discounts, currency }: { discounts: DiscountListItem[]; currency: string }) {
  return (
    <>
      <ul className="grid gap-3 md:hidden">
        {discounts.map((discount) => {
          const minimum = formatMinimum(discount, currency)
          return (
            <li key={discount.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/discounts/${discount.id}`}
                    className="font-mono font-semibold break-all text-clay hover:underline"
                  >
                    {discount.code}
                  </Link>
                  {discount.description && (
                    <p className="text-xs break-words text-muted-foreground">{discount.description}</p>
                  )}
                </div>
                <StatusBadge meta={DISCOUNT_STATE[discount.state]} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Value</dt>
                  <dd className="font-medium">{formatValue(discount, currency)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Used</dt>
                  <dd className="tabular-nums">{formatUsage(discount)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Minimum</dt>
                  <dd>{minimum ?? 'None'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Active window</dt>
                  <dd>{formatWindow(discount)}</dd>
                </div>
              </dl>
              <div className="mt-3 border-t border-border pt-3">
                <DiscountActions discount={discount} />
              </div>
            </li>
          )
        })}
      </ul>

      <div className="hidden md:block">
        <Table className="min-w-[860px]">
          <THead>
            <tr>
              <TH>Code</TH>
              <TH>Value</TH>
              <TH>Minimum</TH>
              <TH>Used</TH>
              <TH>Active window</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {discounts.map((discount) => (
              <TR key={discount.id}>
                <TD className="max-w-[14rem]">
                  <Link
                    href={`/admin/discounts/${discount.id}`}
                    className="font-mono font-semibold text-clay hover:underline"
                  >
                    {discount.code}
                  </Link>
                  {discount.description && (
                    <p className="truncate text-xs text-muted-foreground">{discount.description}</p>
                  )}
                </TD>
                <TD className="font-medium whitespace-nowrap">{formatValue(discount, currency)}</TD>
                <TD className="whitespace-nowrap text-muted-foreground">{formatMinimum(discount, currency) ?? '—'}</TD>
                <TD className="whitespace-nowrap tabular-nums">{formatUsage(discount)}</TD>
                <TD className="whitespace-nowrap text-muted-foreground">{formatWindow(discount)}</TD>
                <TD>
                  <StatusBadge meta={DISCOUNT_STATE[discount.state]} />
                </TD>
                <TD>
                  <DiscountActions discount={discount} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  )
}
