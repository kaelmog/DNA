-- =============================================================================
-- Knotted Studio: optional starter data
-- -----------------------------------------------------------------------------
-- Run AFTER schema.sql. Adds four categories, the four launch products (using
-- the images already in /public), and a WELCOME10 discount code.
-- Safe to re-run: existing rows (matched by slug / SKU / code) are skipped.
-- Replace or archive these products from /admin/products before launch.
-- =============================================================================

-- Categories -------------------------------------------------------------------
insert into public.categories (name, slug, description, position) values
  ('Wall hangings', 'wall-hangings', 'Statement pieces that soften a wall.',               1),
  ('Plant hangers', 'plant-hangers', 'Hand-knotted cradles for your leafy friends.',        2),
  ('Mini weavings', 'mini-weavings', 'Small woven accents for shelves and nurseries.',      3),
  ('Small goods',   'small-goods',   'Keychains, coasters and little everyday knots.',      4)
on conflict (slug) do nothing;

-- Products ---------------------------------------------------------------------
insert into public.products (name, slug, description, details, category_id, status, is_featured, badge, tags)
select v.name, v.slug, v.description, v.details, c.id, 'active', v.is_featured, v.badge, v.tags
from (values
  (
    'Sol Wall Hanging', 'sol-wall-hanging', 'wall-hangings',
    'A sun-warmed statement piece knotted from soft natural cotton and hung on reclaimed driftwood. Sol brings texture and calm to living rooms, bedrooms and entryways.',
    E'Materials: 100% natural cotton cord, reclaimed wood dowel\nSize: approx. 24 × 36 in (61 × 91 cm)\nCare: dust gently or use a hairdryer on the cool setting',
    true, 'Bestseller', array['wall', 'cotton', 'boho']
  ),
  (
    'Haven Plant Hanger', 'haven-plant-hanger', 'plant-hangers',
    'A sturdy, hand-knotted hanger that cradles pots up to 8 inches wide. Hang it by a sunny window and let your plants take centre stage.',
    E'Materials: 5 mm cotton rope, wooden ring\nLength: approx. 40 in (102 cm)\nFits pots up to 8 in (20 cm) wide. Pot not included.',
    true, 'New', array['plants', 'cotton']
  ),
  (
    'Mara Rainbow', 'mara-rainbow', 'mini-weavings',
    'A cheerful mini rainbow in terracotta, sand and blush tones. Perfect for nurseries, shelves and little nooks.',
    E'Materials: cotton cord and wool blend\nSize: approx. 8 × 6 in (20 × 15 cm)',
    true, 'Limited', array['rainbow', 'nursery', 'gift']
  ),
  (
    'Little Knot Keychain', 'little-knot-keychain', 'small-goods',
    'A tiny knotted keychain with a brass ring. A thoughtful little gift or a sweet treat for yourself.',
    E'Materials: cotton cord, brass key ring\nLength: approx. 5 in (13 cm)',
    false, null, array['gift', 'accessory']
  )
) as v(name, slug, category_slug, description, details, is_featured, badge, tags)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;

-- Variants (price and stock) -------------------------------------------------------
insert into public.product_variants (product_id, title, sku, price_cents, compare_at_price_cents, inventory_quantity, track_inventory, position)
select p.id, v.title, v.sku, v.price_cents, v.compare_at_price_cents, v.inventory_quantity, v.track_inventory, v.position
from (values
  ('sol-wall-hanging',     'Medium (24 × 36 in)', 'KS-SOL-M',  12800, null::integer, 6,  true, 0),
  ('sol-wall-hanging',     'Large (30 × 48 in)',  'KS-SOL-L',  16800, null::integer, 3,  true, 1),
  ('haven-plant-hanger',   'Natural',             'KS-HAV-NAT', 4600, null::integer, 12, true, 0),
  ('haven-plant-hanger',   'Terracotta',          'KS-HAV-TER', 4600, null::integer, 8,  true, 1),
  ('mara-rainbow',         'Default',             'KS-MARA',    3800, 4400,          5,  true, 0),
  ('little-knot-keychain', 'Default',             'KS-KEY',     1800, null::integer, 0,  false, 0)
) as v(product_slug, title, sku, price_cents, compare_at_price_cents, inventory_quantity, track_inventory, position)
join public.products p on p.slug = v.product_slug
on conflict (sku) do nothing;

-- Images (static files that ship with the site) -------------------------------------
insert into public.product_images (product_id, url, alt_text, position)
select p.id, v.url, v.alt_text, 0
from (values
  ('sol-wall-hanging',     '/macrame-hero.png',     'Cream macrame wall hanging on a terracotta wall'),
  ('haven-plant-hanger',   '/macrame-planter.png',  'Macrame plant hanger holding a leafy plant'),
  ('mara-rainbow',         '/macrame-rainbow.png',  'Mini macrame rainbow in warm earthy tones'),
  ('little-knot-keychain', '/macrame-keychain.png', 'Small macrame keychain with a brass ring')
) as v(product_slug, url, alt_text)
join public.products p on p.slug = v.product_slug
where not exists (select 1 from public.product_images i where i.product_id = p.id);

-- Discount code ------------------------------------------------------------------
insert into public.discount_codes (code, description, discount_type, value, min_subtotal_cents)
values ('WELCOME10', '10% off a first order', 'percentage', 10, 0)
on conflict (code) do nothing;
