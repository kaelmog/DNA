import { LogOut } from 'lucide-react'

import { AccountNav } from '@/components/account/account-nav'
import { buttonVariants } from '@/components/ui/button'
import { Container } from '@/components/ui/misc'
import { getCurrentProfile, requireUser } from '@/lib/auth'

/**
 * Shell for every /account page: greeting (the page's h1), tabs and sign-out.
 * Pages still call requireUser() themselves, because a layout does not re-run
 * on every navigation and never protects server actions.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('/account')
  const profile = await getCurrentProfile()
  const firstName = profile?.full_name?.trim().split(/\s+/)[0]

  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      <header className="mb-6 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow mb-3">My account</p>
          <h1 className="font-serif text-3xl leading-tight tracking-tight break-words sm:text-4xl lg:text-5xl">
            {firstName ? `Hello, ${firstName}` : 'Your account'}
          </h1>
          <p className="mt-2 text-sm break-all text-muted-foreground">{user.email}</p>
        </div>
        {/* A plain form POST so signing out works even before JavaScript loads. */}
        <form action="/auth/signout" method="post" className="shrink-0">
          <button type="submit" className={buttonVariants({ variant: 'outline', className: 'w-full sm:w-auto' })}>
            <LogOut aria-hidden="true" />
            Sign out
          </button>
        </form>
      </header>

      <AccountNav />

      <div className="mt-8 sm:mt-10">{children}</div>
    </Container>
  )
}
