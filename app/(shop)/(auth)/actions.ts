'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { applyPendingMarketingOptIn, PENDING_OPT_IN_KEY } from '@/app/auth/marketing-opt-in'
import { safeNextPath } from '@/app/auth/redirects'
import type { FormState } from '@/components/auth/form-state'
import {
  actionError,
  actionSuccess,
  actionValidationError,
  formDataToObject,
  NOT_CONFIGURED_MESSAGE,
  type ActionState,
} from '@/lib/actions'
import { getCurrentUser } from '@/lib/auth'
import { isSupabaseConfigured, siteUrl } from '@/lib/env'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { checkboxField, emailField, requiredText } from '@/lib/validation'

import { newPasswordFields, passwordsMatch, passwordsMatchError, passwordUpdateError } from './password'

/*
 * Sign-in, sign-up and password-reset actions. They run for signed-out
 * visitors, so instead of an auth check they are rate limited per IP.
 * Messages never reveal whether an email address has an account.
 */

export type SignInState = FormState<{ email: string }> & { needsConfirmation?: boolean }
export type SignUpState = FormState<{ full_name: string; email: string; marketing_opt_in: boolean }>
export type EmailFormState = FormState<{ email: string }>

const TOO_MANY_ATTEMPTS = 'Too many attempts. Please wait a few minutes and try again.'
const CHECK_INBOX_MESSAGE =
  'Check your inbox to confirm your email. If you already have an account, you can sign in or reset your password instead.'
const RESET_SENT_MESSAGE =
  'If an account exists for that email, a link to reset your password is on its way. It can take a few minutes to arrive.'

const emailOnlySchema = z.object({ email: emailField })

/** A submitted text value to refill the form with (never used for passwords). */
function submittedText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.slice(0, 254) : ''
}

/** The link Supabase puts in its emails. /auth/callback signs the user in, then forwards to `next`. */
function emailCallbackUrl(next: string) {
  return `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`
}

// ---------------------------------------------------------------------------
// Sign in
// ---------------------------------------------------------------------------
const signInSchema = z.object({
  email: emailField,
  // No length rules here: they belong to sign-up, and older accounts may predate them.
  password: z.string({ error: 'Enter your password.' }).min(1, 'Enter your password.').max(200),
})

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  if (!isSupabaseConfigured) return actionError(NOT_CONFIGURED_MESSAGE)

  const values = { email: submittedText(formData, 'email') }
  const parsed = signInSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return { ...actionValidationError(parsed.error), values }

  if (!(await rateLimit(`login:${await getClientIp()}`, 10, 600))) {
    return { ...actionError(TOO_MANY_ATTEMPTS), values }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    if (error.code === 'email_not_confirmed') {
      return {
        ...actionError('Please confirm your email address first. Use the link we emailed you, or send a new one below.'),
        values,
        needsConfirmation: true,
      }
    }
    if (error.code === 'over_request_rate_limit') return { ...actionError(TOO_MANY_ATTEMPTS), values }
    if (error.code !== 'invalid_credentials') console.error('[auth] sign in failed', error.code ?? error.message)
    return { ...actionError('Email or password is incorrect.'), values }
  }

  // Refresh every cached page so the header and account links reflect the new session.
  revalidatePath('/', 'layout')
  redirect(safeNextPath(formData.get('next'), '/account'))
}

// ---------------------------------------------------------------------------
// Sign up
// ---------------------------------------------------------------------------
const signUpSchema = z
  .object({
    full_name: requiredText('Full name', 120),
    email: emailField,
    ...newPasswordFields,
    marketing_opt_in: checkboxField,
  })
  .refine(passwordsMatch, passwordsMatchError)

