import type { CustomRequestStatus, MessageStatus, OrderStatus, ProductStatus, ReviewStatus } from '@/lib/types'

export const SITE_NAME = 'Knotted Studio'
export const SITE_DESCRIPTION =
  'Thoughtful hand-knotted macrame for softer spaces, made in small batches by Knotted Studio.'

/** Products per page on /shop and admin lists. */
export const PAGE_SIZE = 12
export const ADMIN_PAGE_SIZE = 20

/** Maximum quantity of one variant per cart line. */
export const MAX_CART_QUANTITY = 10

export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_REFERENCE_IMAGE_BYTES = 4 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' },
] as const
export type SortOption = (typeof SORT_OPTIONS)[number]['value']

export const CUSTOM_REQUEST_TYPES = [
  'Custom wall hanging',
  'Custom plant hanger',
  'Wedding or event pieces',
  'Something else',
] as const

/** Badge tone used by <StatusBadge>. */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

interface StatusMeta {
  label: string
  tone: Tone
}

export const ORDER_STATUS: Record<OrderStatus, StatusMeta> = {
  pending: { label: 'Awaiting payment', tone: 'neutral' },
  paid: { label: 'Paid', tone: 'info' },
  processing: { label: 'Processing', tone: 'warning' },
  shipped: { label: 'Shipped', tone: 'info' },
  delivered: { label: 'Delivered', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'danger' },
}

/** Statuses an admin can move a paid order to from the order page. */
export const ADMIN_ORDER_STATUSES: OrderStatus[] = ['paid', 'processing', 'shipped', 'delivered', 'cancelled']

export const PRODUCT_STATUS: Record<ProductStatus, StatusMeta> = {
  draft: { label: 'Draft', tone: 'neutral' },
  active: { label: 'Active', tone: 'success' },
  archived: { label: 'Archived', tone: 'warning' },
}

export const REVIEW_STATUS: Record<ReviewStatus, StatusMeta> = {
  pending: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
}

export const CUSTOM_REQUEST_STATUS: Record<CustomRequestStatus, StatusMeta> = {
  new: { label: 'New', tone: 'info' },
  reviewing: { label: 'Reviewing', tone: 'warning' },
  quoted: { label: 'Quoted', tone: 'info' },
  accepted: { label: 'Accepted', tone: 'success' },
  declined: { label: 'Declined', tone: 'danger' },
  completed: { label: 'Completed', tone: 'success' },
}

export const MESSAGE_STATUS: Record<MessageStatus, StatusMeta> = {
  new: { label: 'New', tone: 'info' },
  read: { label: 'Read', tone: 'neutral' },
  archived: { label: 'Archived', tone: 'neutral' },
}

/** Storefront navigation (header and mobile menu). */
export const MAIN_NAV = [
  { href: '/shop', label: 'Shop all' },
  { href: '/custom', label: 'Custom work' },
  { href: '/about', label: 'Our story' },
  { href: '/contact', label: 'Contact' },
] as const

/** Footer link groups. */
export const FOOTER_NAV = [
  {
    title: 'Shop',
    links: [
      { href: '/shop', label: 'All pieces' },
      { href: '/custom', label: 'Custom orders' },
      { href: '/account/wishlist', label: 'Wishlist' },
    ],
  },
  {
    title: 'Help',
    links: [
      { href: '/faq', label: 'FAQ' },
      { href: '/shipping-returns', label: 'Shipping & returns' },
      { href: '/contact', label: 'Contact us' },
    ],
  },
  {
    title: 'Studio',
    links: [
      { href: '/about', label: 'Our story' },
      { href: '/privacy', label: 'Privacy policy' },
      { href: '/terms', label: 'Terms of service' },
    ],
  },
] as const
