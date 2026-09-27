import type Stripe from 'stripe'

import { handleStripeEvent, isEventProcessed, recordEvent } from '@/lib/checkout/webhook-handlers'
import { isStripeConfigured, isSupabaseAdminConfigured, serverEnv } from '@/lib/env.server'
import { getStripe } from '@/lib/stripe'

/**
 * Stripe webhook endpoint: POST /api/webhooks/stripe
 *
 * 1. Verifies the Stripe signature on the raw request body (never trust an unsigned request).
 * 2. Skips events that were already processed (Stripe can deliver an event twice).
 * 3. Runs the matching handler from lib/checkout/webhook-handlers.ts.
 *
 * Answers 200 for handled and ignored events, 400 for bad signatures, 503 while
 * the keys are missing and 500 on unexpected errors, so Stripe retries later.
 */

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

export async function POST(request: Request) {
  if (!isStripeConfigured || !serverEnv.stripeWebhookSecret || !isSupabaseAdminConfigured) {
    return Response.json({ error: 'Stripe webhook is not configured.' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return Response.json({ error: 'Missing Stripe signature.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    // The signature covers the exact bytes Stripe sent, so read the body as raw text.
    event = getStripe().webhooks.constructEvent(await request.text(), signature, serverEnv.stripeWebhookSecret)
  } catch (error) {
    console.warn('[webhook] signature verification failed', errorMessage(error))
    return Response.json({ error: 'Invalid Stripe signature.' }, { status: 400 })
  }

  try {
    if (await isEventProcessed(event.id)) {
      return Response.json({ received: true, duplicate: true })
    }

    const result = await handleStripeEvent(event)
    if (result === 'handled') await recordEvent(event)
    return Response.json({ received: true })
  } catch (error) {
    console.error('[webhook] processing failed', event.type, event.id, errorMessage(error))
    return Response.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