export async function signUp(_prev: SignUpState, formData: FormData): Promise<SignUpState> {
  if (!isSupabaseConfigured) return actionError(NOT_CONFIGURED_MESSAGE)

  const values = {
    full_name: submittedText(formData, 'full_name'),
    email: submittedText(formData, 'email'),
    marketing_opt_in: formData.get('marketing_opt_in') === 'on',
  }
  const parsed = signUpSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return { ...actionValidationError(parsed.error), values }

  if (!(await rateLimit(`signup:${await getClientIp()}`, 5, 3600))) {
    return { ...actionError(TOO_MANY_ATTEMPTS), values }
  }

  const { full_name, email, password, marketing_opt_in } = parsed.data
  const next = safeNextPath(formData.get('next'), '/account?welcome=1')
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // full_name is copied into the profile by a database trigger; the opt-in is applied after confirmation.
      data: { full_name, ...(marketing_opt_in ? { [PENDING_OPT_IN_KEY]: true } : {}) },
      emailRedirectTo: emailCallbackUrl(next),
    },
  })

  if (error) {
    switch (error.code) {
      case 'user_already_exists':
      case 'email_exists':
        // Same answer as a brand-new sign-up, so the form never reveals who has an account.
        return { ...actionSuccess(CHECK_INBOX_MESSAGE), values: { email } }
      case 'weak_password':
        return {
          ...actionError('Please fix the highlighted fields.', {
            password: ['That password is too easy to guess. Try a longer one, or add numbers and symbols.'],
          }),
          values,
        }
      case 'email_address_invalid':
        return { ...actionError('Please fix the highlighted fields.', { email: ['Enter a valid email address.'] }), values }
      case 'over_email_send_rate_limit':
      case 'over_request_rate_limit':
        return { ...actionError('We are sending a lot of emails right now. Please try again in a few minutes.'), values }
      case 'signup_disabled':
        return { ...actionError('New accounts are paused right now. Please check back soon.'), values }
      default:
        console.error('[auth] sign up failed', error.code ?? error.message)
        return { ...actionError('We could not create your account. Please try again.'), values }
    }
  }

  // A session only comes back when email confirmation is switched off in Supabase.
  if (data.session) {
    await applyPendingMarketingOptIn(supabase, data.user)
    revalidatePath('/', 'layout')
    redirect(next)
  }

  return { ...actionSuccess(CHECK_INBOX_MESSAGE), values: { email } }
}

// ---------------------------------------------------------------------------
// Resend the sign-up confirmation email
// ---------------------------------------------------------------------------
export async function resendConfirmation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return actionError(NOT_CONFIGURED_MESSAGE)

  const parsed = emailOnlySchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionError('Enter your email address in the sign-in form first.')

  if (!(await rateLimit(`resend:${await getClientIp()}`, 3, 3600))) return actionError(TOO_MANY_ATTEMPTS)

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: parsed.data.email,
    options: { emailRedirectTo: emailCallbackUrl('/account?welcome=1') },
  })
  if (error) console.error('[auth] resend confirmation failed', error.code ?? error.message)

  return actionSuccess('If that account still needs confirming, a new link is on its way.')
}

// ---------------------------------------------------------------------------
// Forgot password: email a reset link
// ---------------------------------------------------------------------------
export async function requestPasswordReset(_prev: EmailFormState, formData: FormData): Promise<EmailFormState> {
  if (!isSupabaseConfigured) return actionError(NOT_CONFIGURED_MESSAGE)

  const values = { email: submittedText(formData, 'email') }
  const parsed = emailOnlySchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return { ...actionValidationError(parsed.error), values }

  if (!(await rateLimit(`reset:${await getClientIp()}`, 5, 3600))) {
    return { ...actionError('Too many reset requests. Please try again in an hour.'), values }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: emailCallbackUrl('/reset-password'),
  })
  // Always the same answer, success or not, so nobody can probe which emails have accounts.
  if (error) console.error('[auth] password reset email failed', error.code ?? error.message)

  return { ...actionSuccess(RESET_SENT_MESSAGE), values }
}

// ---------------------------------------------------------------------------
// Reset password: set a new one after following the emailed link
// ---------------------------------------------------------------------------
const resetPasswordSchema = z.object(newPasswordFields).refine(passwordsMatch, passwordsMatchError)

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return actionError(NOT_CONFIGURED_MESSAGE)

  // The reset link signed the user in; without that session the link has expired.
  const user = await getCurrentUser()
  if (!user) return actionError('This reset link has expired. Please request a new one.')

  const parsed = resetPasswordSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionValidationError(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return passwordUpdateError(error)

  revalidatePath('/', 'layout')
  redirect('/account?password=updated')
}
