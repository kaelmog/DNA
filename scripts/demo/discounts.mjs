/**
 * Demo discount codes, one for every state the admin list can show (active,
 * expired, scheduled, used up), and the logic that applies them to demo orders.
 * WELCOME10 belongs to the owner: demo orders may use it, but its row and
 * redemption counter are never touched.
 */
import { PAID_STATUSES, unwrap } from './db.mjs'
import { toIso } from './random.mjs'

export const WELCOME_CODE = 'WELCOME10'

/**
 * windowDays: [startsDaysAgo, endsDaysAgo] (negative = in the future).
 * uses: how many paid demo orders redeem the code; times_redeemed matches it.
 */
export const DEMO_DISCOUNT_CODES = [
  {
    code: 'THANKYOU5',
    description: '$5 thank-you code for returning customers',
    discount_type: 'fixed_amount',
    value: 500,
    min_subtotal_cents: 0,
    max_redemptions: 5,
    windowDays: [null, null],
    uses: 5,
    repeatCustomersOnly: true,
  },
  {
    code: 'SUMMER25',
    description: 'Summer market sale: 25% off orders over $50',
    discount_type: 'percentage',
    value: 25,
    min_subtotal_cents: 5000,
    max_redemptions: null,
    windowDays: [100, 20],
    uses: 2,
  },
  {
    code: 'TENOFF',
    description: '$10 off orders over $75',
    discount_type: 'fixed_amount',
    value: 1000,
    min_subtotal_cents: 7500,
    max_redemptions: 100,
    windowDays: [50, null],
    uses: 3,
  },
  {
    code: 'SPRING15',
    description: '15% off orders over $60',
    discount_type: 'percentage',
    value: 15,
    min_subtotal_cents: 6000,
    max_redemptions: null,
    windowDays: [null, null],
    uses: 2,
  },
  {
    code: 'HOLIDAY20',
    description: 'Holiday gifting: 20% off everything',
    discount_type: 'percentage',
    value: 20,
    min_subtotal_cents: 0,
    max_redemptions: 500,
    windowDays: [-58, -96],
    uses: 0,
  },
]

export const DEMO_DISCOUNT_CODE_LIST = DEMO_DISCOUNT_CODES.map((discount) => discount.code)

const WELCOME_USES = 7

function inWindow(ageDays, [startsDaysAgo, endsDaysAgo]) {
  if (startsDaysAgo !== null && ageDays > startsDaysAgo) return false
  if (endsDaysAgo !== null && ageDays <= endsDaysAgo) return false
  return true
}

/**
 * Attaches discount codes to orders (sets order.discount). Only paid orders
 * get a code, so an admin marking a pending demo order as paid never bumps a
 * counter, and times_redeemed equals the number of orders using the code.
 */
export function applyDemoDiscounts(orders, welcomeRule, rng) {
  const paid = orders.filter((order) => PAID_STATUSES.includes(order.status))

  if (welcomeRule) {
    const firstOrders = paid.filter(
      (order) => order.isFirstOrder && order.subtotalCents >= welcomeRule.min_subtotal_cents,
    )
    for (const order of rng.shuffle(firstOrders).slice(0, WELCOME_USES)) order.discount = welcomeRule
  }

  for (const discount of DEMO_DISCOUNT_CODES) {
    if (discount.uses === 0) continue
    const candidates = paid.filter(
      (order) =>
        !order.discount &&
        order.subtotalCents >= discount.min_subtotal_cents &&
        inWindow(order.ageDays, discount.windowDays) &&
        (!discount.repeatCustomersOnly || (order.buyer.isAccount && !order.isFirstOrder)),
    )
    for (const order of rng.shuffle(candidates).slice(0, discount.uses)) order.discount = discount
  }
}

/** Inserts the demo codes with redemption counts that match the demo orders. */
export async function insertDemoDiscountCodes(db, orders, clock) {
  const rows = DEMO_DISCOUNT_CODES.map((discount) => {
    const [startsDaysAgo, endsDaysAgo] = discount.windowDays
    const redeemed = orders.filter((order) => order.discount?.code === discount.code).length
    // Created well before any demo order that uses it (and before it starts).
    const createdDaysAgo = Math.max(80, (startsDaysAgo ?? 0) + 12)
    return {
      code: discount.code,
      description: discount.description,
      discount_type: discount.discount_type,
      value: discount.value,
      min_subtotal_cents: discount.min_subtotal_cents,
      max_redemptions: discount.max_redemptions,
      times_redeemed: redeemed,
      starts_at: startsDaysAgo === null ? null : toIso(clock.daysAgo(startsDaysAgo)),
      ends_at: endsDaysAgo === null ? null : toIso(clock.daysAgo(endsDaysAgo)),
      is_active: true,
      created_at: toIso(clock.daysAgo(createdDaysAgo)),
    }
  })
  unwrap(await db.from('discount_codes').insert(rows), 'insert demo discount codes')
  return rows
}

/** Reads the owner's WELCOME10 rule (if it still exists) so demo totals match what checkout would charge. */
export async function loadWelcomeRule(db) {
  const row = unwrap(
    await db
      .from('discount_codes')
      .select('code, discount_type, value, min_subtotal_cents')
      .eq('code', WELCOME_CODE)
      .maybeSingle(),
    'load WELCOME10',
  )
  return row ?? null
}
