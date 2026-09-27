'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import {
  actionError,
  actionSuccess,
  actionValidationError,
  formDataToObject,
  NOT_CONFIGURED_MESSAGE,
  type ActionState,
} from '@/lib/actions'
import { isSupabaseAdminConfigured } from '@/lib/env.server'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailField } from '@/lib/validation'

/** Same answer for new and existing subscribers, so the form never reveals who is on the list. */
const SUBSCRIBED_MESSAGE = "Thanks! You're on the list."

const newsletterSchema = z.object({
  email: emailField,
  // Where the form was shown ("footer", "about"...). Anything unexpected is stored as null.
  source: z
    .string()
    .nullish()
    .transform((value) => (value && /^[a-z0-9-]{1,60}$/.test(value) ? value : null)),
})

/** Newsletter signup (footer form). Public: no sign-in needed. */
export async function subscribeToNewsletter(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseAdminConfigured) return actionError(NOT_CONFIGURED_MESSAGE)

  // Bots fill the hidden "website" field. Pretend it worked so they move on.
  if (formData.get('website')) return actionSuccess(SUBSCRIBED_MESSAGE)

  const parsed = newsletterSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionValidationError(parsed.error, 'Please enter a valid email address.')

  const ip = await getClientIp()
  if (!(await rateLimit(`newsletter:${ip}`, 5, 3600))) {
    return actionError('Too many attempts from your connection. Please try again in an hour.')
  }

  // Upsert: signing up again simply re-subscribes an address that had unsubscribed.
  const { error } = await createAdminClient()
    .from('newsletter_subscribers')
    .upsert({ email: parsed.data.email, status: 'subscribed', source: parsed.data.source }, { onConflict: 'email' })

  if (error) {
    console.error('[newsletter] subscribe failed', error.message)
    return actionError('We could not sign you up right now. Please try again in a moment.')
  }

  revalidatePath('/admin/subscribers')
  return actionSuccess(SUBSCRIBED_MESSAGE)
}
