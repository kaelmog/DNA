# Knotted Studio

An online shop for handmade macrame: wall hangings, plant hangers, mini weavings and small goods.
Customers browse, buy and track their orders; the owner runs everything from a built-in admin area.

It works today without card payments (customers order, you collect payment yourself and mark the order as paid)
and switches to Stripe Checkout automatically once Stripe keys are added.

> **Setting the shop up?** Run the site and open [`/todo`](http://localhost:3000/todo): a step-by-step launch
> checklist with live configuration status, copy-ready SQL and every dashboard setting explained.

## Features

**Storefront**

- Catalogue with search, category filters, sorting and pagination
- Product pages with a photo gallery, variants (size, colour) and live stock levels
- Bag with a free-shipping meter and discount codes: kept in the browser for guests, saved to the account once signed in (a guest bag merges in at sign-in)
- Checkout with **manual payments** (no Stripe needed) or **Stripe Checkout**
- Customer accounts: sign-up with email confirmation, password reset, email change, order history with tracking
- Wishlist and product reviews (moderated before they appear)
- Custom order requests with a reference photo, a contact form and a newsletter sign-up
- About, FAQ, shipping and returns, privacy and terms pages

**Admin** (`/admin`, admins only)

- Dashboard: revenue chart, key numbers, recent orders, bestsellers, low stock and what needs attention
- Orders: "Awaiting payment" queue, mark as paid, status changes, tracking numbers, internal notes
- Products and categories: variants, inventory, photos (Supabase Storage), drafts and archiving
- Customers with their order history
- Discount codes (percentage or fixed amount, limits, expiry dates)
- Review moderation, custom requests, contact messages, newsletter subscribers with CSV export
- Store settings: contact details, shipping prices and countries, announcement bar, social links

**Built in**

- SEO: metadata, Open Graph image, JSON-LD structured data, `sitemap.xml`, `robots.txt`
- Security: Row Level Security on every table, admin checks on every admin page and action, server-side price
  calculation, rate limits and honeypots on public forms, strict security headers and Content Security Policy
- Transactional emails through Resend (optional)
- Demo mode: without any keys the site runs with sample products, so you can look around before setting anything up

## Tech stack

| Layer     | Technology                                                             |
| --------- | ---------------------------------------------------------------------- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions), React 19   |
| Language  | TypeScript (strict)                                                    |
| Styling   | Tailwind CSS v4 with design tokens in `app/globals.css`                |
| Database  | Supabase: Postgres, Auth, Storage, Row Level Security                  |
| Payments  | Manual payments, or Stripe Checkout + webhooks (optional)              |
| Email     | Resend HTTP API (optional)                                             |
| Hosting   | Vercel                                                                 |
| Other     | zod (validation), sonner (toasts), lucide-react (icons)                |

## Quick start

Requirements: Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev                  # http://localhost:3000
```

With an empty `.env.local` the site starts in **demo mode**: the storefront shows sample products and anything that
would save data explains that setup is not finished. Nothing crashes without keys.

To make it a real shop, fill in `.env.local` (see [Environment variables](#environment-variables)) and set up the
database below. Restart `npm run dev` after changing environment variables.

## Database setup

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. In **SQL Editor → New query**, paste and run [`supabase/schema.sql`](supabase/schema.sql). It creates every table,
   Row Level Security policy, function, trigger and storage bucket, and is safe to re-run.
3. Optional: run [`supabase/seed.sql`](supabase/seed.sql) for four categories, four starter products and a
   `WELCOME10` discount code.
4. Sign up on the site, then make yourself an admin in the SQL Editor:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@yourdomain.com';
   ```

5. Optional, for trying things out: `npm run seed:demo` fills the database with demo customers, orders, reviews,
   messages and products (it prints the shared demo password; sign in as, for example, `ava.thompson@example.com`).
   Running it again replaces the demo data with an identical copy. **Remove it before launch** with
   `npm run seed:demo:reset`, which deletes only demo data (`@example.com` customers, their orders and form entries,
   products tagged `demo`, the demo discount codes and the `table-textiles` / `gift-sets` categories when empty).
   Your own account, products, `WELCOME10` and the store settings are never touched.

The `/todo` page shows both SQL files with a Copy button, checks whether the schema is installed and whether an admin
exists, and warns while demo data is still present.

## Environment variables

| Variable                               | Required    | Visibility  | Purpose                                                      |
| -------------------------------------- | ----------- | ----------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`                 | Yes         | Public      | Public URL without a trailing slash (emails, SEO, redirects) |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes         | Public      | Supabase project URL                                         |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes         | Public      | Supabase publishable (or legacy anon) key                    |
| `SUPABASE_SECRET_KEY`                  | Yes         | **Secret**  | Server-only key for checkout, public forms and rate limits   |
| `STRIPE_SECRET_KEY`                    | No          | **Secret**  | Switches checkout to Stripe when set                         |
| `STRIPE_WEBHOOK_SECRET`                | With Stripe | **Secret**  | Verifies Stripe webhooks so paid orders are marked paid      |
| `RESEND_API_KEY`                       | Recommended | **Secret**  | Sends order, shipping and notification emails                |
| `EMAIL_FROM`                           | Recommended | Server only | Sender, e.g. `Knotted Studio <orders@yourdomain.com>`        |
| `ADMIN_NOTIFICATION_EMAIL`             | Recommended | Server only | Inbox for new-order, request and contact notifications       |

`.env.example` explains where to find each value. Never commit `.env.local`.

## How checkout works

Prices, discounts, shipping and stock are always recalculated on the server (`lib/pricing.ts`); the browser only sends
variant ids, quantities and a discount code.

**Manual mode** (no `STRIPE_SECRET_KEY`, the default today)

```
Bag ──> /checkout (contact + shipping details)
          └─> create_pending_order()  reserves stock atomically
                └─> Order "Awaiting payment" + confirmation page with payment instructions
                      (+ "order received" email when Resend is set up)
