/**
 * The shopping cart, stored in the browser's localStorage so guests can shop
 * without an account. Components read it through the `useCart()` hook.
 *
 * For a signed-in shopper the bag also belongs to their account: the store
 * remembers which account (see CartAccount) and CartAccountSync copies every
 * change to the database, so the bag follows the account, not the browser.
 *
 * Prices stored here are only for display. The checkout server action always
 * re-reads prices and stock from the database.
 */
import { MAX_CART_QUANTITY } from '@/lib/constants'

export interface CartLine {
  variantId: string
  productId: string
  slug: string
  name: string
  /** null for single-variant products. */
  variantTitle: string | null
  imageUrl: string | null
  unitPriceCents: number
  quantity: number
  /** Stock limit when the line was added; null = not tracked. */
  maxQuantity: number | null
}

/** The account a stored bag belongs to. No record means a guest bag. */
export interface CartAccount {
  userId: string
  /** True while this browser has changes the account's saved bag does not have yet. */
  unsaved: boolean
}

const STORAGE_KEY = 'knotted-cart-v1'
const ACCOUNT_KEY = 'knotted-cart-account-v1'
const EMPTY: CartLine[] = []

let cachedLines: CartLine[] | null = null
/** Fallback when localStorage is unavailable, so the account is still known for this page view. */
let memoryAccount: CartAccount | null = null
const listeners = new Set<() => void>()
const shopperChangeListeners = new Set<() => void>()

function clampQuantity(quantity: number, maxQuantity: number | null) {
  const limit = Math.min(MAX_CART_QUANTITY, maxQuantity ?? MAX_CART_QUANTITY)
  return Math.max(0, Math.min(Math.floor(quantity), limit))
}

function isCartLine(value: unknown): value is CartLine {
  const line = value as CartLine
  return (
    typeof line === 'object' &&
    line !== null &&
    typeof line.variantId === 'string' &&
    typeof line.productId === 'string' &&
    typeof line.name === 'string' &&
    typeof line.unitPriceCents === 'number' &&
    typeof line.quantity === 'number'
  )
}

function readLines(): CartLine[] {
  if (cachedLines) return cachedLines
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    cachedLines = Array.isArray(parsed) ? parsed.filter(isCartLine) : []
  } catch {
    cachedLines = []
  }
  return cachedLines
}

function readAccount(): CartAccount | null {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ACCOUNT_KEY) ?? 'null') as Partial<CartAccount> | null
    return parsed && typeof parsed.userId === 'string' ? { userId: parsed.userId, unsaved: parsed.unsaved === true } : null
  } catch {
    return memoryAccount
  }
}

function writeAccount(account: CartAccount | null) {
  memoryAccount = account
  try {
    if (account) window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account))
    else window.localStorage.removeItem(ACCOUNT_KEY)
  } catch {
    // Same as the lines: the in-memory value still works for this page view.
  }
}

/**
 * `source` is 'shopper' for changes made on this page and 'account' when the
 * bag is swapped for an account's saved bag. Only shopper changes are marked
 * unsaved (the flag is stored, so it survives a reload before the save lands).
 */
function writeLines(lines: CartLine[], source: 'shopper' | 'account' = 'shopper') {
  cachedLines = lines.filter((line) => line.quantity > 0)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedLines))
  } catch {
    // Storage can be unavailable (private mode, quota). The cart still works for this page view.
  }
  if (source === 'shopper') {
    const account = readAccount()
    if (account && !account.unsaved) writeAccount({ ...account, unsaved: true })
    shopperChangeListeners.forEach((listener) => listener())
  }
  listeners.forEach((listener) => listener())
}

export const cartStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      cachedLines = null // another tab changed the cart
      listener()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  },

  getSnapshot: readLines,

  /** The server has no cart; this keeps server and first client render identical. */
  getServerSnapshot: () => EMPTY,

  /** Adds a line or increases its quantity. Returns the resulting quantity. */
  add(line: Omit<CartLine, 'quantity'>, quantity = 1) {
    const lines = readLines()
    const existing = lines.find((item) => item.variantId === line.variantId)
    const nextQuantity = clampQuantity((existing?.quantity ?? 0) + quantity, line.maxQuantity)
    writeLines(
      existing
        ? lines.map((item) => (item.variantId === line.variantId ? { ...item, ...line, quantity: nextQuantity } : item))
        : [...lines, { ...line, quantity: nextQuantity }],
    )
    return nextQuantity
  },

  setQuantity(variantId: string, quantity: number) {
    writeLines(
      readLines().map((item) =>
        item.variantId === variantId ? { ...item, quantity: clampQuantity(quantity, item.maxQuantity) } : item,
      ),
    )
  },

  remove(variantId: string) {
    writeLines(readLines().filter((item) => item.variantId !== variantId))
  },

  /** Replaces lines, e.g. after refreshing prices and stock from the server. */
  replace(lines: CartLine[]) {
    writeLines(lines)
  },

  clear() {
    writeLines([])
  },

  /** The account this bag belongs to, or null for a guest bag. */
  getAccount: readAccount,

  /** Swaps in an account's saved bag, e.g. after signing in. Not counted as a shopper change. */
  loadAccountBag(userId: string, lines: CartLine[], { unsaved = false } = {}) {
    writeAccount({ userId, unsaved })
    writeLines(lines, 'account')
  },

  /** Clears the unsaved flag once `lines` reached the account, unless the bag changed again meanwhile. */
  markSaved(userId: string, lines: CartLine[]) {
    if (readAccount()?.userId === userId && readLines() === lines) writeAccount({ userId, unsaved: false })
  },

  /** Empties this browser's bag and detaches it from the account (sign-out). The account keeps its copy. */
  forgetAccount() {
    writeAccount(null)
    writeLines([], 'account')
  },

  /** Runs after each change the shopper makes in this tab (not other tabs, not account loads). */
  onShopperChange(listener: () => void) {
    shopperChangeListeners.add(listener)
    return () => {
      shopperChangeListeners.delete(listener)
    }
  },
}
