-- =============================================================================
-- Knotted Studio: complete Supabase database schema
-- -----------------------------------------------------------------------------
-- How to use:
--   Supabase Dashboard -> SQL Editor -> New query -> paste this file -> Run.
--   Then (optionally) run seed.sql for starter categories and products.
--
-- The script is re-runnable: tables use IF NOT EXISTS, functions use
-- CREATE OR REPLACE, and policies/triggers are dropped before being recreated.
--
-- Security model:
--   * Row Level Security (RLS) is enabled on every table.
--   * Shoppers can read the published catalog and their own data only.
--   * Admins are profiles with role = 'admin' (see public.is_admin()).
--   * Orders, payments, form submissions and rate limits are written only by
--     the server using the secret (service role) key, which bypasses RLS.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Extensions
-- -----------------------------------------------------------------------------
create extension if not exists pg_trgm with schema extensions; -- fast ILIKE product search


-- -----------------------------------------------------------------------------
-- 1. Enum types
-- -----------------------------------------------------------------------------
do $$ begin create type public.user_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin create type public.product_status as enum ('draft', 'active', 'archived');
exception when duplicate_object then null; end $$;

-- pending   = checkout started, waiting for payment (stock is reserved)
-- paid      = payment confirmed by Stripe
-- processing/shipped/delivered = fulfilment steps set by an admin
-- cancelled = checkout expired, payment failed, or cancelled by an admin (stock is returned)
-- refunded  = fully refunded in Stripe
do $$ begin create type public.order_status as enum
  ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin create type public.review_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin create type public.discount_type as enum ('percentage', 'fixed_amount');
exception when duplicate_object then null; end $$;

do $$ begin create type public.custom_request_status as enum
  ('new', 'reviewing', 'quoted', 'accepted', 'declined', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin create type public.message_status as enum ('new', 'read', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin create type public.subscriber_status as enum ('subscribed', 'unsubscribed');
exception when duplicate_object then null; end $$;


-- -----------------------------------------------------------------------------
-- 2. Shared trigger function: keep updated_at current
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- -----------------------------------------------------------------------------
-- 3. Tables
-- -----------------------------------------------------------------------------

-- 3.1 Profiles: one row per auth user, created automatically on sign-up.
create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  email              text not null default '',
  full_name          text check (char_length(full_name) <= 120),
  phone              text check (char_length(phone) <= 40),
  role               public.user_role not null default 'customer',
  marketing_opt_in   boolean not null default false,
  stripe_customer_id text unique,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- 3.2 Categories
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 500),
  image_url   text,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3.3 Products. Price and stock live on product_variants (every product has at least one).
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(name) between 1 and 160),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description     text not null default '' check (char_length(description) <= 10000),
  details         text check (char_length(details) <= 5000),          -- materials, size, care notes
  category_id     uuid references public.categories (id) on delete set null,
  status          public.product_status not null default 'draft',
  is_featured     boolean not null default false,
  badge           text check (char_length(badge) <= 30),              -- e.g. "Bestseller", "New"
  tags            text[] not null default '{}',
  seo_title       text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 160),
  search_text     text generated always as (lower(name || ' ' || description)) stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 3.4 Product images (first by position is the primary image)
create table if not exists public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  url          text not null,
  storage_path text,  -- object path in the product-images bucket; null for static/external images
  alt_text     text not null default '' check (char_length(alt_text) <= 200),
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);

