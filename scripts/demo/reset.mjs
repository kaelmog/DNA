/**
 * Removes demo data, and only demo data. Rows are matched by the demo
 * markers (the @example.com domain, the 'demo' product tag, exact code and
 * slug lists), so the owner's account, products and real orders are safe.
 */
import { DEMO_CATEGORIES } from './catalog.mjs'
import { DEMO_EMAIL_DOMAIN, DEMO_TAG, isDemoEmail, unwrap } from './db.mjs'
import { DEMO_DISCOUNT_CODE_LIST } from './discounts.mjs'

const DEMO_EMAIL_PATTERN = `%${DEMO_EMAIL_DOMAIN}`
const USERS_PER_PAGE = 1000

async function deleteByEmail(db, table, column) {
  const rows = unwrap(await db.from(table).delete().ilike(column, DEMO_EMAIL_PATTERN).select('id'), `delete demo ${table}`)
  return rows.length
}

async function listAllUsers(db) {
  const users = []
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: USERS_PER_PAGE })
    if (error) throw new Error(`list accounts: ${error.message}`)
    users.push(...data.users)
    if (data.users.length < USERS_PER_PAGE) return users
  }
}

/** Demo accounts, never an admin (even one that happens to use an @example.com address). */
async function deleteDemoAccounts(db) {
  const demoUsers = (await listAllUsers(db)).filter((user) => isDemoEmail(user.email))
  if (demoUsers.length === 0) return 0

  const admins = unwrap(
    await db.from('profiles').select('id').eq('role', 'admin').in('id', demoUsers.map((user) => user.id)),
    'load admin profiles',
  )
  const adminIds = new Set(admins.map((profile) => profile.id))

  let deleted = 0
  for (const user of demoUsers) {
    if (adminIds.has(user.id)) {
      console.warn(`  Skipped ${user.email}: it is an admin account.`)
      continue
    }
    // Profiles, wishlists and reviews are removed by ON DELETE CASCADE.
    const { error } = await db.auth.admin.deleteUser(user.id)
    if (error) throw new Error(`delete account ${user.email}: ${error.message}`)
    deleted++
  }
  return deleted
}

async function deleteDemoProducts(db) {
  const products = unwrap(await db.from('products').select('id').contains('tags', [DEMO_TAG]), 'load demo products')
  if (products.length === 0) return 0
  const productIds = products.map((product) => product.id)

  // If an admin uploaded photos to a demo product, remove the files too.
  const images = unwrap(
    await db.from('product_images').select('storage_path').in('product_id', productIds).not('storage_path', 'is', null),
    'load demo product images',
  )
  if (images.length > 0) {
    const { error } = await db.storage.from('product-images').remove(images.map((image) => image.storage_path))
    if (error) console.warn(`  Could not remove uploaded demo product photos: ${error.message}`)
  }

  // Variants and images cascade; order items keep their snapshot with product_id set to null.
  unwrap(await db.from('products').delete().in('id', productIds), 'delete demo products')
  return productIds.length
}

/** Demo categories go only when no products are left in them (an owner may have reused one). */
async function deleteEmptyDemoCategories(db) {
  const categories = unwrap(
    await db.from('categories').select('id, slug').in('slug', DEMO_CATEGORIES.map((category) => category.slug)),
    'load demo categories',
  )
  let deleted = 0
  for (const category of categories) {
    const { count, error } = await db
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', category.id)
    if (error) throw new Error(`count products in ${category.slug}: ${error.message}`)
    if (count > 0) {
      console.warn(`  Kept category ${category.slug}: it still has ${count} product(s).`)
      continue
    }
    unwrap(await db.from('categories').delete().eq('id', category.id), `delete category ${category.slug}`)
    deleted++
  }
  return deleted
}

/** Returns how many rows of each kind were removed. */
export async function removeDemoData(db) {
  // Orders first: demo orders never reserved stock, so deleting them changes no inventory.
  const orders = await deleteByEmail(db, 'orders', 'email')
  const accounts = await deleteDemoAccounts(db)
  const products = await deleteDemoProducts(db)
  const customRequests = await deleteByEmail(db, 'custom_requests', 'customer_email')
  const contactMessages = await deleteByEmail(db, 'contact_messages', 'email')
  const subscribers = await deleteByEmail(db, 'newsletter_subscribers', 'email')
  const discountCodes = unwrap(
    await db.from('discount_codes').delete().in('code', DEMO_DISCOUNT_CODE_LIST).select('id'),
    'delete demo discount codes',
  ).length
  const categories = await deleteEmptyDemoCategories(db)

  return { orders, accounts, products, customRequests, contactMessages, subscribers, discountCodes, categories }
}
