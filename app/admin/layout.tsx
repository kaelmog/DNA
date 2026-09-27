import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminNav } from '@/components/admin/admin-nav'
import { buttonVariants } from '@/components/ui/button'
import { requireAdmin } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/env'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  robots: { index: false, follow: false },
}

/**
 * Admin shell. Only admins get past requireAdmin() (others see a 404).
 * Every admin page and server action ALSO calls requireAdmin() itself,
 * because layouts do not protect server actions or data requests.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return (
      <main id="main-content" className="flex min-h-dvh items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="font-serif text-3xl">Connect Supabase first</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The admin area needs a database. Add your Supabase keys, run the schema, then sign in with an admin
            account.
          </p>
          <Link href="/todo" className={buttonVariants({ className: 'mt-6' })}>
            Open the setup checklist
          </Link>
        </div>
      </main>
    )
  }

  const profile = await requireAdmin()

  return (
    <div className="min-h-dvh bg-background lg:flex">
      <AdminNav email={profile.email} />
      <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
