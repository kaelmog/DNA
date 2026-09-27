import { Mail } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { CustomerOrdersCard, CustomerRequestsCard } from '@/components/admin/customers/customer-activity'
import { RoleBadge } from '@/components/admin/customers/role-badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { isCurrentUserAdmin, requireAdmin } from '@/lib/auth'
import { getCustomer, getCustomerOrders, getCustomerRequests } from '@/lib/data/admin/customers'
import { getStoreSettings } from '@/lib/data/settings'
import { formatDate, formatMoney } from '@/lib/format'
import { uuidField } from '@/lib/validation'

interface CustomerPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CustomerPageProps): Promise<Metadata> {
  const { id } = await params
  // Only look the customer up for admins; everyone else gets a 404 from the page anyway.
  const customer = uuidField.safeParse(id).success && (await isCurrentUserAdmin()) ? await getCustomer(id) : null
  return { title: customer ? customer.full_name || customer.email : 'Customer' }
}

export default async function AdminCustomerPage({ params }: CustomerPageProps) {
  await requireAdmin()

  const { id } = await params
  if (!uuidField.safeParse(id).success) notFound()

  const [customer, orders, requests, settings] = await Promise.all([
    getCustomer(id),
    getCustomerOrders(id),
    getCustomerRequests(id),
    getStoreSettings(),
  ])
  if (!customer) notFound()

  return (
    <>
      <AdminPageHeader
        backHref="/admin/customers"
        backLabel="All customers"
        title={customer.full_name || customer.email}
        description={`Customer since ${formatDate(customer.created_at)}`}
        actions={
          <a href={`mailto:${customer.email}`} className={buttonVariants({ variant: 'outline' })}>
            <Mail aria-hidden="true" /> Email customer
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid content-start gap-6 lg:col-span-2">
          <CustomerOrdersCard orders={orders} />
          <CustomerRequestsCard requests={requests} currency={settings.currency} />
        </div>

        <div className="grid content-start gap-6">
          <Card>
            <CardTitle className="mb-4">Lifetime</CardTitle>
            <dl className="grid grid-cols-2 gap-4">
              <Stat label="Orders" value={String(customer.order_count)} />
              <Stat label="Total spent" value={formatMoney(customer.total_spent_cents, settings.currency)} />
              <Stat
                label="Last order"
                value={customer.last_order_at ? formatDate(customer.last_order_at) : '—'}
                className="col-span-2"
              />
            </dl>
          </Card>

          <Card>
            <CardTitle className="mb-4">Profile</CardTitle>
            <dl className="grid gap-3 text-sm">
              <ProfileRow label="Email">
                <a href={`mailto:${customer.email}`} className="break-all text-clay hover:underline">
                  {customer.email}
                </a>
              </ProfileRow>
              <ProfileRow label="Phone">{customer.phone || '—'}</ProfileRow>
              <ProfileRow label="Role">
                <RoleBadge role={customer.role} />
              </ProfileRow>
              <ProfileRow label="Marketing emails">{customer.marketing_opt_in ? 'Opted in' : 'Not opted in'}</ProfileRow>
              <ProfileRow label="Joined">{formatDate(customer.created_at)}</ProfileRow>
            </dl>
            <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
              For safety, roles can only be changed with SQL in the Supabase dashboard (SQL Editor):{' '}
              <code className="rounded bg-muted px-1 py-0.5 break-all">
                update public.profiles set role = &apos;{customer.role === 'admin' ? 'customer' : 'admin'}&apos; where
                email = &apos;{customer.email}&apos;;
              </code>
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 font-serif text-2xl tabular-nums">{value}</dd>
    </div>
  )
}

function ProfileRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  )
}
