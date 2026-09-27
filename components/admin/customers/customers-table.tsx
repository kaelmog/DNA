import Link from 'next/link'

import { RoleBadge } from '@/components/admin/customers/role-badge'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { formatDate, formatMoney, pluralize } from '@/lib/format'
import type { CustomerSummary } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Customers list: cards on phones, a table from md up. Admin accounts are highlighted so they are easy to spot. */
export function CustomersTable({ customers, currency }: { customers: CustomerSummary[]; currency: string }) {
  return (
    <>
      <ul className="grid gap-3 md:hidden">
        {customers.map((customer) => (
          <li key={customer.id}>
            <Link
              href={`/admin/customers/${customer.id}`}
              className={cn(
                'block rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40',
                customer.role === 'admin' && 'bg-info/5',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-clay">{customer.full_name || customer.email}</p>
                  {customer.full_name && <p className="truncate text-xs text-muted-foreground">{customer.email}</p>}
                </div>
                <RoleBadge role={customer.role} />
              </div>
              <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
                <span className="font-semibold tabular-nums">{formatMoney(customer.total_spent_cents, currency)}</span>
                <span className="text-xs text-muted-foreground">
                  {pluralize(customer.order_count, 'order')} · joined {formatDate(customer.created_at)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden md:block">
        <Table>
          <THead>
            <tr>
              <TH>Customer</TH>
              <TH>Role</TH>
              <TH className="text-right">Orders</TH>
              <TH className="text-right">Total spent</TH>
              <TH>Last order</TH>
              <TH>Joined</TH>
              <TH>Marketing</TH>
            </tr>
          </THead>
          <TBody>
            {customers.map((customer) => (
              <TR key={customer.id} className={customer.role === 'admin' ? 'bg-info/5' : undefined}>
                <TD className="max-w-[18rem]">
                  <Link href={`/admin/customers/${customer.id}`} className="block min-h-10 py-0.5 hover:underline">
                    <span className="block truncate font-medium text-clay">{customer.full_name || customer.email}</span>
                    {customer.full_name && (
                      <span className="block truncate text-xs text-muted-foreground">{customer.email}</span>
                    )}
                  </Link>
                </TD>
                <TD>
                  <RoleBadge role={customer.role} />
                </TD>
                <TD className="text-right tabular-nums">{customer.order_count}</TD>
                <TD className="text-right font-medium whitespace-nowrap tabular-nums">
                  {formatMoney(customer.total_spent_cents, currency)}
                </TD>
                <TD className="whitespace-nowrap text-muted-foreground">
                  {customer.last_order_at ? formatDate(customer.last_order_at) : '—'}
                </TD>
                <TD className="whitespace-nowrap text-muted-foreground">{formatDate(customer.created_at)}</TD>
                <TD className="text-muted-foreground">{customer.marketing_opt_in ? 'Opted in' : 'No'}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  )
}
