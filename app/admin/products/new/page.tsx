import type { Metadata } from 'next'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { ProductForm } from '@/components/admin/products/product-form'
import { requireAdmin } from '@/lib/auth'
import { getAllCategories } from '@/lib/data/admin/catalog'
import { getStoreSettings } from '@/lib/data/settings'

export const metadata: Metadata = {
  title: 'New product',
}

export default async function NewProductPage() {
  await requireAdmin()

  const [categories, settings] = await Promise.all([getAllCategories(), getStoreSettings()])

  return (
    <>
      <AdminPageHeader
        backHref="/admin/products"
        backLabel="All products"
        title="New product"
        description="Add photos, prices and stock. The product stays hidden from the shop until you set it to Active."
      />
      <ProductForm categories={categories} currency={settings.currency} />
    </>
  )
}
