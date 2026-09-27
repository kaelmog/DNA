'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { signIn, type SignInState } from '@/app/(shop)/(auth)/actions'
import { authLinkClassName } from '@/components/auth/auth-card'
import { PasswordField } from '@/components/auth/password-field'
import { ResendConfirmationForm } from '@/components/auth/resend-confirmation-form'
import { TextField } from '@/components/auth/text-field'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { initialActionState } from '@/lib/actions'
import { cn } from '@/lib/utils'

/** Email + password sign-in. `next` is the already-sanitised page to return to afterwards. */
export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<SignInState, FormData>(signIn, initialActionState)

  return (
    <div className="grid gap-6">
      <form action={formAction} className="grid gap-5">
        <input type="hidden" name="next" value={next} />
        <TextField
          id="login-email"
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
        <div className="grid gap-1">
          <PasswordField
            id="login-password"
            name="password"
            label="Password"
            autoComplete="current-password"
            required
            errors={state.fieldErrors?.password}
          />
          <Link href="/forgot-password" className={cn(authLinkClassName, 'justify-self-end text-sm')}>
            Forgot password?
          </Link>
        </div>
        <FormMessage state={state} />
        <SubmitButton size="lg" className="w-full" pendingText="Signing in…">
          Sign in
        </SubmitButton>
      </form>

      {state.needsConfirmation && <ResendConfirmationForm email={state.values?.email ?? ''} />}
    </div>
  )
}
