/**
 * The rest of the living-store data: wishlists, custom (made-to-order)
 * requests, contact messages and newsletter subscribers.
 */
import { unwrap } from './db.mjs'
import { DAY_MS, HOUR_MS, toDate, toIso } from './random.mjs'

const WISHLIST_OWNERS = [
  'ava.thompson@example.com',
  'mateo.alvarez@example.com',
  'priya.raman@example.com',
  'jordan.brooks@example.com',
  'olivia.nguyen@example.com',
  'sofia.rossi@example.com',
  'liam.oconnor@example.com',
  'noah.patel@example.com',
]

/** One request per status. deadlineInDays is relative to today (negative = already past). */
const CUSTOM_REQUESTS = [
  {
    name: 'Harper Collins',
    email: 'harper.collins@example.com',
    phone: '(707) 555-0139',
    type: 'Wedding or event pieces',
    budget: 45000,
    colors: 'Ivory and dusty sage',
    dimensions: 'Arch drape about 6 ft wide, plus 8 chair hangings',
    deadlineInDays: 150,
    status: 'new',
    daysAgo: 1,
    quoted: null,
    notes: null,
    description:
      'We are getting married at a small vineyard in late February and would love a macrame arch drape plus eight little hangings for the aisle chairs. Soft and airy, not too bohemian. Could you share a rough price and timeline?',
  },
  {
    name: 'Priya Raman',
    email: 'priya.raman@example.com',
    phone: null,
    type: 'Custom wall hanging',
    budget: 22000,
    colors: 'Rust, cream and mustard',
    dimensions: '40 × 60 in',
    deadlineInDays: 40,
    status: 'reviewing',
    daysAgo: 4,
    quoted: null,
    notes: 'Needs about 3 kg of 5 mm cord. Check the rust dye lot before quoting.',
    description:
      "I'm looking for a large piece above our fireplace, similar to the Sol hanging but wider, with a band of rust and mustard. The wall is 7 ft wide and the mantel sits at 4 ft.",
  },
  {
    name: 'Elijah Grant',
    email: 'elijah.grant@example.com',
    phone: '(503) 555-0191',
    type: 'Custom plant hanger',
    budget: 15000,
    colors: 'Natural',
    dimensions: 'Three hangers at 30, 40 and 50 in',
    deadlineInDays: 25,
    status: 'quoted',
    daysAgo: 9,
    quoted: 16500,
    notes: 'Quoted $165 for the set of three, shipping included. Sent two knot pattern options by email.',
    description:
      'Could you make three matching plant hangers at staggered lengths for a corner window? The pots are 6 to 8 inches wide.',
  },
  {
    name: 'Sofia Rossi',
    email: 'sofia.rossi@example.com',
    phone: '(718) 555-0167',
    type: 'Custom wall hanging',
    budget: 30000,
    colors: 'Terracotta and sand',
    dimensions: '30 × 44 in',
    deadlineInDays: 18,
    status: 'accepted',
    daysAgo: 16,
    quoted: 28500,
    notes: 'Quote accepted. Pattern B with extra-long fringe; start after the current Solstice batch.',
    description:
      'A wedding gift for my brother: something warm in terracotta and sand for above their bed, with long fringe. I love the layered rows on the Solstice piece.',
  },
  {
    name: 'Ava Thompson',
    email: 'ava.thompson@example.com',
    phone: '(503) 555-0142',
    type: 'Something else',
    budget: 9000,
    colors: 'Oat',
    dimensions: 'Set of 12 napkin rings',
    deadlineInDays: -20,
    status: 'completed',
    daysAgo: 38,
    quoted: 9600,
    notes: 'Shipped with tissue and a thank-you card. The customer sent a lovely photo of the finished table.',
    description:
      'Would you make twelve macrame napkin rings for a harvest dinner party? Something simple in an oat color to go with linen napkins.',
  },
  {
    name: 'Owen Price',
    email: 'owen.price@example.com',
    phone: null,
    type: 'Custom plant hanger',
    budget: 6000,
    colors: null,
    dimensions: 'For a 20 lb concrete planter',
    deadlineInDays: -10,
    status: 'declined',
    daysAgo: 27,
    quoted: null,
    notes: 'Declined: cotton cord is not rated for that weight outdoors. Suggested a metal hook and chain instead.',
    description:
      'I need an outdoor hanger for a heavy concrete planter on my porch, around 20 lb when watered. Can your hangers take that weight year-round?',
  },
]

