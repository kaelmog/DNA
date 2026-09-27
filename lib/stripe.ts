import 'server-only'

import Stripe from 'stripe'

import { serverEnv } from '@/lib/env.server'

let stripeClient: Stripe | null = null

/** Lazily created Stripe client. Throws when STRIPE_SECRET_KEY is missing. */
export function getStripe() {
  if (!serverEnv.stripeSecretKey) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY (see /todo).')
  }
  stripeClient ??= new Stripe(serverEnv.stripeSecretKey, {
    appInfo: { name: 'Knotted Studio' },
  })
  return stripeClient
}
