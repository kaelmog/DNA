<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Knotted Studio: project guide

Handmade macrame e-commerce store. Next.js 16 App Router, React 19, TypeScript (strict),
Tailwind CSS v4, Supabase (Postgres, Auth, Storage), Stripe Checkout, Resend (optional email).

## Commands

```bash
npm run dev        # local dev server on http://localhost:3000
npm run build      # production build (must pass before deploying)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

## Folder map

```
app/
  (shop)/            customer-facing pages, share the header/footer layout
  admin/             admin area (role = 'admin' only)
  auth/              auth route handlers (email confirm, OAuth callback, sign out)
  api/webhooks/      Stripe webhook
  todo/              launch checklist for the store owner
components/
  ui/                design-system primitives (Button, Input, Field, Badge, Card, Table...)
  layout/            header, footer, navigation
  shop/ cart/ account/ admin/ forms/   feature components
hooks/               client hooks (useCart)
lib/
  supabase/          server.ts (user session) · client.ts (browser) · public.ts (anonymous) · admin.ts (SECRET key)
  data/              read-only queries used by pages (catalog, settings, wishlist...)
  emails/            email templates
  auth.ts            getCurrentUser / getCurrentProfile / requireUser / requireAdmin
  actions.ts         ActionState helpers for server actions
  validation.ts      zod building blocks
  pricing.ts         discount / shipping / totals rules (single source of truth)
  types.ts           domain types mirroring the database
  constants.ts       statuses, nav, limits
supabase/
  schema.sql         full database schema (tables, RLS, functions, storage)
  seed.sql           optional starter data
```

## Conventions

- **Server Components by default.** Add `'use client'` only for interactivity (state, effects, event handlers).
- **Next.js 16:** `params`, `searchParams`, `cookies()` and `headers()` are async (await them).
  Middleware is now `proxy.ts`. `revalidateTag(tag, 'max')` needs two arguments; prefer `revalidatePath()`.
- **Mutations are Server Actions** in an `actions.ts` next to the route that uses them. They:
  1. start with `'use server'`,
  2. check auth (`requireAdmin()` for every admin action, `getCurrentUser()` for customer actions),
  3. validate input with zod (`lib/validation.ts` helpers),
  4. return an `ActionState` via `actionSuccess()` / `actionError()` / `actionValidationError()`,
  5. call `revalidatePath()` for pages that show the changed data.
  Forms use `useActionState(action, initialActionState)` plus `<SubmitButton>` and `<FormMessage>`.
- **Supabase clients:** use `lib/supabase/server.ts` (acts as the visitor, RLS applies) for almost everything.
  `lib/supabase/admin.ts` bypasses RLS and is only for checkout, the Stripe webhook and public form inserts.
  Never import `admin.ts`, `env.server.ts`, `stripe.ts` or `email.ts` into client components.
- **Demo mode:** when `isSupabaseConfigured` (from `lib/env.ts`) is false, reads return demo data and
  writes return `actionError(NOT_CONFIGURED_MESSAGE)`. Nothing may crash without env vars.
- **Money** is integer cents everywhere. Format with `formatMoney(cents, currency)`.
- **Styling:** Tailwind with the semantic tokens in `app/globals.css` (`bg-background`, `text-muted-foreground`,
  `bg-primary`, `border-border`, brand colours `clay`, `sand`, `linen`, `espresso`...). No hard-coded hex colours.
  Mobile first: design at 375px wide, then `sm:` / `md:` / `lg:`. Touch targets at least 40px tall.
- **UI primitives:** `components/ui/*` (Button + buttonVariants, Input, Textarea, Select, Checkbox, Field, Label,
  Badge, StatusBadge, Card, Table, Pagination, Container, PageHeading, EmptyState, Skeleton, SubmitButton, FormMessage).
- **Images:** `next/image` with `sizes`. Product images come from Supabase Storage or `/public`.
- **Accessibility:** every input has a label, icon buttons have `aria-label`, status/error text uses `role`.
- **Readability:** small focused files, descriptive names, a short comment explaining *why* for anything non-obvious.

## Security rules

- Every admin page and admin server action calls `await requireAdmin()` first.
- Never trust prices, totals, roles or user ids from the browser. Recompute on the server.
- Redirect targets from query strings go through `safeRedirectPath()`.
- User text in emails goes through `escapeHtml()`.
- Public forms use the honeypot field, zod limits and `rateLimit()`.
- Row Level Security is the last line of defence. Keep policies in `supabase/schema.sql` in sync with features.
