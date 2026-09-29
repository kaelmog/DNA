import { CartAccountSync } from '@/components/cart/cart-account-sync'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { getCurrentUser } from '@/lib/auth'

/** Layout for every customer-facing page: header, main content, footer. */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // Cached per request, so the header's own lookup does not hit Supabase again.
  const user = await getCurrentUser()

  return (
    <div className="flex min-h-dvh flex-col">
      <CartAccountSync userId={user?.id ?? null} />
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
