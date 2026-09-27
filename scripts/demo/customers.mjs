/**
 * Demo shoppers: twelve accounts that can sign in (shared demo password) and
 * ten guests who checked out without an account. Phone numbers use the
 * 555-01xx range, which is reserved for fiction.
 */
import { DAY_MS, toIso } from './random.mjs'
import { DEMO_PASSWORD, unwrap } from './db.mjs'

/**
 * orderCount: how many demo orders the customer places (a few loyal regulars,
 * one who signed up but never ordered). joinedDaysAgo is the latest possible
 * sign-up day; it moves earlier when their first order is older.
 */
export const DEMO_CUSTOMERS = [
  {
    fullName: 'Ava Thompson',
    email: 'ava.thompson@example.com',
    phone: '(503) 555-0142',
    marketingOptIn: true,
    orderCount: 6,
    joinedDaysAgo: 118,
    address: { line1: '2418 SE Alder St', line2: null, city: 'Portland', state: 'OR', postal_code: '97214' },
  },
  {
    fullName: 'Sofia Rossi',
    email: 'sofia.rossi@example.com',
    phone: '(718) 555-0167',
    marketingOptIn: true,
    orderCount: 5,
    joinedDaysAgo: 104,
    address: { line1: '215 Berry St', line2: 'Apt 4R', city: 'Brooklyn', state: 'NY', postal_code: '11249' },
  },
  {
    fullName: 'Mateo Alvarez',
    email: 'mateo.alvarez@example.com',
    phone: '(512) 555-0119',
    marketingOptIn: false,
    orderCount: 4,
    joinedDaysAgo: 96,
    address: { line1: '1107 E 6th St', line2: 'Apt 204', city: 'Austin', state: 'TX', postal_code: '78702' },
  },
  {
    fullName: 'Priya Raman',
    email: 'priya.raman@example.com',
    phone: null,
    marketingOptIn: true,
    orderCount: 4,
    joinedDaysAgo: 88,
    address: { line1: '5520 Ballard Ave NW', line2: null, city: 'Seattle', state: 'WA', postal_code: '98107' },
  },
  {
    fullName: 'Hannah Kim',
    email: 'hannah.kim@example.com',
    phone: null,
    marketingOptIn: true,
    orderCount: 3,
    joinedDaysAgo: 77,
    address: { line1: '3312 Hennepin Ave S', line2: 'Unit 3', city: 'Minneapolis', state: 'MN', postal_code: '55408' },
  },
  {
    fullName: 'Olivia Nguyen',
    email: 'olivia.nguyen@example.com',
    phone: null,
    marketingOptIn: true,
    orderCount: 3,
    joinedDaysAgo: 65,
    address: { line1: '4150 Park Blvd', line2: null, city: 'San Diego', state: 'CA', postal_code: '92103' },
  },
  {
    fullName: 'Marcus Bennett',
    email: 'marcus.bennett@example.com',
    phone: '(303) 555-0183',
    marketingOptIn: false,
    orderCount: 2,
    joinedDaysAgo: 52,
    address: { line1: '1840 Larimer St', line2: 'Apt 5C', city: 'Denver', state: 'CO', postal_code: '80202' },
  },
  {
    fullName: 'Aisha Mohammed',
    email: 'aisha.mohammed@example.com',
    phone: '(312) 555-0126',
    marketingOptIn: false,
    orderCount: 2,
    joinedDaysAgo: 41,
    address: { line1: '1450 W Chicago Ave', line2: null, city: 'Chicago', state: 'IL', postal_code: '60642' },
  },
  {
    fullName: 'Grace Whitfield',
    email: 'grace.whitfield@example.com',
    phone: '(912) 555-0158',
    marketingOptIn: true,
    orderCount: 2,
    joinedDaysAgo: 33,
    address: { line1: '19 E Jones St', line2: null, city: 'Savannah', state: 'GA', postal_code: '31401' },
  },
  {
    fullName: "Liam O'Connor",
    email: 'liam.oconnor@example.com',
    phone: '(617) 555-0174',
    marketingOptIn: false,
    orderCount: 2,
    joinedDaysAgo: 24,
    address: { line1: '72 Tremont St', line2: 'Apt 9', city: 'Boston', state: 'MA', postal_code: '02108' },
  },
  {
    fullName: 'Jordan Brooks',
    email: 'jordan.brooks@example.com',
    phone: null,
    marketingOptIn: false,
    orderCount: 1,
    joinedDaysAgo: 15,
    address: { line1: '38 Montford Ave', line2: null, city: 'Asheville', state: 'NC', postal_code: '28801' },
  },
  {
    fullName: 'Noah Patel',
    email: 'noah.patel@example.com',
    phone: null,
    marketingOptIn: false,
    orderCount: 0,
    joinedDaysAgo: 9,
    address: { line1: '2231 N 7th St', line2: null, city: 'Phoenix', state: 'AZ', postal_code: '85006' },
  },
]