-- 3.5 Product variants: sellable units with their own SKU, price and stock.
create table if not exists public.product_variants (
  id                     uuid primary key default gen_random_uuid(),
  product_id             uuid not null references public.products (id) on delete cascade,
  title                  text not null default 'Default' check (char_length(title) between 1 and 120),
  sku                    text unique check (char_length(sku) <= 64),
  price_cents            integer not null check (price_cents >= 0),
  compare_at_price_cents integer check (compare_at_price_cents is null or compare_at_price_cents >= 0),
  inventory_quantity     integer not null default 0 check (inventory_quantity >= 0),
  track_inventory        boolean not null default true,  -- false = made to order / unlimited
  weight_grams           integer check (weight_grams is null or weight_grams >= 0),
  position               integer not null default 0,
  is_active              boolean not null default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- 3.6 Wishlists
create table if not exists public.wishlist_items (
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- 3.7 Product reviews (moderated: new reviews start as 'pending')
create table if not exists public.reviews (
  id                   uuid primary key default gen_random_uuid(),
  product_id           uuid not null references public.products (id) on delete cascade,
  user_id              uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  author_name          text not null check (char_length(author_name) between 1 and 80),
  rating               smallint not null check (rating between 1 and 5),
  title                text check (char_length(title) <= 120),
  body                 text not null check (char_length(body) between 1 and 4000),
  status               public.review_status not null default 'pending',
  is_verified_purchase boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (product_id, user_id)
);

-- 3.8 Discount codes. value = percent (1-100) or an amount in cents.
create table if not exists public.discount_codes (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique check (code ~ '^[A-Z0-9_-]{3,32}$'),
  description        text check (char_length(description) <= 200),
  discount_type      public.discount_type not null,
  value              integer not null check (value > 0),
  min_subtotal_cents integer not null default 0 check (min_subtotal_cents >= 0),
  max_redemptions    integer check (max_redemptions is null or max_redemptions > 0),
  times_redeemed     integer not null default 0 check (times_redeemed >= 0),
  starts_at          timestamptz,
  ends_at            timestamptz,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (discount_type <> 'percentage' or value <= 100),
  check (starts_at is null or ends_at is null or ends_at > starts_at)
);

-- 3.9 Orders. All money is stored in the smallest currency unit (cents).
create table if not exists public.orders (
  id                         uuid primary key default gen_random_uuid(),
  order_number               bigint generated always as identity (start with 1001) unique,
  user_id                    uuid references public.profiles (id) on delete set null,
  email                      text check (char_length(email) <= 254),  -- filled from Stripe for guests
  customer_name              text check (char_length(customer_name) <= 200),
  phone                      text check (char_length(phone) <= 40),
  status                     public.order_status not null default 'pending',
  currency                   text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
  subtotal_cents             integer not null default 0 check (subtotal_cents >= 0),
  discount_cents             integer not null default 0 check (discount_cents >= 0),
  shipping_cents             integer not null default 0 check (shipping_cents >= 0),
  tax_cents                  integer not null default 0 check (tax_cents >= 0),
  total_cents                integer not null default 0 check (total_cents >= 0),
  refunded_cents             integer not null default 0 check (refunded_cents >= 0),
  discount_code              text,
  shipping_method            text,
  -- { "name", "line1", "line2", "city", "state", "postal_code", "country" }
  shipping_address           jsonb,
  customer_note              text check (char_length(customer_note) <= 1000),
  admin_note                 text check (char_length(admin_note) <= 4000),
  carrier                    text check (char_length(carrier) <= 60),
  tracking_number            text check (char_length(tracking_number) <= 100),
  tracking_url               text check (char_length(tracking_url) <= 500),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id   text,
  inventory_released_at      timestamptz, -- set when reserved stock was returned
  paid_at                    timestamptz,
  shipped_at                 timestamptz,
  delivered_at               timestamptz,
  cancelled_at               timestamptz,
  cancel_reason              text check (char_length(cancel_reason) <= 500),
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

-- 3.10 Order line items: a snapshot of what was bought, kept even if the product changes.
create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  product_id       uuid references public.products (id) on delete set null,
  variant_id       uuid references public.product_variants (id) on delete set null,
  product_name     text not null,
  variant_title    text,
  sku              text,
  image_url        text,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity         integer not null check (quantity > 0),
  total_cents      integer generated always as (unit_price_cents * quantity) stored,
  created_at       timestamptz not null default now()
);

-- 3.11 Custom (made-to-order) requests from the storefront form
create table if not exists public.custom_requests (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references public.profiles (id) on delete set null,
  customer_name        text not null check (char_length(customer_name) between 1 and 120),
  customer_email       text not null check (char_length(customer_email) <= 254),
  phone                text check (char_length(phone) <= 40),
  request_type         text not null check (char_length(request_type) between 1 and 80),
  budget_cents         integer check (budget_cents is null or budget_cents > 0),
  preferred_colors     text check (char_length(preferred_colors) <= 200),
  dimensions           text check (char_length(dimensions) <= 120),
  deadline             date,
  description          text not null check (char_length(description) between 1 and 4000),
  reference_image_path text, -- object path in the private custom-requests bucket
  status               public.custom_request_status not null default 'new',
  quoted_price_cents   integer check (quoted_price_cents is null or quoted_price_cents >= 0),
  seller_notes         text check (char_length(seller_notes) <= 4000),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- 3.12 Contact form messages
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null check (char_length(email) <= 254),
  subject    text check (char_length(subject) <= 200),
  message    text not null check (char_length(message) between 1 and 5000),
  status     public.message_status not null default 'new',
  created_at timestamptz not null default now()
);

-- 3.13 Newsletter subscribers (emails are stored lowercase)
create table if not exists public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique check (email = lower(email) and char_length(email) <= 254),
  status     public.subscriber_status not null default 'subscribed',
  source     text check (char_length(source) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.14 Store settings: a single row (id = 1) editable from /admin/settings
create table if not exists public.store_settings (
  id                            smallint primary key default 1 check (id = 1),
  store_name                    text not null default 'Knotted Studio' check (char_length(store_name) between 1 and 80),
  tagline                       text check (char_length(tagline) <= 160),
  support_email                 text check (char_length(support_email) <= 254),
  support_phone                 text check (char_length(support_phone) <= 40),
  business_address              text check (char_length(business_address) <= 300),
  announcement_text             text check (char_length(announcement_text) <= 160),
  currency                      text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
  flat_shipping_cents           integer not null default 800 check (flat_shipping_cents >= 0),
  free_shipping_threshold_cents integer check (free_shipping_threshold_cents is null or free_shipping_threshold_cents >= 0),
  allowed_shipping_countries    text[] not null default array['US'],
  low_stock_threshold           integer not null default 3 check (low_stock_threshold >= 0),
  stripe_tax_enabled            boolean not null default false,
  instagram_url                 text,
  pinterest_url                 text,
  facebook_url                  text,
  tiktok_url                    text,
  updated_at                    timestamptz not null default now()
);

-- 3.15 Processed Stripe webhook events (idempotency + audit). Server only.
create table if not exists public.stripe_events (
  id           text primary key,
  type         text not null,
  processed_at timestamptz not null default now()
);

-- 3.16 Fixed-window rate limiting for public forms. Server only.
create table if not exists public.rate_limits (
  key               text primary key,
  window_started_at timestamptz not null default now(),
  hits              integer not null default 0
);


-- -----------------------------------------------------------------------------
-- 4. Indexes
-- -----------------------------------------------------------------------------
create index if not exists profiles_email_idx            on public.profiles (lower(email));
create unique index if not exists categories_name_key    on public.categories (lower(name));
create index if not exists products_category_idx         on public.products (category_id);
create index if not exists products_status_created_idx   on public.products (status, created_at desc);
create index if not exists products_featured_idx         on public.products (is_featured) where is_featured;
create index if not exists products_search_idx           on public.products using gin (search_text extensions.gin_trgm_ops);
create index if not exists product_images_product_idx    on public.product_images (product_id, position);
create index if not exists product_variants_product_idx  on public.product_variants (product_id, position);
create index if not exists wishlist_items_product_idx    on public.wishlist_items (product_id);
create index if not exists reviews_product_status_idx    on public.reviews (product_id, status);
create index if not exists reviews_user_idx              on public.reviews (user_id);
create index if not exists orders_user_idx               on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx             on public.orders (status, created_at desc);
create index if not exists orders_email_idx              on public.orders (lower(email));
create index if not exists orders_paid_at_idx            on public.orders (paid_at);
create index if not exists orders_payment_intent_idx     on public.orders (stripe_payment_intent_id);
create index if not exists order_items_order_idx         on public.order_items (order_id);
create index if not exists order_items_product_idx       on public.order_items (product_id);
create index if not exists order_items_variant_idx       on public.order_items (variant_id);
create index if not exists custom_requests_status_idx    on public.custom_requests (status, created_at desc);
create index if not exists custom_requests_user_idx      on public.custom_requests (user_id);
create index if not exists contact_messages_status_idx   on public.contact_messages (status, created_at desc);


-- -----------------------------------------------------------------------------
-- 5. updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'categories', 'products', 'product_variants', 'reviews',
    'discount_codes', 'orders', 'custom_requests', 'newsletter_subscribers', 'store_settings'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end $$;


-- -----------------------------------------------------------------------------
-- 6. Authorization helper
-- -----------------------------------------------------------------------------
-- True when the signed-in user has role = 'admin'. SECURITY DEFINER lets RLS
-- policies call it without recursively applying the profiles policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;


-- -----------------------------------------------------------------------------
-- 7. Auth triggers: create/sync profiles and attach guest orders
-- -----------------------------------------------------------------------------
create or replace function public.handle_auth_user_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.profiles (id, email, full_name)
    values (
      new.id,
      coalesce(new.email, ''),
      nullif(left(trim(new.raw_user_meta_data ->> 'full_name'), 120), '')
    )
    on conflict (id) do nothing;
  elsif new.email is distinct from old.email then
    update public.profiles set email = coalesce(new.email, '') where id = new.id;
  end if;

  -- Once an email address is confirmed, link earlier guest orders placed with it.
  if new.email is not null
     and new.email_confirmed_at is not null
     and (tg_op = 'INSERT' or old.email_confirmed_at is null or new.email is distinct from old.email)
  then
    update public.orders
       set user_id = new.id
     where user_id is null
       and lower(email) = lower(new.email);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_change on auth.users;
create trigger on_auth_user_change
  after insert or update of email, email_confirmed_at on auth.users
  for each row execute function public.handle_auth_user_change();


-- -----------------------------------------------------------------------------
-- 8. Order status trigger: timestamps + returning/re-reserving stock
-- -----------------------------------------------------------------------------
-- Stock is reserved when checkout starts (see create_pending_order).
--   * Moving to 'cancelled' returns the reserved stock (once).
--   * Moving from 'cancelled' back to a paid state (for example a late
--     payment) takes the stock again.
create or replace function public.handle_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  case new.status
    when 'paid'      then new.paid_at      := coalesce(new.paid_at, now());
    when 'shipped'   then new.shipped_at   := coalesce(new.shipped_at, now());
    when 'delivered' then new.delivered_at := coalesce(new.delivered_at, now());
    when 'cancelled' then new.cancelled_at := coalesce(new.cancelled_at, now());
    else null;
  end case;

  if new.status = 'cancelled' and new.inventory_released_at is null then
    update public.product_variants v
       set inventory_quantity = v.inventory_quantity + oi.quantity
      from public.order_items oi
     where oi.order_id = new.id
       and oi.variant_id = v.id
       and v.track_inventory;
    new.inventory_released_at := now();
  elsif old.status = 'cancelled' and new.inventory_released_at is not null then
    update public.product_variants v
       set inventory_quantity = greatest(0, v.inventory_quantity - oi.quantity)
      from public.order_items oi
     where oi.order_id = new.id
       and oi.variant_id = v.id
       and v.track_inventory;
    new.inventory_released_at := null;
    new.cancelled_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists on_order_status_change on public.orders;
create trigger on_order_status_change
  before update of status on public.orders
  for each row execute function public.handle_order_status_change();


-- -----------------------------------------------------------------------------
-- 9. Review trigger: force moderation and compute "verified purchase"
-- -----------------------------------------------------------------------------
create or replace function public.prepare_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    new.status := 'pending';
  end if;

  new.is_verified_purchase := exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.user_id = new.user_id
      and oi.product_id = new.product_id
      and o.status in ('paid', 'processing', 'shipped', 'delivered')
  );

  return new;
end;
$$;

drop trigger if exists prepare_review on public.reviews;
create trigger prepare_review
  before insert on public.reviews
  for each row execute function public.prepare_review();


-- -----------------------------------------------------------------------------
-- 10. Server-side functions (RPC)
-- -----------------------------------------------------------------------------

-- 10.1 Create a pending order and reserve stock atomically.
-- Called by the checkout server action with the secret key. Prices are
-- calculated on the server from the database, never taken from the browser.
-- p_order: { user_id, email, currency, subtotal_cents, discount_cents,
--            shipping_cents, tax_cents, total_cents, discount_code,
--            shipping_method, customer_note }
-- p_items: [{ variant_id, product_name, variant_title, sku,
--             image_url, unit_price_cents, quantity }]
-- Errors: 'EMPTY_CART', 'VARIANT_UNAVAILABLE:<variant_id>' or 'INSUFFICIENT_STOCK:<variant_id>'
create or replace function public.create_pending_order(p_order jsonb, p_items jsonb)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order    public.orders;
  v_item     jsonb;
  v_variant  public.product_variants;
  v_quantity integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  insert into public.orders (
    user_id, email, currency, subtotal_cents, discount_cents, shipping_cents,
    tax_cents, total_cents, discount_code, shipping_method, customer_note
  ) values (
    nullif(p_order ->> 'user_id', '')::uuid,
    nullif(p_order ->> 'email', ''),
    coalesce(nullif(p_order ->> 'currency', ''), 'usd'),
    (p_order ->> 'subtotal_cents')::integer,
    coalesce((p_order ->> 'discount_cents')::integer, 0),
    coalesce((p_order ->> 'shipping_cents')::integer, 0),
    coalesce((p_order ->> 'tax_cents')::integer, 0),
    (p_order ->> 'total_cents')::integer,
    nullif(p_order ->> 'discount_code', ''),
    nullif(p_order ->> 'shipping_method', ''),
    nullif(p_order ->> 'customer_note', '')
  )
  returning * into v_order;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_quantity := (v_item ->> 'quantity')::integer;

    -- Lock the variant row so concurrent checkouts cannot oversell it.
    select v.* into v_variant
    from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = (v_item ->> 'variant_id')::uuid
      and v.is_active
      and p.status = 'active'
    for update of v;

    if not found then
      raise exception 'VARIANT_UNAVAILABLE:%', v_item ->> 'variant_id';
    end if;

    if v_variant.track_inventory then
      if v_variant.inventory_quantity < v_quantity then
        raise exception 'INSUFFICIENT_STOCK:%', v_variant.id;
      end if;
      update public.product_variants
         set inventory_quantity = inventory_quantity - v_quantity
       where id = v_variant.id;
    end if;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, variant_title, sku,
      image_url, unit_price_cents, quantity
    ) values (
      v_order.id,
      v_variant.product_id,
      v_variant.id,
      v_item ->> 'product_name',
      nullif(v_item ->> 'variant_title', ''),
      nullif(v_item ->> 'sku', ''),
      nullif(v_item ->> 'image_url', ''),
      (v_item ->> 'unit_price_cents')::integer,
      v_quantity
    );
  end loop;

  return v_order;
end;
$$;

-- 10.2 Mark an order as paid (called by the Stripe webhook). Idempotent:
-- returns true only the first time, so emails are sent exactly once.
-- p_payment: { payment_intent_id, email, customer_name, phone, shipping_address,
--              shipping_method, subtotal_cents, discount_cents, shipping_cents,
--              tax_cents, total_cents }
create or replace function public.mark_order_paid(p_order_id uuid, p_payment jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_discount_code text;
begin
  update public.orders
     set status                   = 'paid',
         stripe_payment_intent_id = coalesce(nullif(p_payment ->> 'payment_intent_id', ''), stripe_payment_intent_id),
         email                    = coalesce(email, nullif(p_payment ->> 'email', '')),
         customer_name            = coalesce(nullif(p_payment ->> 'customer_name', ''), customer_name),
         phone                    = coalesce(nullif(p_payment ->> 'phone', ''), phone),
         shipping_address         = coalesce(p_payment -> 'shipping_address', shipping_address),
         shipping_method          = coalesce(nullif(p_payment ->> 'shipping_method', ''), shipping_method),
         subtotal_cents           = coalesce((p_payment ->> 'subtotal_cents')::integer, subtotal_cents),
         discount_cents           = coalesce((p_payment ->> 'discount_cents')::integer, discount_cents),
         shipping_cents           = coalesce((p_payment ->> 'shipping_cents')::integer, shipping_cents),
         tax_cents                = coalesce((p_payment ->> 'tax_cents')::integer, tax_cents),
         total_cents              = coalesce((p_payment ->> 'total_cents')::integer, total_cents)
   where id = p_order_id
     and status in ('pending', 'cancelled')
  returning discount_code into v_discount_code;

  if not found then
    return false;
  end if;

  if v_discount_code is not null then
    update public.discount_codes
       set times_redeemed = times_redeemed + 1
     where code = v_discount_code;
  end if;

  return true;
end;
$$;

-- 10.3 Fixed-window rate limiter. Returns false when the limit is exceeded.
create or replace function public.check_rate_limit(p_key text, p_max_hits integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits integer;
begin
  insert into public.rate_limits as rl (key, window_started_at, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case
                 when rl.window_started_at < now() - make_interval(secs => p_window_seconds) then 1
                 else rl.hits + 1
               end,
        window_started_at = case
                 when rl.window_started_at < now() - make_interval(secs => p_window_seconds) then now()
                 else rl.window_started_at
               end
  returning hits into v_hits;

  return v_hits <= p_max_hits;
end;
$$;

-- 10.4 Admin dashboard numbers in one call. Runs with the caller's rights, so
-- RLS still applies; it also refuses non-admins explicitly.
create or replace function public.admin_dashboard(p_days integer default 30)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_since  timestamptz := now() - make_interval(days => greatest(p_days, 1));
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  with sold as (
    select *
    from public.orders
    where status in ('paid', 'processing', 'shipped', 'delivered', 'refunded')
  )
  select jsonb_build_object(
    'summary', (
      select jsonb_build_object(
        'revenue_cents',        coalesce(sum(total_cents - refunded_cents), 0),
        'orders',               count(*),
        'average_order_cents',  coalesce(round(avg(total_cents)), 0),
        'period_revenue_cents', coalesce(sum(total_cents - refunded_cents) filter (where paid_at >= v_since), 0),
        'period_orders',        count(*) filter (where paid_at >= v_since)
      )
      from sold
    ),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'day', to_char(d.day, 'YYYY-MM-DD'),
               'revenue_cents', d.revenue_cents,
               'orders', d.orders) order by d.day), '[]'::jsonb)
      from (
        select gs::date as day,
               coalesce(sum(s.total_cents - s.refunded_cents), 0) as revenue_cents,
               count(s.id) as orders
        from generate_series(v_since::date + 1, now()::date, interval '1 day') as gs
        left join sold s on s.paid_at::date = gs::date
        group by gs
      ) d
    ),
    'bestsellers', (
      select coalesce(jsonb_agg(b), '[]'::jsonb)
      from (
        select oi.product_id, oi.product_name,
               sum(oi.quantity)::integer as units,
               sum(oi.total_cents)::integer as revenue_cents
        from public.order_items oi
        join sold s on s.id = oi.order_id
        group by oi.product_id, oi.product_name
        order by units desc, revenue_cents desc
        limit 5
      ) b
    ),
    'counts', jsonb_build_object(
      'orders_to_fulfill', (select count(*) from public.orders where status in ('paid', 'processing')),
      'pending_reviews',   (select count(*) from public.reviews where status = 'pending'),
      'new_requests',      (select count(*) from public.custom_requests where status = 'new'),
      'new_messages',      (select count(*) from public.contact_messages where status = 'new'),
      'low_stock_variants', (
        select count(*)
        from public.product_variants v
        join public.products p on p.id = v.product_id
        where v.track_inventory and v.is_active and p.status = 'active'
          and v.inventory_quantity <= coalesce((select low_stock_threshold from public.store_settings where id = 1), 3)
      )
    )
  ) into v_result;

  return v_result;
