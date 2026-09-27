import 'server-only'

import type { AuthError } from '@supabase/supabase-js'
import { z } from 'zod'

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/components/auth/password-rules'
import { actionError, type ActionState } from '@/lib/actions'

/**
 * Password validation shared by sign-up, password reset and account settings.
 * Passwords are never trimmed: spaces are valid characters.
 */
export const passwordField = z
  .string({ error: 'Enter a password.' })
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Use ${PASSWORD_MAX_LENGTH} characters or fewer.`)

/** Spread into a z.object() for "new password + confirm" forms, then add `.refine(passwordsMatch, passwordsMatchError)`. */
export const newPasswordFields = {
  password: passwordField,
  confirm_password: z.string({ error: 'Please confirm your password.' }),
}

export function passwordsMatch(data: { password: string; confirm_password: string }) {
  return data.password === data.confirm_password
}

export const passwordsMatchError = { error: 'Passwords do not match.', path: ['confirm_password'] }

/** Friendly messages for the errors Supabase returns from updateUser({ password }). */
export function passwordUpdateError(error: AuthError): ActionState {
  switch (error.code) {
    case 'same_password':
      return actionError('Please fix the highlighted fields.', {
        password: ['Choose a password that is different from your current one.'],
      })
    case 'weak_password':
      return actionError('Please fix the highlighted fields.', {
        password: ['That password is too easy to guess. Try a longer one, or add numbers and symbols.'],
      })
    case 'reauthentication_needed':
    case 'session_expired':
    case 'session_not_found':
      return actionError('For your security, please sign out, sign in again and then change your password.')
    default:
      console.error('[auth] password update failed', error.code ?? error.message)
      return actionError('We could not update your password. Please try again.')
  }
}
