import { Package } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { OrderList } from '@/components/account/order-list'
import { ProfileForm } from '@/components/account/profile-form'
import { Notice } from '@/components/auth/notice'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/misc'
import { getCurrentProfile, requireUser } from '@/lib/auth'
import { getMyOrders } from '@/lib/data/account'

export const metadata: Metadata = {
  title: 'My account',
  robots: { index: false, follow: false },
}

type SearchParams = Record<string, string | string[] | undefined>

/** One-off banners after email links and password changes. Only fixed messages are shown, never query text. */
function overviewNotice(params: SearchParams) {
  if (params.welcome === '1') return 'Welcome to Knotted Studio! Your email is confirmed and your account is ready.'
  if (params.password === 'updated') return 'Your password has been updated.'
  if (params.email === 'confirmed') {
    return 'Thanks for confirming. If you are changing your email, the new address takes over once both confirmation links have been used.'
  }
  return null
}

export default async function AccountOverviewPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser('/account')
  const [params, profile, recent] = await Promise.all([searchParams, getCurrentProfile(), getMyOrders({ pageSize: 3 })])
  const notice = overviewNotice(params)

  return (
    <div className="grid gap-6">
      {notice && <Notice tone="success">{notice}</Notice>}
      <p className="max-w-2xl leading-7 text-muted-foreground">
        Follow your orders, revisit the pieces you have saved and keep your details up to date.
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>Your latest purchases and where they are.</CardDescription>
            </div>
            {recent.orders.length > 0 && (
              <Link href="/account/orders" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-10' })}>
                View all
              </Link>
            )}
          </CardHeader>
          {recent.orders.length > 0 ? (
            <OrderList orders={recent.orders} />
          ) : (
            <EmptyState
              icon={<Package />}
              title="No orders yet"
              description="Once you place an order, you can follow it from here."
              action={
                <Link href="/shop" className={buttonVariants()}>
                  Start shopping
                </Link>
              }
              className="py-10"
            />
          )}
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Your details</CardTitle>
              <CardDescription>Used for order updates and deliveries.</CardDescription>
            </div>
          </CardHeader>
          <ProfileForm
            profile={{
              full_name: profile?.full_name ?? null,
              phone: profile?.phone ?? null,
              marketing_opt_in: profile?.marketing_opt_in ?? false,
            }}
          />
          <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
            Signed in as <span className="break-all text-foreground">{user.email}</span>.{' '}
            <Link href="/account/settings" className="inline-flex min-h-10 items-center font-medium text-clay hover:underline">
              Change email or password
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