end;
$$;


-- -----------------------------------------------------------------------------
-- 11. Views (security_invoker = the caller's RLS applies)
-- -----------------------------------------------------------------------------

-- 11.1 One row per product with price range, stock, primary image and rating.
-- Storefront queries must still filter status = 'active' (admins see all rows).
drop view if exists public.product_listings;
create view public.product_listings
with (security_invoker = true) as
select
  p.id,
  p.name,
  p.slug,
  p.description,
  p.status,
  p.is_featured,
  p.badge,
  p.tags,
  p.search_text,
  p.category_id,
  c.name                       as category_name,
  c.slug                       as category_slug,
  v.min_price_cents,
  v.max_price_cents,
  v.compare_at_price_cents,
  v.total_inventory,
  coalesce(v.variant_count, 0) as variant_count,
  coalesce(v.in_stock, false)  as in_stock,
  img.url                      as image_url,
  img.alt_text                 as image_alt,
  r.rating_average,
  coalesce(r.review_count, 0)  as review_count,
  p.created_at,
  p.updated_at
from public.products p
left join public.categories c on c.id = p.category_id
left join lateral (
  select
    min(pv.price_cents)                                          as min_price_cents,
    max(pv.price_cents)                                          as max_price_cents,
    max(pv.compare_at_price_cents)                               as compare_at_price_cents,
    sum(pv.inventory_quantity) filter (where pv.track_inventory) as total_inventory,
    count(*)                                                     as variant_count,
    bool_or(not pv.track_inventory or pv.inventory_quantity > 0) as in_stock
  from public.product_variants pv
  where pv.product_id = p.id and pv.is_active
) v on true
left join lateral (
  select pi.url, pi.alt_text
  from public.product_images pi
  where pi.product_id = p.id
  order by pi.position, pi.created_at
  limit 1
) img on true
left join lateral (
  select round(avg(rv.rating)::numeric, 1) as rating_average, count(*) as review_count
  from public.reviews rv
  where rv.product_id = p.id and rv.status = 'approved'
) r on true;

-- 11.2 Customers with lifetime order stats (admins see everyone).
drop view if exists public.customer_summaries;
create view public.customer_summaries
with (security_invoker = true) as
select
  pr.id,
  pr.email,
  pr.full_name,
  pr.phone,
  pr.role,
  pr.marketing_opt_in,
  pr.created_at,
  count(o.id) filter (where o.status in ('paid', 'processing', 'shipped', 'delivered')) as order_count,
  coalesce(sum(o.total_cents - o.refunded_cents)
    filter (where o.status in ('paid', 'processing', 'shipped', 'delivered', 'refunded')), 0) as total_spent_cents,
  max(o.created_at) filter (where o.status not in ('pending', 'cancelled')) as last_order_at
from public.profiles pr
left join public.orders o on o.user_id = pr.id
group by pr.id;


-- -----------------------------------------------------------------------------
-- 12. Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles               enable row level security;
alter table public.categories             enable row level security;
alter table public.products               enable row level security;
alter table public.product_images         enable row level security;
alter table public.product_variants       enable row level security;
alter table public.wishlist_items         enable row level security;
alter table public.reviews                enable row level security;
alter table public.discount_codes         enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.custom_requests        enable row level security;
alter table public.contact_messages       enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.store_settings         enable row level security;
alter table public.stripe_events          enable row level security; -- no policies: server only
alter table public.rate_limits            enable row level security; -- no policies: server only

-- Profiles ---------------------------------------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Categories -------------------------------------------------------------------
drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public" on public.categories
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all" on public.categories
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Products ---------------------------------------------------------------------
drop policy if exists "products_select_public" on public.products;
create policy "products_select_public" on public.products
  for select to anon, authenticated
  using (status = 'active' or (select public.is_admin()));

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Product images -----------------------------------------------------------------
drop policy if exists "product_images_select_public" on public.product_images;
create policy "product_images_select_public" on public.product_images
  for select to anon, authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
    or (select public.is_admin())
  );

