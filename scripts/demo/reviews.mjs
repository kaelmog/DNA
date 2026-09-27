/**
 * Demo reviews: mostly verified purchases (customers reviewing pieces from
 * their delivered orders), a few gifts (not verified), and one self-promo post
 * that was rejected, so every moderation state has an example.
 *
 * The insert trigger forces status 'pending' and computes is_verified_purchase
 * from real orders, so orders must exist first and statuses are set afterwards.
 */
import { shortName } from './customers.mjs'
import { unwrap } from './db.mjs'
import { DAY_MS, demoId, toIso } from './random.mjs'

const VERIFIED_TARGET = 20
const GIFTED_TARGET = 3
/** The newest reviews wait in the moderation queue. */
const PENDING_COUNT = 6

/**
 * Texts per category, used in this order and written to fit any piece in the
 * category. A 3-star text sits second in a few lists so the ratings look honest.
 */
const REVIEW_TEXTS = {
  'wall-hangings': [
    { rating: 5, title: 'Softens the whole room', body: 'We hung it above our bed and the room instantly feels calmer. The cotton is so soft and the knots are perfectly even. It arrived beautifully wrapped with a little care card.' },
    { rating: 3, title: 'Lovely, but smaller than I pictured', body: 'The craftsmanship is lovely, I just misjudged the size for our tall wall. My fault for not measuring. It now lives happily in the hallway.' },
    { rating: 5, title: 'Even better in person', body: "The photos don't do it justice. The texture is gorgeous and the wood has such lovely character. Already planning my next order." },
    { rating: 4, title: 'Beautiful, a little shedding at first', body: 'Stunning piece and very well made. A few cotton fibers shed during the first week, but that settled quickly. Would buy again.' },
    { rating: 5, title: 'The talk of our living room', body: 'Every guest asks where it is from. It fills the wall above our sofa perfectly and the natural color works with everything.' },
    { rating: 5, title: 'Up on the wall in five minutes', body: 'Simple to hang and it was up in five minutes. The knots are tight and even and the fringe is beautifully trimmed.' },
  ],
  'plant-hangers': [
    { rating: 5, title: 'My pothos has never looked happier', body: 'Sturdy, beautifully knotted and holds a heavy ceramic pot without any stretching. The wooden ring is a lovely touch.' },
    { rating: 3, title: 'Pretty, but the ring is small', body: 'Lovely knotwork, but the wooden ring was a little small for our ceiling hook, so I had to swap it for a bigger one. Otherwise great.' },
    { rating: 5, title: 'Came back for two more', body: 'Loved the first one so much I ordered two more for the kitchen window. Consistent quality every time.' },
    { rating: 4, title: 'Strong and pretty', body: "Exactly as described and very strong. I'd love a longer option for our high ceilings, but a hook extender solved it." },
    { rating: 5, title: 'Perfect for small spaces', body: 'Our apartment has no floor space left, so this was a game changer. Holds a fern beautifully and looks lovely even when empty.' },
    { rating: 4, title: 'Took a minute to level', body: 'The color is warm and exactly like the photos. It took a little adjusting to get the pot sitting level, but it looks great now.' },
    { rating: 5, title: 'Gift for my plant-obsessed sister', body: 'She teared up a little when she opened it. Beautifully packed and it arrived faster than expected.' },
  ],
  'mini-weavings': [
    { rating: 5, title: 'Sweetest nursery accent', body: 'Hung it above the crib and it ties the whole room together. The colors are soft and warm, just like the photos.' },
    { rating: 3, title: 'Cute, colors a bit muted', body: "It's well made, but the colors read more beige than I expected on my wall. Still pretty, just not quite what I pictured." },
    { rating: 5, title: 'Tiny and perfect', body: 'A small piece with so much detail. It sits on my bookshelf and makes me smile every morning.' },
    { rating: 4, title: 'Lovely gift', body: 'Bought it for a baby shower and it was the favorite gift of the day. Would love a few more color options.' },
    { rating: 5, title: 'So much texture', body: 'You can tell it was made by hand with a lot of care. It hangs perfectly straight and the finishing is neat on the back too.' },
  ],
  'small-goods': [
    { rating: 5, title: 'A little joy on my keys', body: 'Such a sweet little keychain. The brass ring feels solid and it has held up perfectly through weeks of daily use.' },
    { rating: 5, title: 'Bought a handful as gifts', body: 'Ordered five for my book club and they were a hit. Each one is slightly unique, which I love.' },
    { rating: 4, title: 'Cute and sturdy', body: 'Smaller than I imagined but really well made. A great stocking stuffer.' },
  ],
  'table-textiles': [
    { rating: 5, title: 'Makes every meal feel special', body: 'It turned our plain oak table into something from a magazine. Beautifully even knots, and it washes well on cold.' },
    { rating: 3, title: 'Well made, color a bit lighter', body: 'Beautiful work and clearly well made, but the color is a little lighter than it looked on my screen. Still happy with it overall.' },
    { rating: 5, title: 'Used every single day', body: 'Pretty, practical and holding up well to daily use and the occasional spilled coffee.' },
    { rating: 5, title: 'Perfect housewarming gift', body: 'Gave these to friends who just moved and they adored them. The natural color goes with everything.' },
  ],
  'gift-sets': [
    { rating: 5, title: "The easiest gift I've ever given", body: "Arrived beautifully packed with a handwritten note. My friend was thrilled and I didn't have to wrap a thing." },
    { rating: 5, title: 'So thoughtfully packed', body: 'Every piece was wrapped in tissue with a little sprig of dried lavender. Such care in every detail.' },
    { rating: 4, title: 'Lovely set', body: "Beautiful quality. I'd happily pay a little more for a gift message card option at checkout." },
  ],
}

