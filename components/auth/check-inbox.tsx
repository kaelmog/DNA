'use client'

import { MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { buttonVariants } from '@/components/ui/button'

/**
 * Shown in place of a form once an email has been sent (sign-up, password reset).
 * Focus moves to the heading because the submit button the user pressed is gone.
 */
export function CheckInbox({ message, email }: { message?: string; email?: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div role="status" className="grid justify-items-center gap-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-sand text-clay-dark">
        <MailCheck className="size-6" aria-hidden="true" />
      </span>
      <h2 ref={headingRef} tabIndex={-1} className="font-serif text-2xl tracking-tight outline-none">
        Check your inbox
      </h2>
      {email && <p className="text-sm font-medium break-all">{email}</p>}
      {message && <p className="text-sm leading-6 text-muted-foreground">{message}</p>}
      <p className="text-xs leading-5 text-muted-foreground">
        Nothing after a few minutes? Check your spam or promotions folder.
      </p>
      <Link href="/login" className={buttonVariants({ variant: 'outline', className: 'mt-2 w-full' })}>
        Back to sign in
      </Link>
    </div>
  )
}
