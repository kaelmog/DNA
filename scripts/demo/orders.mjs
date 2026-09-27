/**
 * Demo orders: 48 orders over the last 75 days, denser in recent weeks so the
 * dashboard chart looks alive. Money follows lib/pricing.ts exactly.
 *
 * Orders are inserted directly (not through create_pending_order), so they
 * never take real stock. Inserting also skips the status trigger, which is why
 * every status timestamp is written explicitly here.
 */
import { applyDemoDiscounts } from './discounts.mjs'
import { unwrap } from './db.mjs'
import { DAY_MS, HOUR_MS, demoId, toIso } from './random.mjs'

const ORDER_COUNT = 48
const HISTORY_DAYS = 75
/** >1 packs more orders into recent days (age grows like index^1.7). */
const RECENCY_CURVE = 1.7

/** Statuses of the 20 newest orders, newest first: the ones still moving through fulfilment. */
const RECENT_STATUS_PLAN = [
  'pending', 'paid', 'pending', 'paid', 'processing',
  'pending', 'paid', 'processing', 'paid', 'shipped',
  'pending', 'processing', 'paid', 'shipped', 'processing',
  'shipped', 'processing', 'shipped', 'shipped', 'shipped',
]
/** Older orders are delivered, except these positions (index counted from the newest order). */
const OLDER_STATUS_EXCEPTIONS = { 22: 'cancelled', 27: 'refunded', 31: 'cancelled', 37: 'refunded', 40: 'cancelled' }

const LINE_COUNT_WEIGHTS = { 1: 45, 2: 35, 3: 15, 4: 5 }

const CUSTOMER_NOTES = [
  'This is a gift for my mom. Could you leave the price off the packing slip?',
  "Please leave the parcel with the front desk if I'm not home.",
  "Could you wrap it in tissue paper? It's a housewarming present.",
  "No rush at all, it's for a birthday at the end of the month.",
  'Hanging this in our nursery. So excited!',
  'If possible please ship in a box rather than a mailer, our porch gets wet.',
  "Please add a note: 'Congrats on the new place! Love, Sam'.",
]

const ADMIN_NOTES = [
  'Customer emailed about care; sent the care card.',
  'Packed with extra tissue and a lavender sprig.',
  'Returning customer: added a handwritten thank-you card.',
  'Double-boxed to protect the wooden dowel.',
  'Confirmed the shipping address by email before packing.',
]

const CANCEL_REASONS = [
  'Payment not received within 7 days.',
  'Customer asked to cancel before paying.',
  "Customer needed international shipping, which we don't offer yet.",
]

/** In order: the first refunded order was returned after delivery, the second never shipped. */
const REFUND_STORIES = [
  {
    afterDelivery: true,
    note: 'Arrived damaged in transit. Refunded in full; the customer kept the piece.',
  },
  {
    afterDelivery: false,
    note: 'Customer asked to cancel after paying (moving house). Refunded in full before shipping.',
  },
]

function statusAt(index) {
  return RECENT_STATUS_PLAN[index] ?? OLDER_STATUS_EXCEPTIONS[index] ?? 'delivered'
}

function buyerSlots(customers, guests) {
  const fromAccount = (customer) => ({
    name: customer.fullName,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    userId: customer.id,
    isAccount: true,
  })
  const fromGuest = (guest) => ({ ...fromAccount(guest), userId: null, isAccount: false })
  return [
    ...customers.flatMap((customer) => Array.from({ length: customer.orderCount }, () => fromAccount(customer))),
    ...guests.flatMap((guest) => Array.from({ length: guest.orderCount }, () => fromGuest(guest))),
  ]
}

function pickQuantity(product, rng) {
  if (product.bulky) return 1
  const weights = product.smallItem ? { 1: 60, 2: 30, 3: 10 } : { 1: 88, 2: 12 }
  return Number(rng.weighted(Object.keys(weights), (quantity) => weights[quantity]))
}

/** 1-4 distinct products that were on sale on the day the order was placed. */
function buildLines(pool, ageDays, rng) {
  let candidates = pool.filter((product) => product.createdDaysAgo > ageDays + 0.5 && ageDays > product.retiredDaysAgo)
  const wanted = Number(rng.weighted(Object.keys(LINE_COUNT_WEIGHTS), (count) => LINE_COUNT_WEIGHTS[count]))
  const lines = []
  while (lines.length < wanted && candidates.length > 0) {
    const product = rng.weighted(candidates, (candidate) => candidate.popularity)
    candidates = candidates.filter((candidate) => candidate !== product)
    lines.push({ product, variant: rng.pick(product.variants), quantity: pickQuantity(product, rng) })
  }
  return lines
}