/** Breaks the review guidelines on purpose, so the admin list has a rejected example. */
const SELF_PROMO_REVIEW = {
  rating: 5,
  title: 'Follow my plant page!',
  body: 'Love it!! Check out @leafy.loft.deals for 20% off plant stuff, link in my bio.',
}

/** Builds the reviews in memory. Every (product, customer) pair appears at most once. */
export function buildDemoReviews({ orders, customers, pool, rng, clock }) {
  const textsByCategory = Object.fromEntries(Object.entries(REVIEW_TEXTS).map(([category, texts]) => [category, [...texts]]))
  const customersByEmail = new Map(customers.map((customer) => [customer.email, customer]))
  const usedPairs = new Set()
  const reviews = []

  const reviewTimeAfter = (afterMs) =>
    afterMs + Math.min(rng.between(1, 12) * DAY_MS, (clock.nowMs - afterMs) * rng.between(0.3, 0.8))

  /** Unverified reviews land in the last month, after both the sign-up and the product listing. */
  const recentStartFor = (customer, product) =>
    Math.max(customer.joinedMs, clock.daysAgo(Math.min(product.createdDaysAgo, 30)))

  const reviewsPerProduct = new Map()

  /**
   * Next unused text for the product's category. A lukewarm (3-star) text only
   * goes to a piece that already has two reviews, so no product ends up
   * showing a lone 3-star average.
   */
  function takeTextFor(product) {
    const texts = textsByCategory[product.categorySlug] ?? []
    const allowLukewarm = (reviewsPerProduct.get(product.slug) ?? 0) >= 2
    const index = texts.findIndex((text) => allowLukewarm || text.rating >= 4)
    return index === -1 ? undefined : texts.splice(index, 1)[0]
  }

  /** Adds a review unless this customer already reviewed the product or no text is left. */
  function addReview(customer, product, afterMs, status = null, fixedText = null) {
    const pairKey = `${customer.email}:${product.slug}`
    if (usedPairs.has(pairKey)) return false
    const text = fixedText ?? takeTextFor(product)
    if (!text) return false
    usedPairs.add(pairKey)
    reviewsPerProduct.set(product.slug, (reviewsPerProduct.get(product.slug) ?? 0) + 1)
    reviews.push({ id: demoId(`review:${pairKey}`), customer, product, ...text, status, createdMs: reviewTimeAfter(afterMs) })
    return true
  }

  // Verified: customers reviewing active pieces from their delivered orders.
  const deliveredLines = orders
    .filter((order) => order.buyer.isAccount && order.status === 'delivered')
    .flatMap((order) =>
      order.lines.map((line) => ({ customer: customersByEmail.get(order.buyer.email), product: line.product, afterMs: order.deliveredMs })),
    )
    .filter((line) => line.product.status === 'active')

  let verified = 0
  for (const line of rng.shuffle(deliveredLines)) {
    if (verified >= VERIFIED_TARGET) break
    if (addReview(line.customer, line.product, line.afterMs)) verified++
  }

  // Gifts: customers reviewing something they never ordered themselves (not verified).
  const orderedPairs = new Set(orders.flatMap((order) => order.lines.map((line) => `${order.buyer.email}:${line.product.slug}`)))
  const activeProducts = pool.filter((product) => product.status === 'active')
  const giftPairs = customers
    .flatMap((customer) => activeProducts.map((product) => ({ customer, product })))
    .filter(({ customer, product }) => !orderedPairs.has(`${customer.email}:${product.slug}`))

  let gifted = 0
  for (const { customer, product } of rng.shuffle(giftPairs)) {
    if (gifted >= GIFTED_TARGET) break
    if (addReview(customer, product, recentStartFor(customer, product))) gifted++
  }

  // Moderation: newest reviews are still pending, the rest approved.
  reviews.sort((a, b) => b.createdMs - a.createdMs)
  reviews.forEach((review, index) => {
    review.status = index < PENDING_COUNT ? 'pending' : 'approved'
  })

  const promoProduct = activeProducts.find((product) => product.categorySlug === 'plant-hangers') ?? activeProducts[0]
  if (promoProduct) {
    const author = rng.shuffle(customers).find((customer) => !usedPairs.has(`${customer.email}:${promoProduct.slug}`))
    if (author) addReview(author, promoProduct, recentStartFor(author, promoProduct), 'rejected', SELF_PROMO_REVIEW)
  }

  return reviews
}

/** Inserts the reviews, then moves them to their moderation status (the insert trigger always sets 'pending'). */
export async function insertDemoReviews(db, reviews) {
  const rows = reviews.map((review) => ({
    id: review.id,
    product_id: review.product.id,
    user_id: review.customer.id,
    author_name: shortName(review.customer.fullName),
    rating: review.rating,
    title: review.title,
    body: review.body,
    created_at: toIso(review.createdMs),
  }))
  unwrap(await db.from('reviews').insert(rows), 'insert demo reviews')

  for (const status of ['approved', 'rejected']) {
    const ids = reviews.filter((review) => review.status === status).map((review) => review.id)
    if (ids.length > 0) unwrap(await db.from('reviews').update({ status }).in('id', ids), `mark reviews ${status}`)
  }

  // is_verified_purchase is computed by the database, so read it back for the summary.
  const { count: verified, error } = await db
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .in('id', rows.map((row) => row.id))
    .eq('is_verified_purchase', true)
  if (error) throw new Error(`count verified reviews: ${error.message}`)
  return { total: rows.length, verified: verified ?? 0 }
}