drop policy if exists "product_images_admin_all" on public.product_images;
create policy "product_images_admin_all" on public.product_images
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Product variants ---------------------------------------------------------------
drop policy if exists "product_variants_select_public" on public.product_variants;
create policy "product_variants_select_public" on public.product_variants
  for select to anon, authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
    or (select public.is_admin())
  );

drop policy if exists "product_variants_admin_all" on public.product_variants;
create policy "product_variants_admin_all" on public.product_variants
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Wishlist -----------------------------------------------------------------------
drop policy if exists "wishlist_select_own" on public.wishlist_items;
create policy "wishlist_select_own" on public.wishlist_items
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "wishlist_insert_own" on public.wishlist_items;
create policy "wishlist_insert_own" on public.wishlist_items
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "wishlist_delete_own" on public.wishlist_items;
create policy "wishlist_delete_own" on public.wishlist_items
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Reviews ------------------------------------------------------------------------
drop policy if exists "reviews_select_visible" on public.reviews;
create policy "reviews_select_visible" on public.reviews
  for select to anon, authenticated
  using (status = 'approved' or user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
  );

drop policy if exists "reviews_delete_own_or_admin" on public.reviews;
create policy "reviews_delete_own_or_admin" on public.reviews
  for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "reviews_update_admin" on public.reviews;
