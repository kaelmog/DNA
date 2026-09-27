import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { deleteDiscount } from '@/app/admin/discounts/actions'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { ActionButton } from '@/components/admin/confirm-button'
import { DiscountForm } from '@/components/admin/discounts/discount-form'
import { StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { isCurrentUserAdmin, requireAdmin } from '@/lib/auth'
import { DISCOUNT_STATE, getDiscountCode, getDiscountState } from '@/lib/data/admin/discounts'
import { getStoreSettings } from '@/lib/data/settings'
import { formatDate, pluralize } from '@/lib/format'
import { uuidField } from '@/lib/validation'

interface DiscountPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: DiscountPageProps): Promise<Metadata> {
  const { id } = await params
  // Only look the code up for admins; everyone else gets a 404 from the page anyway.
  const discount = uuidField.safeParse(id).success && (await isCurrentUserAdmin()) ? await getDiscountCode(id) : null
  return { title: discount ? `Discount ${discount.code}` : 'Discount code' }
}

export default async function DiscountPage({ params }: DiscountPageProps) {
  await requireAdmin()

  const { id } = await params
  if (!uuidField.safeParse(id).success) notFound()

  const [discount, settings] = await Promise.all([getDiscountCode(id), getStoreSettings()])
  if (!discount) notFound()

  const state = getDiscountState(discount, new Date())
  const usage = `Used ${pluralize(discount.times_redeemed, 'time')}${
    discount.max_redemptions ? ` of ${discount.max_redemptions}` : ''
  } · created ${formatDate(discount.created_at)}`

  return (
    <>
      <AdminPageHeader
        backHref="/admin/discounts"
        backLabel="All discounts"
        title={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono break-all">{discount.code}</span>
            <StatusBadge meta={DISCOUNT_STATE[state]} />
          </span>
        }
        description={usage}
        actions={
          // Pausing a code is the "Active" checkbox in the form, so the form never shows a stale value.
          discount.times_redeemed === 0 ? (
            <ActionButton
              action={deleteDiscount}
              fields={{ id: discount.id, redirectTo: 'list' }}
              confirm={`Delete ${discount.code}? This cannot be undone.`}
              variant="destructive"
              pendingText="Deleting…"
            >
              Delete code
            </ActionButton>
          ) : undefined
        }
      />
      <Card className="max-w-3xl">
        <DiscountForm discount={discount} currency={settings.currency} />
      </Card>
    </>
  )
}
