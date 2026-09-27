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
import { getCurrentUser } from '@/lib/auth'
import { CUSTOM_REQUEST_TYPES } from '@/lib/constants'
import { getStoreSettings } from '@/lib/data/settings'
import { notifyAdmin, sendEmail } from '@/lib/email'
import { customRequestAdminEmail, customRequestCustomerEmail } from '@/lib/emails/form-emails'
import { isSupabaseAdminConfigured } from '@/lib/env.server'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailField, optionalMoneyField, optionalText, requiredText } from '@/lib/validation'

import { isAllowedDeadline } from './deadline'
import { isUploadedFile, readReferenceImage } from './reference-image'

const BUCKET = 'custom-requests'
const MAX_BUDGET_CENTS = 10_000_000 // $100,000

const SUCCESS_MESSAGE =
  "Thank you! Your request is in. We'll reply by email within 2–3 business days with ideas, a timeline and a quote."

/** Browsers send textarea line breaks as \r\n; count them as one character, like the on-screen counter. */
const longText = (label: string, max: number) =>
  z
    .string({ error: `${label} is required.` })
    .transform((value) => value.replace(/\r\n/g, '\n'))
    .pipe(requiredText(label, max))

const customRequestSchema = z.object({
  customer_name: requiredText('Name', 120),
  customer_email: emailField,
  phone: optionalText(40),
  request_type: z.enum(CUSTOM_REQUEST_TYPES, { error: 'Choose what you would like made.' }),
  budget: optionalMoneyField.refine(
    (cents) => cents === null || (cents >= 100 && cents <= MAX_BUDGET_CENTS),
    'Enter a budget between $1 and $100,000, or leave it empty.',
  ),
  preferred_colors: optionalText(200),
  dimensions: optionalText(120),
  deadline: z
    .string()
    .trim()
    .nullish()
    .transform((value) => value || null)
    .refine((value) => value === null || isAllowedDeadline(value), 'Choose a date from today onwards.'),
  description: longText('Description', 4000),
})

/**
 * Made-to-order request from /custom. Public: guests can send one; signed-in
 * customers get the request linked to their account. Inserts use the secret
 * key because the table has no public insert policy.
 */
export async function submitCustomRequest(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseAdminConfigured) return actionError(NOT_CONFIGURED_MESSAGE)

  // Bots fill the hidden "website" field. Pretend it worked so they move on.
  if (formData.get('website')) return actionSuccess(SUCCESS_MESSAGE)

  const parsed = customRequestSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return actionValidationError(parsed.error)

  const ip = await getClientIp()
  if (!(await rateLimit(`custom:${ip}`, 5, 3600))) {
    return actionError('You have sent several requests in a short time. Please try again in an hour.')
  }

  const upload = formData.get('reference_image')
  const image = isUploadedFile(upload) ? await readReferenceImage(upload) : null
  if (image && !image.ok) return actionError(image.message, { reference_image: [image.message] })

  const supabase = createAdminClient()
  const user = await getCurrentUser()

  // Random file names: nobody can guess another customer's image path.
  let imagePath: string | null = null
  if (image?.ok) {
    const path = `${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${image.extension}`
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, image.bytes, { contentType: image.contentType, upsert: false })
    if (error) {
      console.error('[custom-request] image upload failed', error.message)
      return actionError('We could not upload your image. Please try again, or send the request without it.')
    }
    imagePath = path
  }

  const { budget, ...fields } = parsed.data
  const request = { ...fields, budget_cents: budget, reference_image_path: imagePath }

  const { error: insertError } = await supabase
    .from('custom_requests')
    .insert({ ...request, user_id: user?.id ?? null })

  if (insertError) {
    console.error('[custom-request] insert failed', insertError.message)
    // Do not keep an orphaned image around when the request itself was not saved.
    if (imagePath) await supabase.storage.from(BUCKET).remove([imagePath])
    return actionError('We could not send your request. Please try again in a moment.')
  }

  // Emails never throw; a missing email setup only means nobody is notified.
  // Customer replies go to the public support address when one is set.
  const settings = await getStoreSettings()
  const adminEmail = customRequestAdminEmail(request)
  const customerEmail = customRequestCustomerEmail(request.customer_name)
  await Promise.all([
    notifyAdmin(adminEmail.subject, adminEmail.html, request.customer_email),
    sendEmail({ to: request.customer_email, ...customerEmail, replyTo: settings.support_email ?? undefined }),
  ])

  revalidatePath('/admin/requests')
  revalidatePath('/admin')
  return actionSuccess(SUCCESS_MESSAGE)
}
