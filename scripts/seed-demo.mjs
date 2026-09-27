/**
 * Demo data for Knotted Studio, so every storefront and admin page looks alive.
 *
 *   npm run seed:demo        remove old demo data, then create a fresh set
 *   npm run seed:demo:reset  only remove demo data
 *
 * Writes to the Supabase project in .env.local with the secret key. Demo rows
 * are marked (@example.com emails, the 'demo' product tag, fixed code and slug
 * lists) and the reset removes nothing else. Data is generated from a fixed
 * seed with dates relative to now, so every run gives the same store.
 */
import { fileURLToPath } from 'node:url'

import { DEMO_PRODUCTS, ensureDemoCategories, insertDemoProducts, loadProductPool } from './demo/catalog.mjs'
import {
  DEMO_GUESTS,
  assignJoinDates,
  createDemoCustomers,
  updateCustomerProfiles,
} from './demo/customers.mjs'
import { DEMO_PASSWORD, PAID_STATUSES, createServiceClient, unwrap } from './demo/db.mjs'
import { insertDemoDiscountCodes, loadWelcomeRule } from './demo/discounts.mjs'
import {
  insertDemoContactMessages,
  insertDemoCustomRequests,
  insertDemoSubscribers,
  insertDemoWishlists,
} from './demo/extras.mjs'
import { buildDemoOrders, insertDemoOrders } from './demo/orders.mjs'
import { createClock, createRng } from './demo/random.mjs'
import { removeDemoData } from './demo/reset.mjs'
import { buildDemoReviews, insertDemoReviews } from './demo/reviews.mjs'

/** Any fixed number works; changing it reshuffles the demo data. */
const SEED = 20260927
const DEFAULT_SETTINGS = { currency: 'usd', flat_shipping_cents: 800, free_shipping_threshold_cents: 10000 }
const ORDER_STATUS_ORDER = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

function loadEnvironment() {
  try {
    process.loadEnvFile(fileURLToPath(new URL('../.env.local', import.meta.url)))
  } catch {
    // No .env.local: fall back to variables already set in the shell.
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!url || !secretKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY. Add them to .env.local first.')
    process.exit(1)
  }
  return { url, secretKey }
}

async function loadStoreSettings(db) {
  const row = unwrap(
    await db
      .from('store_settings')
      .select('currency, flat_shipping_cents, free_shipping_threshold_cents')
      .eq('id', 1)
      .maybeSingle(),
    'load store settings',
  )
  if (!row) console.warn('No store_settings row found; using the default shipping rules.')
  return row ?? DEFAULT_SETTINGS
}

function countBy(items, keyOf) {
  const counts = {}
  for (const item of items) counts[keyOf(item)] = (counts[keyOf(item)] ?? 0) + 1
  return counts
}

function describeCounts(counts, order = Object.keys(counts)) {
  return order
    .filter((key) => counts[key])
    .map((key) => `${counts[key]} ${key}`)
    .join(' · ')
}

function printTable(title, rows) {
  const labelWidth = Math.max(...rows.map(([label]) => label.length))
  const valueWidth = Math.max(...rows.map(([, value]) => String(value).length))
  console.log(`\n${title}`)
  for (const [label, value, detail] of rows) {
    const line = `  ${label.padEnd(labelWidth)}  ${String(value).padStart(valueWidth)}`
    console.log(detail ? `${line}   ${detail}` : line)
  }
}

