import { Mail, PackageCheck, UserRound } from 'lucide-react'
import Link from 'next/link'

/**
 * "What happens next" card on the order confirmation page. `awaitingPayment`
 * is for manual-payment orders: nothing is paid yet, so the steps say that
 * payment details follow by email and shipping waits for payment.
 */
export function OrderNextSteps({
  email,
  isSignedIn,
  awaitingPayment = false,
}: {
  email: string | null
  isSignedIn: boolean
  awaitingPayment?: boolean
}) {
  const emailAddress = email ? <strong className="font-semibold break-all">{email}</strong> : null

  return (
    <section aria-labelledby="next-steps-heading" className="rounded-3xl bg-linen/70 p-5 sm:p-7">
      <h2 id="next-steps-heading" className="font-serif text-2xl tracking-tight">
        What happens next
      </h2>
      <ul className="mt-5 grid gap-5 text-sm leading-6">
        <li className="flex gap-3">
          <Mail className="mt-0.5 size-5 shrink-0 text-clay" aria-hidden="true" />
          {awaitingPayment ? (
            <span>
              Keep an eye on {emailAddress ?? 'your inbox'}: that’s where we’ll send payment details and updates about
              your order.
            </span>
          ) : (
            <span>
              {emailAddress ? <>A confirmation is on its way to {emailAddress}.</> : 'A confirmation email is on its way.'}
            </span>
          )}
        </li>
        <li className="flex gap-3">
          <PackageCheck className="mt-0.5 size-5 shrink-0 text-clay" aria-hidden="true" />
          <span>
            {awaitingPayment
              ? 'Once your payment arrives, we pack every piece by hand and email you tracking details as soon as it ships.'
              : 'We pack every piece by hand and email you tracking details as soon as your order ships.'}
          </span>
        </li>
        <li className="flex gap-3">
          <UserRound className="mt-0.5 size-5 shrink-0 text-clay" aria-hidden="true" />
          {isSignedIn ? (
            <span>
              You can follow this order any time from{' '}
              <Link href="/account/orders" className="font-medium text-clay underline underline-offset-4">
                your orders
              </Link>
              .
            </span>
          ) : (
            <span>
              <Link href="/signup" className="font-medium text-clay underline underline-offset-4">
                Create an account
              </Link>{' '}
              with {email ? 'the same email' : 'your checkout email'} to see this order and track future ones.
            </span>
          )}
        </li>
      </ul>
    </section>
  )
}