Owner:  Admin → Orders → Awaiting payment
          ├─> payment arrives → "Mark as paid" → mark_order_paid() → confirmation email
          ├─> add tracking → Shipped → shipping email
          └─> still unpaid after 7 days → Cancelled → stock returned by a trigger
```

Edit the payment instructions customers see in `lib/checkout/manual-payment.ts`.

**Stripe mode** (`STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` set)

```
Bag ──> create_pending_order()  reserves stock
          └─> Stripe Checkout (hosted payment page)
                └─> webhook /api/webhooks/stripe
                      ├─ checkout.session.completed / async_payment_succeeded → mark_order_paid() → emails
                      ├─ checkout.session.expired / async_payment_failed      → Cancelled → stock returned
                      └─ charge.refunded                                      → refund recorded
```

Webhooks are verified with the signing secret and processed idempotently (each Stripe event is recorded once).

## Scripts

| Command                   | What it does                                              |
| ------------------------- | --------------------------------------------------------- |
| `npm run dev`             | Development server on http://localhost:3000               |
| `npm run build`           | Production build (must pass before deploying)             |
| `npm run start`           | Serve the production build                                |
| `npm run lint`            | ESLint                                                    |
| `npm run typecheck`       | TypeScript check (`tsc --noEmit`)                         |
| `npm run seed:demo`       | Replace demo data in the database from `.env.local`       |
| `npm run seed:demo:reset` | Remove all demo data, and nothing else                    |

## Project structure

```
app/
  (shop)/            storefront pages sharing the header and footer
  admin/             admin area (role = 'admin' only)
  auth/              email confirmation, OAuth callback and sign-out route handlers
  api/webhooks/      Stripe webhook
  todo/              launch checklist for the store owner
components/
  ui/                design-system primitives (Button, Input, Field, Badge, Card, Table...)
  layout/            header, footer, navigation
  shop/ cart/ checkout/ account/ admin/ forms/ content/ todo/   feature components
hooks/               client hooks (useCart)
lib/
  supabase/          server.ts (visitor session) · client.ts (browser) · public.ts (anonymous) · admin.ts (secret key)
  data/              read-only queries used by pages
  checkout/          checkout, manual payments, Stripe sessions and webhook handlers
  emails/            email templates
  auth.ts            getCurrentUser / getCurrentProfile / requireUser / requireAdmin
  pricing.ts         discount, shipping and totals rules (single source of truth)
  validation.ts      zod building blocks
  types.ts           domain types mirroring the database
scripts/             demo data seeding (npm run seed:demo)
supabase/
  schema.sql         full database schema (tables, RLS, functions, storage)
  seed.sql           optional starter data
```

## Conventions

Read [`AGENTS.md`](AGENTS.md) before changing code. In short: Server Components by default, mutations as Server
Actions that check auth, validate with zod and return an `ActionState`; money is integer cents; Tailwind semantic
tokens instead of hard-coded colours; mobile first; every input labelled. Next.js 16 differs from older versions
(async `params`, `proxy.ts` instead of middleware); its docs live in `node_modules/next/dist/docs/`.

## Deployment

1. Push the code to a **private** GitHub repository.
2. Import it at [vercel.com/new](https://vercel.com/new) and add the environment variables for Production and Preview.
3. Deploy, add your domain under **Project → Settings → Domains** and update the DNS records at your registrar.
4. Set `NEXT_PUBLIC_SITE_URL` to `https://yourdomain.com` and redeploy.
5. In Supabase, set **Authentication → URL Configuration** (Site URL and redirect URLs), the email templates and
   custom SMTP. If you use Stripe, point its webhook at `https://yourdomain.com/api/webhooks/stripe`.

The `/todo` checklist covers each of these in detail, plus testing and the go-live list. On a production deployment
it is only visible to signed-in admins.

## Security notes

- `SUPABASE_SECRET_KEY`, `STRIPE_*` and `RESEND_API_KEY` are server-only. `lib/env.server.ts`, `lib/supabase/admin.ts`,
  `lib/stripe.ts` and `lib/email.ts` import `server-only`, so using them in a client component fails the build.
- Row Level Security is enabled on every table and is the last line of defence; keep `supabase/schema.sql` in sync
  with features and never disable RLS.
- Every admin page, server action and route handler checks the admin role itself; layouts alone do not protect
  server actions.
- Prices, totals, roles and user ids from the browser are never trusted.
- Redirect targets go through `safeRedirectPath()`; user text in emails goes through `escapeHtml()`.
- Public forms use a honeypot field, zod limits and database-backed rate limits.
- Security headers (CSP, HSTS, frame and referrer policies) are set in `next.config.ts`. Add a third-party script's
  domains to the CSP there, or the browser will block it.
- If a key leaks, rotate it in the provider's dashboard, update Vercel and redeploy.