export const DEMO_GUESTS = [
  {
    fullName: 'Emily Carter',
    email: 'emily.carter@example.com',
    phone: '(802) 555-0131',
    orderCount: 2,
    address: { line1: '604 Maple Ave', line2: null, city: 'Burlington', state: 'VT', postal_code: '05401' },
  },
  {
    fullName: 'Daniel Reyes',
    email: 'daniel.reyes@example.com',
    phone: null,
    orderCount: 2,
    address: { line1: '1520 Central Ave SE', line2: null, city: 'Albuquerque', state: 'NM', postal_code: '87106' },
  },
  {
    fullName: 'Chloe Martin',
    email: 'chloe.martin@example.com',
    phone: '(608) 555-0115',
    orderCount: 2,
    address: { line1: '88 Pine St', line2: 'Apt 2', city: 'Madison', state: 'WI', postal_code: '53703' },
  },
  {
    fullName: 'Ben Foster',
    email: 'ben.foster@example.com',
    phone: null,
    orderCount: 2,
    address: { line1: '410 Walnut St', line2: null, city: 'Cincinnati', state: 'OH', postal_code: '45202' },
  },
  {
    fullName: 'Isabel Cruz',
    email: 'isabel.cruz@example.com',
    phone: '(415) 555-0198',
    orderCount: 1,
    address: { line1: '2735 Bryant St', line2: null, city: 'San Francisco', state: 'CA', postal_code: '94110' },
  },
  {
    fullName: 'Samuel Lee',
    email: 'samuel.lee@example.com',
    phone: null,
    orderCount: 1,
    address: { line1: '1216 Belmont Blvd', line2: null, city: 'Nashville', state: 'TN', postal_code: '37212' },
  },
  {
    fullName: 'Tessa Morgan',
    email: 'tessa.morgan@example.com',
    phone: '(207) 555-0147',
    orderCount: 1,
    address: { line1: '57 Congress St', line2: null, city: 'Portland', state: 'ME', postal_code: '04101' },
  },
  {
    fullName: 'Ruth Adeyemi',
    email: 'ruth.adeyemi@example.com',
    phone: null,
    orderCount: 1,
    address: { line1: '900 N Charles St', line2: 'Apt 3A', city: 'Baltimore', state: 'MD', postal_code: '21201' },
  },
  {
    fullName: 'Caleb Hughes',
    email: 'caleb.hughes@example.com',
    phone: null,
    orderCount: 1,
    address: { line1: '1325 Broadway Ave', line2: null, city: 'Boise', state: 'ID', postal_code: '83706' },
  },
  {
    fullName: 'Maya Goldberg',
    email: 'maya.goldberg@example.com',
    phone: '(215) 555-0162',
    orderCount: 1,
    address: { line1: '6400 Germantown Ave', line2: null, city: 'Philadelphia', state: 'PA', postal_code: '19119' },
  },
]

/** "Ava Thompson" -> "Ava T." (how reviews show names). */
export function shortName(fullName) {
  const [first, ...rest] = fullName.split(' ')
  const last = rest.at(-1)
  return last ? `${first} ${last[0]}.` : first
}

/**
 * Creates the demo accounts. The auth trigger creates each profile with the
 * full name; confirmed emails mean they can sign in straight away.
 * Returns the customers with their new user ids.
 */
export async function createDemoCustomers(db) {
  const customers = []
  for (const customer of DEMO_CUSTOMERS) {
    const { data, error } = await db.auth.admin.createUser({
      email: customer.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: customer.fullName },
    })
    if (error || !data.user) throw new Error(`create account ${customer.email}: ${error?.message ?? 'no user returned'}`)
    customers.push({ ...customer, id: data.user.id })
  }
  return customers
}

/**
 * Picks each customer's sign-up date: their planned day, or a few days before
 * their first order if that is earlier (nobody orders before joining).
 */
export function assignJoinDates(customers, orders, rng, clock) {
  for (const customer of customers) {
    const firstOrderMs = Math.min(
      ...orders.filter((order) => order.buyer.email === customer.email).map((order) => order.createdMs),
    )
    const plannedMs = clock.daysAgo(customer.joinedDaysAgo)
    const beforeFirstOrderMs = firstOrderMs - rng.between(1, 6) * DAY_MS
    customer.joinedMs = Math.min(plannedMs, beforeFirstOrderMs)
  }
}

/** Fills in the profile fields the sign-up form would not have set. */
export async function updateCustomerProfiles(db, customers) {
  for (const customer of customers) {
    unwrap(
      await db
        .from('profiles')
        .update({
          full_name: customer.fullName,
          phone: customer.phone,
          marketing_opt_in: customer.marketingOptIn,
          created_at: toIso(customer.joinedMs),
        })
        .eq('id', customer.id),
      `update profile ${customer.email}`,
    )
  }
}
