import type { Metadata } from 'next'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { DiscountForm } from '@/components/admin/discounts/discount-form'
import { Card } from '@/components/ui/card'
import { requireAdmin } from '@/lib/auth'
import { getStoreSettings } from '@/lib/data/settings'

export const metadata: Metadata = {
  title: 'New discount code',
}

export default async function NewDiscountPage() {
  await requireAdmin()
  const settings = await getStoreSettings()

  return (
    <>
      <AdminPageHeader
        backHref="/admin/discounts"
        backLabel="All discounts"
        title="New discount code"
        description="Customers type the code in their cart. It is checked again on the server at checkout."
      />
      <Card className="max-w-3xl">
        <DiscountForm currency={settings.currency} />
      </Card>
    </>
  )
}
