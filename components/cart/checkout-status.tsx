import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'

/**
 * Centered message for the success page when there is no confirmed order to
 * show (unknown link, unpaid or expired checkout, payments not set up).
 */
export function CheckoutStatus({
  icon,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
}: {
  icon: React.ReactNode
  eyebrow: string
  title: string
  description: React.ReactNode
  primaryAction: { href: string; label: string }
  secondaryAction?: { href: string; label: string }
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center text-center">
      <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-linen text-clay [&_svg]:size-6">{icon}</div>
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link href={primaryAction.href} className={buttonVariants({ size: 'lg' })}>
          {primaryAction.label}
        </Link>
        {secondaryAction && (
          <Link href={secondaryAction.href} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            {secondaryAction.label}
          </Link>
        )}
      </div>
    </div>
  )
}
