'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { signUp, type SignUpState } from '@/app/(shop)/(auth)/actions'
import { CheckInbox } from '@/components/auth/check-inbox'
import { PasswordField } from '@/components/auth/password-field'
import { PASSWORD_HINT, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/components/auth/password-rules'
import { TextField } from '@/components/auth/text-field'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { Checkbox } from '@/components/ui/input'
import { initialActionState } from '@/lib/actions'

const legalLinkClassName = 'font-medium text-foreground underline underline-offset-4 hover:text-clay'

/** Create-account form. After a successful sign-up it becomes a "check your inbox" message. */
export function SignupForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<SignUpState, FormData>(signUp, initialActionState)

  if (state.ok) return <CheckInbox message={state.message} email={state.values?.email} />

  return (
    <form action={formAction} className="grid gap-5">
      {next && <input type="hidden" name="next" value={next} />}
      <TextField
        id="signup-name"
        name="full_name"
        label="Full name"
        autoComplete="name"
        required
        maxLength={120}
        defaultValue={state.values?.full_name}
        errors={state.fieldErrors?.full_name}
      />
      <TextField
        id="signup-email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        inputMode="email"
        required
        maxLength={254}
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />
      <PasswordField
        id="signup-password"
        name="password"
        label="Password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
        maxLength={PASSWORD_MAX_LENGTH}
        hint={PASSWORD_HINT}
        errors={state.fieldErrors?.password}
      />
      <PasswordField
        id="signup-confirm-password"
        name="confirm_password"
        label="Confirm password"
        autoComplete="new-password"
        required
        maxLength={PASSWORD_MAX_LENGTH}
        errors={state.fieldErrors?.confirm_password}
      />
      <label htmlFor="signup-marketing" className="flex min-h-10 cursor-pointer items-start gap-3 text-sm leading-6">
        <Checkbox
          id="signup-marketing"
          name="marketing_opt_in"
          defaultChecked={state.values?.marketing_opt_in}
          className="mt-1"
        />
        <span>Email me about new pieces, restocks and studio news. You can unsubscribe at any time.</span>
      </label>

      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText="Creating your account…">
        Create account
      </SubmitButton>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        By creating an account you agree to our{' '}
        <Link href="/terms" className={legalLinkClassName}>
          Terms of service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className={legalLinkClassName}>
          Privacy policy
        </Link>
        .
      </p>
    </form>
  )
}