create policy "reviews_update_admin" on public.reviews
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Discount codes (validated server-side; only admins can read them directly) ------
drop policy if exists "discount_codes_admin_all" on public.discount_codes;
create policy "discount_codes_admin_all" on public.discount_codes
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Orders (created by the server; customers can read their own) -------------------
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Order items ----------------------------------------------------------------------
drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );

-- Custom requests (created by the server) ------------------------------------------
drop policy if exists "custom_requests_select_own_or_admin" on public.custom_requests;
create policy "custom_requests_select_own_or_admin" on public.custom_requests
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "custom_requests_update_admin" on public.custom_requests;
create policy "custom_requests_update_admin" on public.custom_requests
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "custom_requests_delete_admin" on public.custom_requests;
create policy "custom_requests_delete_admin" on public.custom_requests
  for delete to authenticated
  using ((select public.is_admin()));

-- Contact messages (created by the server) ------------------------------------------
drop policy if exists "contact_messages_admin_select" on public.contact_messages;
create policy "contact_messages_admin_select" on public.contact_messages
  for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "contact_messages_admin_update" on public.contact_messages;
create policy "contact_messages_admin_update" on public.contact_messages
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "contact_messages_admin_delete" on public.contact_messages;
create policy "contact_messages_admin_delete" on public.contact_messages
  for delete to authenticated
  using ((select public.is_admin()));