const CONTACT_MESSAGES = [
  {
    name: 'Olivia Nguyen',
    email: 'olivia.nguyen@example.com',
    subject: 'Steaming out creases?',
    message:
      "Hi! My new wall hanging is gorgeous. It has a few creases from shipping. Is it okay to steam them out, or should I just let it hang for a few days? Thank you!",
    status: 'new',
    daysAgo: 0.4,
  },
  {
    name: 'Rachel Summers',
    email: 'rachel.summers@example.com',
    subject: 'Wholesale enquiry',
    message:
      'Hello, I run a small plant shop in Burlington, VT and would love to stock your plant hangers. Do you offer wholesale pricing for orders of 20 or more pieces?',
    status: 'new',
    daysAgo: 1.5,
  },
  {
    name: 'Kenji Watanabe',
    email: 'kenji.watanabe@example.com',
    subject: 'Shipping to Canada?',
    message:
      "Do you ship to Toronto? I'd love the Luna Moon Hanging for my partner's birthday in November and I'm happy to pay extra for shipping.",
    status: 'new',
    daysAgo: 3,
  },
  {
    name: 'Hannah Kim',
    email: 'hannah.kim@example.com',
    subject: 'It arrived. Thank you!',
    message:
      'Just wanted to say my order arrived today and it is even more beautiful than the photos. The handwritten note made my day.',
    status: 'read',
    daysAgo: 6,
  },
  {
    name: 'Diego Morales',
    email: 'diego.morales@example.com',
    subject: 'Workshops this fall?',
    message:
      'Are you planning any macrame workshops this fall? A few friends and I would love to book a private beginner session.',
    status: 'read',
    daysAgo: 11,
  },
  {
    name: 'Marcus Bennett',
    email: 'marcus.bennett@example.com',
    subject: 'Gift wrapping',
    message:
      "Hi! Do you offer gift wrapping? I'd like to send a plant hanger straight to my mom for her birthday, with a short note inside.",
    status: 'read',
    daysAgo: 19,
  },
  {
    name: 'Lena Fischer',
    email: 'lena.fischer@example.com',
    subject: 'Collaboration request',
    message:
      "Hi there! I write a small home decor blog and would love to feature a few of your pieces in a cozy fall styling post. Let me know if you'd be open to a collaboration.",
    status: 'archived',
    daysAgo: 34,
  },
]

/** Customers who opted in to marketing subscribed at checkout; the rest signed up on the site. */
const OTHER_SUBSCRIBERS = [
  { email: 'june.harris@example.com', source: 'footer', daysAgo: 88 },
  { email: 'felix.wong@example.com', source: 'footer', daysAgo: 81 },
  { email: 'nora.baker@example.com', source: 'about', daysAgo: 74, unsubscribedDaysAgo: 30 },
  { email: 'theo.silva@example.com', source: 'footer', daysAgo: 66 },
  { email: 'iris.campbell@example.com', source: 'about', daysAgo: 58 },
  { email: 'milo.anderson@example.com', source: 'footer', daysAgo: 51, unsubscribedDaysAgo: 12 },
  { email: 'zara.ali@example.com', source: 'footer', daysAgo: 43 },
  { email: 'eli.johnson@example.com', source: 'about', daysAgo: 35 },
  { email: 'clara.dubois@example.com', source: 'footer', daysAgo: 27, unsubscribedDaysAgo: 5 },
  { email: 'jasper.reed@example.com', source: 'footer', daysAgo: 18 },
  { email: 'luca.bianchi@example.com', source: 'about', daysAgo: 9 },
  { email: 'freya.nilsson@example.com', source: 'footer', daysAgo: 2 },
]

