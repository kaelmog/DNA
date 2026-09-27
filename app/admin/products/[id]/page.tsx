import { ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { DeleteProductCard } from '@/components/admin/products/delete-product-card'
import { ProductCreatedBanner } from '@/components/admin/products/product-created-banner'
import { ProductForm } from '@/components/admin/products/product-form'
import { StatusBadge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { isCurrentUserAdmin, requireAdmin } from '@/lib/auth'
import { PRODUCT_STATUS } from '@/lib/constants'
import { getAdminProduct, getAllCategories } from '@/lib/data/admin/catalog'
import { getStoreSettings } from '@/lib/data/settings'
import { formatDateTime } from '@/lib/format'
import { uuidField } from '@/lib/validation'

interface ProductPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  // Only look the product up for admins; everyone else gets a 404 from the page anyway.
  const product = uuidField.safeParse(id).success && (await isCurrentUserAdmin()) ? await getAdminProduct(id) : null
  return { title: product ? product.name : 'Edit product' }
}

export default async function EditProductPage({ params, searchParams }: ProductPageProps) {
  await requireAdmin()

  const { id } = await params
  if (!uuidField.safeParse(id).success) notFound()

  const [product, categories, settings, query] = await Promise.all([
    getAdminProduct(id),
    getAllCategories(),
    getStoreSettings(),
    searchParams,
  ])
  if (!product) notFound()

  return (
    <>
      <AdminPageHeader
        backHref="/admin/products"
        backLabel="All products"
        title={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="min-w-0 wrap-anywhere">{product.name}</span>
            <StatusBadge meta={PRODUCT_STATUS[product.status]} />
          </span>
        }
        description={`Last updated ${formatDateTime(product.updated_at)}`}
        actions={
          product.status === 'active' ? (
            <Link
              href={`/products/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline' })}
            >
              <ExternalLink aria-hidden="true" /> View in store
              <span className="sr-only"> (opens in a new tab)</span>
            </Link>
          ) : undefined
        }
      />

      {query.created === '1' && <ProductCreatedBanner status={product.status} />}

      <div className="grid gap-8">
        <ProductForm product={product} categories={categories} currency={settings.currency} />
        <DeleteProductCard productId={product.id} productName={product.name} />
      </div>
    </>
  )
}