-- Newsletter subscribers (created by the server) -------------------------------------
drop policy if exists "newsletter_admin_select" on public.newsletter_subscribers;
create policy "newsletter_admin_select" on public.newsletter_subscribers
  for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "newsletter_admin_update" on public.newsletter_subscribers;
create policy "newsletter_admin_update" on public.newsletter_subscribers
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "newsletter_admin_delete" on public.newsletter_subscribers;
create policy "newsletter_admin_delete" on public.newsletter_subscribers
  for delete to authenticated
  using ((select public.is_admin()));

-- Store settings (public read, admin update) -------------------------------------------
drop policy if exists "store_settings_select_public" on public.store_settings;
create policy "store_settings_select_public" on public.store_settings
  for select to anon, authenticated
  using (true);

drop policy if exists "store_settings_admin_update" on public.store_settings;
create policy "store_settings_admin_update" on public.store_settings
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- -----------------------------------------------------------------------------
-- 13. Privileges
-- -----------------------------------------------------------------------------
-- Customers may only edit these profile columns; role and stripe_customer_id
-- can only be changed with the secret key or in the SQL editor.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone, marketing_opt_in) on public.profiles to authenticated;

-- Server-only tables: no direct API access at all.
revoke all on public.stripe_events from anon, authenticated;
revoke all on public.rate_limits   from anon, authenticated;