/** 2-5 saved pieces for eight customers, saved some time after they joined. */
export async function insertDemoWishlists(db, { customers, pool, rng, clock }) {
  const activeProducts = pool.filter((product) => product.status === 'active')
  const rows = customers
    .filter((customer) => WISHLIST_OWNERS.includes(customer.email))
    .flatMap((customer) =>
      rng
        .shuffle(activeProducts)
        .slice(0, rng.int(2, 5))
        .map((product) => ({
          user_id: customer.id,
          product_id: product.id,
          created_at: toIso(customer.joinedMs + (clock.nowMs - customer.joinedMs) * rng.between(0.05, 0.95)),
        })),
    )
  unwrap(await db.from('wishlist_items').insert(rows), 'insert demo wishlists')
  return rows.length
}

export async function insertDemoCustomRequests(db, { customers, clock }) {
  const userIds = new Map(customers.map((customer) => [customer.email, customer.id]))
  const rows = CUSTOM_REQUESTS.map((request) => {
    const createdMs = clock.daysAgo(request.daysAgo)
    // Anything past 'new' has been looked at since it came in.
    const updatedMs = request.status === 'new' ? createdMs : createdMs + Math.min(3 * DAY_MS, (clock.nowMs - createdMs) / 2)
    return {
      user_id: userIds.get(request.email) ?? null,
      customer_name: request.name,
      customer_email: request.email,
      phone: request.phone,
      request_type: request.type,
      budget_cents: request.budget,
      preferred_colors: request.colors,
      dimensions: request.dimensions,
      deadline: toDate(clock.daysAhead(request.deadlineInDays)),
      description: request.description,
      reference_image_path: null,
      status: request.status,
      quoted_price_cents: request.quoted,
      seller_notes: request.notes,
      created_at: toIso(createdMs),
      updated_at: toIso(updatedMs),
    }
  })
  unwrap(await db.from('custom_requests').insert(rows), 'insert demo custom requests')
  return rows.length
}

export async function insertDemoContactMessages(db, { clock }) {
  const rows = CONTACT_MESSAGES.map((message) => ({
    name: message.name,
    email: message.email,
    subject: message.subject,
    message: message.message,
    status: message.status,
    created_at: toIso(clock.daysAgo(message.daysAgo)),
  }))
  unwrap(await db.from('contact_messages').insert(rows), 'insert demo contact messages')
  return rows.length
}

export async function insertDemoSubscribers(db, { customers, clock }) {
  const fromCheckout = customers
    .filter((customer) => customer.marketingOptIn)
    .map((customer) => ({ email: customer.email, source: 'checkout', createdMs: customer.joinedMs + HOUR_MS }))
  const others = OTHER_SUBSCRIBERS.map((subscriber) => ({
    email: subscriber.email,
    source: subscriber.source,
    createdMs: clock.daysAgo(subscriber.daysAgo),
    unsubscribedMs: subscriber.unsubscribedDaysAgo === undefined ? null : clock.daysAgo(subscriber.unsubscribedDaysAgo),
  }))

  const rows = [...fromCheckout, ...others].map((subscriber) => ({
    email: subscriber.email.toLowerCase(),
    status: subscriber.unsubscribedMs ? 'unsubscribed' : 'subscribed',
    source: subscriber.source,
    created_at: toIso(subscriber.createdMs),
    updated_at: toIso(subscriber.unsubscribedMs ?? subscriber.createdMs),
  }))
  unwrap(await db.from('newsletter_subscribers').insert(rows), 'insert demo subscribers')
  return { total: rows.length, unsubscribed: rows.filter((row) => row.status === 'unsubscribed').length }
}
