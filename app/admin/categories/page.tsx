import { FolderTree, Plus } from 'lucide-react'
import type { Metadata } from 'next'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { CategoryForm } from '@/components/admin/categories/category-form'
import { CategoryListItem } from '@/components/admin/categories/category-list-item'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/misc'
import { requireAdmin } from '@/lib/auth'
import { getCategoriesWithCounts, type CategoryWithCount } from '@/lib/data/admin/catalog'
import { pluralize } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Categories',
}

function headerDescription(categories: CategoryWithCount[]) {
  if (categories.length === 0) return 'Group your products so shoppers can browse the shop by type.'
  const hidden = categories.filter((category) => !category.is_active).length
  return `${pluralize(categories.length, 'category', 'categories')}${hidden ? `, ${hidden} hidden` : ''}. Shoppers use them to browse the shop.`
}

export default async function AdminCategoriesPage() {
  await requireAdmin()

  const categories = await getCategoriesWithCounts()
  // New categories go after the last one unless the admin picks another position.
  const nextPosition = categories.reduce((highest, category) => Math.max(highest, category.position), 0) + 1

  return (
    <>
      <AdminPageHeader
        title="Categories"
        description={headerDescription(categories)}
        actions={
          // The form sits below the list on phones and tablets; this jumps to it.
          <a href="#new-category" className={buttonVariants({ variant: 'accent', className: 'lg:hidden' })}>
            <Plus aria-hidden="true" /> New category
          </a>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <section aria-labelledby="category-list-heading" className="min-w-0 lg:col-span-2">
          <h2 id="category-list-heading" className="sr-only">
            All categories
          </h2>
          {categories.length > 0 ? (
            <ul className="grid gap-3">
              {categories.map((category) => (
                <CategoryListItem key={category.id} category={category} />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<FolderTree />}
              title="No categories yet"
              description="Categories such as Wall hangings or Plant hangers help shoppers find what they are looking for. Add your first one with the form."
            />
          )}
        </section>

        <Card id="new-category" className="min-w-0 scroll-mt-20 lg:sticky lg:top-6">
          <CardHeader>
            <div>
              <CardTitle>New category</CardTitle>
              <CardDescription>Visible categories appear in the shop&apos;s filters.</CardDescription>
            </div>
          </CardHeader>
          <CategoryForm defaultPosition={nextPosition} />
        </Card>
      </div>
    </>
  )
}
