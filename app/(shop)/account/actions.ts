'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import {
  newPasswordFields,
  passwordsMatch,
  passwordsMatchError,
  passwordUpdateError,
} from '@/app/(shop)/(auth)/password'
import type { FormState } from '@/components/auth/form-state'
import {
  actionError,
  actionSuccess,
  actionValidationError,
  formDataToObject,
  NOT_CONFIGURED_MESSAGE,
  type ActionState,
} from '@/lib/actions'
import { getCurrentProfile, getCurrentUser } from '@/lib/auth'
import { isSupabaseConfigured, siteUrl } from '@/lib/env'
import { isSupabaseAdminConfigured } from '@/lib/env.server'
import { rateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { checkboxField, emailField, optionalText } from '@/lib/validation'

/*
 * Actions for the signed-in customer's own account. Each one checks the
 * session itself (server actions are public endpoints) and only ever touches
 * the current user's data; no ids are accepted from the browser.
 */

export type ProfileFormState = FormState<{ full_name: string; phone: string; marketing_opt_in: boolean }>
export type ChangeEmailState = FormState<{ email: string }>

const SIGNED_OUT_MESSAGE = 'Your session has ended. Please sign in again.'
const FIX_FIELDS_MESSAGE = 'Please fix the highlighted fields.'

// ---------------------------------------------------------------------------
// Profile details
// ---------------------------------------------------------------------------
const PHONE_PATTERN = /^[+()\d\s.-]{6,40}$/

const profileSchema = z.object({
  full_name: optionalText(120),
  phone: optionalText(40).refine((phone) => phone === null || PHONE_PATTERN.test(phone), 'Enter a valid phone number.'),
  marketing_opt_in: checkboxField,
})

export async function updateProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  if (!isSupabaseConfigured) return actionError(NOT_CONFIGURED_MESSAGE)
  const user = await getCurrentUser()
  if (!user) return actionError(SIGNED_OUT_MESSAGE)

  const values = {
    full_name: String(formData.get('full_name') ?? '').slice(0, 120),
    phone: String(formData.get('phone') ?? '').slice(0, 40),
    marketing_opt_in: formData.get('marketing_opt_in') === 'on',
  }
  const parsed = profileSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return { ...actionValidationError(parsed.error), values }

  // The database only lets customers update these three profile columns.
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update(parsed.data).eq('id', user.id)
  if (error) {
    console.error('[account] profile update failed', error.message)
    return { ...actionError('We could not save your details. Please try again.'), values }
  }

  revalidatePath('/account', 'layout')
  return {
    ...actionSuccess('Your details have been saved.'),
    values: {
      full_name: parsed.data.full_name ?? '',
      phone: parsed.data.phone ?? '',
      marketing_opt_in: parsed.data.marketing_opt_in,
    },
  }
}

// ---------------------------------------------------------------------------
// Change email
// ---------------------------------------------------------------------------
const changeEmailSchema = z.object({ email: emailField })

export async function changeEmail(_prev: ChangeEmailState, formData: FormData): Promise<ChangeEmailState> {
  if (!isSupabaseConfigured) return actionError(NOT_CONFIGURED_MESSAGE)
  const user = await getCurrentUser()
  if (!user) return actionError(SIGNED_OUT_MESSAGE)

  const values = { email: String(formData.get('email') ?? '').slice(0, 254) }
  const parsed = changeEmailSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return { ...actionValidationError(parsed.error), values }

  const { email } = parsed.data
  if (email === user.email?.toLowerCase()) {
    return { ...actionError(FIX_FIELDS_MESSAGE, { email: ['That is already your email address.'] }), values }
  }

  if (!(await rateLimit(`email-change:${user.id}`, 5, 3600))) {
    return { ...actionError('Too many attempts. Please try again in an hour.'), values }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent('/account?email=confirmed')}` },
  )

  if (error) {
    if (error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit') {
      return { ...actionError('We are sending a lot of emails right now. Please try again in a few minutes.'), values }
    }
    // An address that belongs to someone else gets the normal reply, so this form cannot be used to look up accounts.
    if (error.code !== 'email_exists' && error.code !== 'user_already_exists') {
      console.error('[account] email change failed', error.code ?? error.message)
      return { ...actionError('We could not start the email change. Please try again.'), values }
    }
  }

  return actionSuccess(
    `Almost done. We sent a confirmation link to both your current address and ${email}. Your email changes once the links are confirmed.`,
  )
}

// ---------------------------------------------------------------------------
// Change password
// ---------------------------------------------------------------------------
const changePasswordSchema = z
  .object({
    current_password: z.string({ error: 'Enter your current password.' }).min(1, 'Enter your current password.').max(200),
    ...newPasswordFields,
  })
  .refine(passwordsMatch, passwordsMatchError)

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return actionError(NOT_CONFIGURED_MESSAGE)
  const user = await getCurrentUser()
  if (!user?.email) return actionError(SIGNED_OUT_MESSAGE)

  const parsed = changePasswordSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionValidationError(parsed.error)

  // Limits guessing of the current password from a session left open on a shared computer.
  if (!(await rateLimit(`password-change:${user.id}`, 5, 900))) {
    return actionError('Too many attempts. Please wait 15 minutes and try again.')
  }

  // Re-check the current password so an unattended, signed-in browser cannot lock the owner out.
  const supabase = await createClient()
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current_password,
  })
  if (verifyError) {
    if (verifyError.code === 'invalid_credentials') {
      return actionError(FIX_FIELDS_MESSAGE, { current_password: ['Your current password is incorrect.'] })
    }
    console.error('[account] current password check failed', verifyError.code ?? verifyError.message)
    return actionError('We could not update your password. Please try again.')
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return passwordUpdateError(error)

  return actionSuccess('Your password has been updated.')
}

// ---------------------------------------------------------------------------
// Delete account
// ---------------------------------------------------------------------------
const deleteAccountSchema = z.object({
  confirmation: z
    .string({ error: 'Type DELETE to confirm.' })
    .trim()
    .refine((value) => value === 'DELETE', 'Type DELETE in capital letters to confirm.'),
})

export async function deleteAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return actionError(NOT_CONFIGURED_MESSAGE)
  const user = await getCurrentUser()
  if (!user) return actionError(SIGNED_OUT_MESSAGE)

  const parsed = deleteAccountSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionValidationError(parsed.error)

  if (!isSupabaseAdminConfigured) {
    return actionError('Online account deletion is not available yet. Please contact us and we will delete it for you.')
  }

  // Protects the store from losing its only admin by accident.
  const profile = await getCurrentProfile()
  if (profile?.role === 'admin') {
    return actionError('Admin accounts cannot be deleted here. Remove the admin role in Supabase first.')
  }

  // Deleting the auth user removes the profile, wishlist and reviews. Orders stay
  // for the store's records (orders.user_id is ON DELETE SET NULL).
  const { error } = await createAdminClient().auth.admin.deleteUser(user.id)
  if (error) {
    console.error('[account] account deletion failed', error.message)
    return actionError('We could not delete your account. Please try again or contact us.')
  }

  // Clears the session cookies. The user no longer exists, so Supabase's 404 here is expected and ignored.
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'local' })

  revalidatePath('/', 'layout')
  redirect('/login?deleted=1')
}
