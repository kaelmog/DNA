import 'server-only'

import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

interface CustomerOwner {
  userId: string
  email: string | null
  name: string | null
  /** The id saved on the profile, if any. */
  stripeCustomerId: string | null
}

function isMissingStripeResource(error: unknown) {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'resource_missing'
}

async function findExistingCustomer(customerId: string) {
  try {
    const customer = await getStripe().customers.retrieve(customerId)
    return 'deleted' in customer && customer.deleted ? null : customer.id
  } catch (error) {
    // A saved id can point at another Stripe mode (test vs live) or a deleted customer.
    if (isMissingStripeResource(error)) return null
    throw error
  }
}

/**
 * Stripe customer id for a signed-in shopper, so their payment details and
 * addresses are remembered between orders. Reuses the id saved on the profile
 * while it still exists in Stripe, otherwise creates a customer and saves it.
 *
 * Returns null if Stripe is unreachable: checkout then falls back to
 * `customer_email`, because a missing customer record should never block a sale.
 */
export async function resolveStripeCustomerId(owner: CustomerOwner): Promise<string | null> {
  try {
    if (owner.stripeCustomerId) {
      const existingId = await findExistingCustomer(owner.stripeCustomerId)
      if (existingId) return existingId
    }

    const customer = await getStripe().customers.create(
      {
        email: owner.email ?? undefined,
        name: owner.name ?? undefined,
        metadata: { user_id: owner.userId },
      },
      // Two quick checkout clicks must not create two customers.
      { idempotencyKey: `customer-${owner.userId}-${owner.stripeCustomerId ?? 'new'}` },
    )

    const { error } = await createAdminClient()
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', owner.userId)
    if (error) console.error('[checkout] could not save stripe customer id', error.message)

    return customer.id
  } catch (error) {
    console.error('[checkout] stripe customer lookup failed', error instanceof Error ? error.message : error)
    return null
  }
}
