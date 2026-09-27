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
import { notifyAdmin } from '@/lib/email'
import { contactAdminEmail } from '@/lib/emails/form-emails'
import { isSupabaseAdminConfigured } from '@/lib/env.server'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailField, optionalText, requiredText } from '@/lib/validation'

const SUCCESS_MESSAGE = 'Thanks for reaching out! We usually reply within 1–2 business days.'

/** Browsers send textarea line breaks as \r\n; count them as one character, like the on-screen counter. */
const longText = (label: string, max: number) =>
  z
    .string({ error: `${label} is required.` })
    .transform((value) => value.replace(/\r\n/g, '\n'))
    .pipe(requiredText(label, max))

const contactSchema = z.object({
  name: requiredText('Name', 120),
  email: emailField,
  subject: optionalText(200),
  message: longText('Message', 5000),
})

/** Contact form on /contact. Public: no sign-in needed. */
export async function submitContactMessage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseAdminConfigured) return actionError(NOT_CONFIGURED_MESSAGE)

  // Bots fill the hidden "website" field. Pretend it worked so they move on.
  if (formData.get('website')) return actionSuccess(SUCCESS_MESSAGE)

  const parsed = contactSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionValidationError(parsed.error)

  const ip = await getClientIp()
  if (!(await rateLimit(`contact:${ip}`, 5, 3600))) {
    return actionError('You have sent several messages in a short time. Please try again in an hour.')
  }

  // The table has no public insert policy, so the server writes with the secret key.
  const { error } = await createAdminClient().from('contact_messages').insert(parsed.data)
  if (error) {
    console.error('[contact] insert failed', error.message)
    return actionError('We could not send your message. Please try again in a moment.')
  }

  const email = contactAdminEmail(parsed.data)
  await notifyAdmin(email.subject, email.html, parsed.data.email)

  revalidatePath('/admin/messages')
  revalidatePath('/admin')
  return actionSuccess(SUCCESS_MESSAGE)
}
