/**
 * Domain types. They mirror the tables in supabase/schema.sql one-to-one.
 * Money is always an integer number of cents. Timestamps are ISO strings.
 *
 * Tip: once your Supabase project exists you can also generate exact types with
 *   npx supabase gen types typescript --project-id <ref> > lib/database.types.ts
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export type UserRole = 'customer' | 'admin'
export type ProductStatus = 'draft' | 'active' | 'archived'
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'
export type DiscountType = 'percentage' | 'fixed_amount'
export type CustomRequestStatus = 'new' | 'reviewing' | 'quoted' | 'accepted' | 'declined' | 'completed'
export type MessageStatus = 'new' | 'read' | 'archived'
export type SubscriberStatus = 'subscribed' | 'unsubscribed'

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------
export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  marketing_opt_in: boolean
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  position: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  details: string | null
  category_id: string | null
  status: ProductStatus
  is_featured: boolean
  badge: string | null
  tags: string[]
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  storage_path: string | null
  alt_text: string
  position: number
  created_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  title: string
  sku: string | null
  price_cents: number
  compare_at_price_cents: number | null
  inventory_quantity: number
  track_inventory: boolean
  weight_grams: number | null
  position: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WishlistItem {
  user_id: string
  product_id: string
  created_at: string
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  author_name: string
  rating: number
  title: string | null
  body: string
  status: ReviewStatus
  is_verified_purchase: boolean
  created_at: string
  updated_at: string
}

export interface DiscountCode {
  id: string
  code: string
  description: string | null
  discount_type: DiscountType
  value: number
  min_subtotal_cents: number
  max_redemptions: number | null
  times_redeemed: number
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ShippingAddress {
  name?: string | null
  line1: string
  line2?: string | null
  city: string
  state?: string | null
  postal_code: string
  country: string
}

export interface Order {
  id: string
  order_number: number
  user_id: string | null
  email: string | null
  customer_name: string | null
  phone: string | null
  status: OrderStatus
  currency: string
  subtotal_cents: number
  discount_cents: number
  shipping_cents: number
  tax_cents: number
  total_cents: number
  refunded_cents: number
  discount_code: string | null
  shipping_method: string | null
  shipping_address: ShippingAddress | null
  customer_note: string | null
  admin_note: string | null
  carrier: string | null
  tracking_number: string | null
  tracking_url: string | null
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  inventory_released_at: string | null
  paid_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  variant_id: string | null
  product_name: string
  variant_title: string | null
  sku: string | null
  image_url: string | null
  unit_price_cents: number
  quantity: number
  total_cents: number
  created_at: string
}

export interface CustomRequest {
  id: string
  user_id: string | null
  customer_name: string
  customer_email: string
  phone: string | null
  request_type: string
  budget_cents: number | null
  preferred_colors: string | null
  dimensions: string | null
  deadline: string | null
  description: string
  reference_image_path: string | null
  status: CustomRequestStatus
  quoted_price_cents: number | null
  seller_notes: string | null
  created_at: string
  updated_at: string
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  status: MessageStatus
  created_at: string
}

export interface NewsletterSubscriber {
  id: string
  email: string
  status: SubscriberStatus
  source: string | null
  created_at: string
  updated_at: string
}

export interface StoreSettings {
  id: number
  store_name: string
  tagline: string | null
  support_email: string | null
  support_phone: string | null
  business_address: string | null
  announcement_text: string | null
  currency: string
  flat_shipping_cents: number
  free_shipping_threshold_cents: number | null
  allowed_shipping_countries: string[]
  low_stock_threshold: number
  stripe_tax_enabled: boolean
  instagram_url: string | null
  pinterest_url: string | null
  facebook_url: string | null
  tiktok_url: string | null
  updated_at: string
}

// ---------------------------------------------------------------------------
// Views and composed shapes
// ---------------------------------------------------------------------------

/** A row of the `product_listings` view: what product cards and lists need. */
export interface ProductListing {
  id: string
  name: string
  slug: string
  description: string
  status: ProductStatus
  is_featured: boolean
  badge: string | null
  tags: string[]
  category_id: string | null
  category_name: string | null
  category_slug: string | null
  min_price_cents: number | null
  max_price_cents: number | null
  compare_at_price_cents: number | null
  total_inventory: number | null
  variant_count: number
  in_stock: boolean
  image_url: string | null
  image_alt: string | null
  rating_average: number | null
  review_count: number
  created_at: string
  updated_at: string
}

/** A product page: the product with its category, images (sorted) and active variants (sorted). */
export interface ProductDetail extends Product {
  category: Pick<Category, 'id' | 'name' | 'slug'> | null
  images: ProductImage[]
  variants: ProductVariant[]
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
}

/** A row of the `customer_summaries` view. */
export interface CustomerSummary {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  marketing_opt_in: boolean
  created_at: string
  order_count: number
  total_spent_cents: number
  last_order_at: string | null
}

/** Result of the `admin_dashboard(p_days)` database function. */
export interface DashboardData {
  summary: {
    revenue_cents: number
    orders: number
    average_order_cents: number
    period_revenue_cents: number
    period_orders: number
  }
  daily: { day: string; revenue_cents: number; orders: number }[]
  bestsellers: { product_id: string | null; product_name: string; units: number; revenue_cents: number }[]
  counts: {
    orders_to_fulfill: number
    pending_reviews: number
    new_requests: number
    new_messages: number
    low_stock_variants: number
  }
}