/**
 * Status timestamps that always run in order (created < paid < shipped <
 * delivered < refunded < now): each step takes a bounded share of the time left.
 */
function buildTimeline(order, clock, rng) {
  const { status, createdMs } = order
  const left = (fromMs) => clock.nowMs - fromMs
  const step = (fromMs, minMs, maxMs, maxShare) => fromMs + Math.min(rng.between(minMs, maxMs), left(fromMs) * maxShare)

  if (status === 'pending') return
  if (status === 'cancelled') {
    order.cancelledMs = step(createdMs, 2 * DAY_MS, 7 * DAY_MS, 0.8)
    return
  }

  order.paidMs = step(createdMs, 0.2 * HOUR_MS, 20 * HOUR_MS, 0.3)
  if (status === 'paid' || status === 'processing') return

  if (status === 'refunded' && !order.refundStory.afterDelivery) {
    order.refundedMs = step(order.paidMs, 0.5 * DAY_MS, 2 * DAY_MS, 0.5)
    return
  }

  order.shippedMs = step(order.paidMs, 1 * DAY_MS, 3 * DAY_MS, status === 'shipped' ? 0.6 : 0.3)
  if (status === 'shipped') return

  order.deliveredMs = step(order.shippedMs, 2 * DAY_MS, 6 * DAY_MS, 0.5)
  if (status === 'refunded') order.refundedMs = step(order.deliveredMs, 2 * DAY_MS, 8 * DAY_MS, 0.6)
}

function digits(rng, count) {
  return Array.from({ length: count }, () => rng.int(0, 9)).join('')
}

