import Link from 'next/link'

import { Notice } from '@/components/auth/notice'
import { Container } from '@/components/ui/misc'
import { isSupabaseConfigured } from '@/lib/env'

/**
 * Centers the sign-in, sign-up and password cards (served at /login, /signup,
 * /forgot-password and /reset-password; the (auth) folder is not in the URL).
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-linear-to-b from-linen/70 to-background">
      <Container className="flex justify-center py-10 sm:py-16 lg:py-24">
        <div className="grid w-full max-w-md gap-4">
          {!isSupabaseConfigured && (
            <Notice tone="info">
              Customer accounts switch on once the store database is connected.{' '}
              <Link href="/todo" className="font-medium underline underline-offset-4">
                Open the setup checklist
              </Link>
              .
            </Notice>
          )}
          {children}
        </div>
      </Container>
    </div>
  )
}