async function createDemoData(db) {
  const clock = createClock(Date.now())
  const rng = createRng(SEED)
  const settings = await loadStoreSettings(db)
  const welcomeRule = await loadWelcomeRule(db)

  console.log('Creating catalog...')
  const categoriesAdded = await ensureDemoCategories(db)
  const catalog = await insertDemoProducts(db, clock)
  const pool = await loadProductPool(db)

  console.log('Creating customer accounts...')
  const customers = await createDemoCustomers(db)

  console.log('Creating orders, reviews and the rest...')
  const orders = buildDemoOrders({ rng, clock, pool, customers, guests: DEMO_GUESTS, settings, welcomeRule })
  assignJoinDates(customers, orders, rng, clock)
  const inserted = await insertDemoOrders(db, orders, settings.currency)
  await updateCustomerProfiles(db, customers)
  const discountCodes = await insertDemoDiscountCodes(db, orders, clock)

  const reviews = buildDemoReviews({ orders, customers, pool, rng, clock })
  const reviewCounts = await insertDemoReviews(db, reviews)
  const wishlistItems = await insertDemoWishlists(db, { customers, pool, rng, clock })
  const customRequests = await insertDemoCustomRequests(db, { customers, clock })
  const contactMessages = await insertDemoContactMessages(db, { clock })
  const subscribers = await insertDemoSubscribers(db, { customers, clock })

  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.currency.toUpperCase() })
  const paidOrders = orders.filter((order) => PAID_STATUSES.includes(order.status))
  const netRevenue = paidOrders.reduce((sum, order) => sum + (order.status === 'refunded' ? 0 : order.totalCents), 0)
  const guestOrders = orders.filter((order) => !order.buyer.isAccount).length
  const productStatuses = countBy(DEMO_PRODUCTS, (product) => product.status)

  printTable('Created', [
    ['Categories added', categoriesAdded],
    ['Demo products', catalog.products, describeCounts(productStatuses, ['active', 'draft', 'archived'])],
    ['Variants', catalog.variants],
    ['Customer accounts', customers.length],
    ['Orders', inserted.orders, describeCounts(countBy(orders, (order) => order.status), ORDER_STATUS_ORDER)],
    ['Order items', inserted.items, `${guestOrders} guest orders · ${money.format(netRevenue / 100)} net paid revenue`],
    [
      'Reviews',
      reviewCounts.total,
      `${describeCounts(countBy(reviews, (review) => review.status), ['approved', 'pending', 'rejected'])} · ${reviewCounts.verified} verified`,
    ],
    ['Wishlist items', wishlistItems],
    ['Custom requests', customRequests],
    ['Contact messages', contactMessages],
    ['Newsletter subscribers', subscribers.total, `${subscribers.unsubscribed} unsubscribed`],
    [
      'Discount codes',
      discountCodes.length,
      discountCodes.map((code) => `${code.code} ${code.times_redeemed}${code.max_redemptions ? `/${code.max_redemptions}` : ''}`).join(' · '),
    ],
  ])

  const ordersByEmail = countBy(orders, (order) => order.buyer.email)
  console.log(`\nDemo logins (shared password: ${DEMO_PASSWORD})`)
  for (const customer of customers) {
    const count = ordersByEmail[customer.email] ?? 0
    console.log(`  ${customer.email.padEnd(30)} ${customer.fullName} · ${count} order${count === 1 ? '' : 's'}`)
  }
  console.log('\nRemove it all again with: npm run seed:demo:reset')
}

async function main() {
  const resetOnly = process.argv.includes('--reset')
  const { url, secretKey } = loadEnvironment()
  const db = createServiceClient(url, secretKey)

  console.log(`Knotted Studio demo data · ${new URL(url).host}`)
  console.log('Removing existing demo data...')
  const removed = await removeDemoData(db)
  printTable('Removed', [
    ['Orders', removed.orders],
    ['Customer accounts', removed.accounts],
    ['Demo products', removed.products],
    ['Custom requests', removed.customRequests],
    ['Contact messages', removed.contactMessages],
    ['Newsletter subscribers', removed.subscribers],
    ['Discount codes', removed.discountCodes],
    ['Categories', removed.categories],
  ])

  if (resetOnly) {
    console.log('\nDemo data removed. Your own account, products and orders were not touched.')
    return
  }
  console.log('')
  await createDemoData(db)
}

main().catch((error) => {
  console.error(`\nDemo seed failed: ${error instanceof Error ? error.message : error}`)
  console.error('Fix the problem and run it again; each run starts by removing any partial demo data.')
  process.exitCode = 1
})