-- Views
grant select on public.product_listings   to anon, authenticated;
grant select on public.customer_summaries to authenticated;

-- Functions: lock down the ones that must only run on the server.
revoke execute on function public.create_pending_order(jsonb, jsonb)       from public, anon, authenticated;
revoke execute on function public.mark_order_paid(uuid, jsonb)             from public, anon, authenticated;
revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.handle_auth_user_change()                from public, anon, authenticated;
revoke execute on function public.handle_order_status_change()             from public, anon, authenticated;
revoke execute on function public.prepare_review()                         from public, anon, authenticated;
grant execute on function public.create_pending_order(jsonb, jsonb)        to service_role;
grant execute on function public.mark_order_paid(uuid, jsonb)              to service_role;
grant execute on function public.check_rate_limit(text, integer, integer)  to service_role;

revoke execute on function public.admin_dashboard(integer) from public, anon;
grant execute on function public.admin_dashboard(integer)  to authenticated;
grant execute on function public.is_admin()                to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 14. Storage buckets and policies
-- -----------------------------------------------------------------------------
-- product-images: public read (served by URL), only admins can write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- custom-requests: private. The server uploads customer reference images
-- with the secret key; admins view them through short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'custom-requests', 'custom-requests', false, 4194304,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_admin_select" on storage.objects;
create policy "product_images_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

drop policy if exists "custom_requests_admin_select" on storage.objects;
create policy "custom_requests_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'custom-requests' and (select public.is_admin()));

drop policy if exists "custom_requests_admin_delete" on storage.objects;
create policy "custom_requests_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'custom-requests' and (select public.is_admin()));


-- -----------------------------------------------------------------------------
-- 15. Default data
-- -----------------------------------------------------------------------------
insert into public.store_settings (id, tagline, announcement_text, free_shipping_threshold_cents)
values (
  1,
  'Thoughtful hand-knotted macrame for softer spaces.',
  'Free shipping on orders over $100 · Hand-knotted in small batches',
  10000
)
on conflict (id) do nothing;

-- Done. Next step: sign up on the site, then make yourself an admin:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