/** Realistic-looking (but made up) USPS / UPS tracking details. */
function buildTracking(order, rng) {
  const heavy = order.lines.some((line) => line.product.bulky) || order.subtotalCents >= 15000
  if (heavy || rng.chance(0.3)) {
    const number = `1ZKS472103${digits(rng, 8)}`
    return { carrier: 'UPS', number, url: `https://www.ups.com/track?loc=en_US&tracknum=${number}` }
  }
  const number = `9400111${digits(rng, 15)}`
  return { carrier: 'USPS', number, url: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${number}` }
}

/** The same rules as calculateTotals() in lib/pricing.ts. */
function priceOrder(subtotalCents, settings, discount) {
  let discountCents = 0
  if (discount && subtotalCents > 0) {
    const amount =
      discount.discount_type === 'percentage' ? Math.round((subtotalCents * discount.value) / 100) : discount.value
    discountCents = Math.min(amount, subtotalCents)
  }
  const discounted = subtotalCents - discountCents
  const threshold = settings.free_shipping_threshold_cents
  const freeShipping = discounted <= 0 || (threshold !== null && discounted >= threshold)
  const shippingCents = freeShipping ? 0 : settings.flat_shipping_cents
  return { discountCents, shippingCents, totalCents: discounted + shippingCents }
}

/** Builds the demo orders in memory (nothing is written yet). */
export function buildDemoOrders({ rng, clock, pool, customers, guests, settings, welcomeRule }) {
  const slots = rng.shuffle(buyerSlots(customers, guests))
  if (slots.length !== ORDER_COUNT) throw new Error(`expected ${ORDER_COUNT} buyer slots, got ${slots.length}`)

  let refundCount = 0
  let cancelCount = 0
  const orders = slots.map((buyer, index) => {
    // Stratified ages: order 0 is the newest, each index gets its own slice of time.
    const ageDays = Math.max(0.03, HISTORY_DAYS * ((index + rng.between(0.15, 0.85)) / ORDER_COUNT) ** RECENCY_CURVE)
    const status = statusAt(index)
    const order = {
      id: demoId(`order:${index}`),
      buyer,
      status,
      ageDays,
      createdMs: clock.daysAgo(ageDays),
      lines: buildLines(pool, ageDays, rng),
      discount: null,
      refundStory: status === 'refunded' ? REFUND_STORIES[refundCount++ % REFUND_STORIES.length] : null,
      cancelReason: status === 'cancelled' ? CANCEL_REASONS[cancelCount++ % CANCEL_REASONS.length] : null,
      customerNote: rng.chance(0.25) ? rng.pick(CUSTOMER_NOTES) : null,
      adminNote: null,
      paidMs: null,
      shippedMs: null,
      deliveredMs: null,
      cancelledMs: null,
      refundedMs: null,
      tracking: null,
    }
    if (order.lines.length === 0) throw new Error('no sellable products found for demo orders (run seed.sql first)')
    order.subtotalCents = order.lines.reduce((sum, line) => sum + line.variant.priceCents * line.quantity, 0)
    buildTimeline(order, clock, rng)
    if (order.shippedMs) order.tracking = buildTracking(order, rng)
    // Packing notes only make sense once an order has actually shipped.
    order.adminNote = order.refundStory?.note ?? (order.shippedMs && rng.chance(0.2) ? rng.pick(ADMIN_NOTES) : null)
    return order
  })

  // First order per buyer, in date order (WELCOME10 and THANKYOU5 depend on it).
  const seenBuyers = new Set()
  for (const order of [...orders].sort((a, b) => a.createdMs - b.createdMs)) {
    order.isFirstOrder = !seenBuyers.has(order.buyer.email)
    seenBuyers.add(order.buyer.email)
  }

  applyDemoDiscounts(orders, welcomeRule, rng)
  for (const order of orders) Object.assign(order, priceOrder(order.subtotalCents, settings, order.discount))
  return orders
}

function toOrderRow(order, currency) {
  const { buyer, tracking } = order
  const updatedMs = Math.max(
    ...[order.createdMs, order.paidMs, order.shippedMs, order.deliveredMs, order.cancelledMs, order.refundedMs].filter(
      (ms) => ms !== null,
    ),
  )
  return {
    id: order.id,
    user_id: buyer.userId,
    email: buyer.email,
    customer_name: buyer.name,
    phone: buyer.phone,
    status: order.status,
    currency,
    subtotal_cents: order.subtotalCents,
    discount_cents: order.discountCents,
    shipping_cents: order.shippingCents,
    tax_cents: 0,
    total_cents: order.totalCents,
    refunded_cents: order.status === 'refunded' ? order.totalCents : 0,
    discount_code: order.discount?.code ?? null,
    shipping_method: order.shippingCents === 0 ? 'Free shipping' : 'Standard shipping',
    shipping_address: { name: buyer.name, ...buyer.address, country: 'US' },
    customer_note: order.customerNote,
    admin_note: order.adminNote,
    carrier: tracking?.carrier ?? null,
    tracking_number: tracking?.number ?? null,
    tracking_url: tracking?.url ?? null,
    stripe_checkout_session_id: null,
    stripe_payment_intent_id: null,
    // Demo orders never reserved stock. Marking it as already released stops the
    // status trigger from adding phantom stock if an admin cancels a demo order.
    inventory_released_at: toIso(order.cancelledMs ?? order.createdMs),
    paid_at: toIso(order.paidMs),
    shipped_at: toIso(order.shippedMs),
    delivered_at: toIso(order.deliveredMs),
    cancelled_at: toIso(order.cancelledMs),
    cancel_reason: order.cancelReason,
    created_at: toIso(order.createdMs),
    updated_at: toIso(updatedMs),
  }
}

function toItemRows(order) {
  return order.lines.map((line, position) => ({
    order_id: order.id,
    product_id: line.product.id,
    variant_id: line.variant.id,
    product_name: line.product.name,
    variant_title: line.variant.title === 'Default' ? null : line.variant.title,
    sku: line.variant.sku,
    image_url: line.product.imageUrl,
    unit_price_cents: line.variant.priceCents,
    quantity: line.quantity,
    // 1 ms apart so the items keep their order when sorted by created_at.
    created_at: toIso(order.createdMs + position),
  }))
}

/** Writes orders oldest first, so order numbers increase with the order date. */
export async function insertDemoOrders(db, orders, currency) {
  const chronological = [...orders].sort((a, b) => a.createdMs - b.createdMs)
  unwrap(await db.from('orders').insert(chronological.map((order) => toOrderRow(order, currency))), 'insert demo orders')
  const itemRows = chronological.flatMap(toItemRows)
  unwrap(await db.from('order_items').insert(itemRows), 'insert demo order items')
  return { orders: chronological.length, items: itemRows.length }
}
