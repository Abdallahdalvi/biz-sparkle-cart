-- =====================================================================
-- electronic_shop schema — TechLab e-commerce
-- Run this entire file in your self-hosted Supabase SQL editor
-- (https://supabase.dalvi.cloud → SQL Editor → New query → paste → Run).
-- Safe to re-run: every statement is idempotent.
-- =====================================================================

-- ---------- 1. Schema ----------
create schema if not exists electronic_shop;
grant usage on schema electronic_shop to anon, authenticated, service_role;

-- IMPORTANT: also add `electronic_shop` to PGRST_DB_SCHEMAS in
-- ~/supabase/docker/.env (comma-separated), then restart:
--   PGRST_DB_SCHEMAS=public,storage,graphql_public,electronic_shop
--   cd ~/supabase/docker && docker compose restart rest

-- ---------- 2. Enums ----------
do $$ begin
  create type electronic_shop.order_status as enum
    ('pending','paid','processing','shipped','delivered','cancelled','refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type electronic_shop.app_role as enum ('admin','staff','customer');
exception when duplicate_object then null; end $$;

-- ---------- 3. Categories ----------
create table if not exists electronic_shop.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
grant select on electronic_shop.categories to anon, authenticated;
grant all on electronic_shop.categories to service_role;
alter table electronic_shop.categories enable row level security;
drop policy if exists "categories public read" on electronic_shop.categories;
create policy "categories public read" on electronic_shop.categories
  for select to anon, authenticated using (true);

-- ---------- 4. Products ----------
create table if not exists electronic_shop.products (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  tagline      text,
  description  text,
  category_id  uuid references electronic_shop.categories(id) on delete set null,
  price_paise  bigint not null check (price_paise >= 0),
  compare_at_paise bigint check (compare_at_paise is null or compare_at_paise >= 0),
  stock        int not null default 0,
  is_active    boolean not null default true,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists products_category_idx on electronic_shop.products(category_id);
create index if not exists products_active_idx on electronic_shop.products(is_active);
grant select on electronic_shop.products to anon, authenticated;
grant all on electronic_shop.products to service_role;
alter table electronic_shop.products enable row level security;
drop policy if exists "products public read" on electronic_shop.products;
create policy "products public read" on electronic_shop.products
  for select to anon, authenticated using (is_active = true);

-- ---------- 5. Product images ----------
create table if not exists electronic_shop.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references electronic_shop.products(id) on delete cascade,
  url         text not null,
  alt         text,
  sort_order  int not null default 0
);
create index if not exists product_images_product_idx on electronic_shop.product_images(product_id);
grant select on electronic_shop.product_images to anon, authenticated;
grant all on electronic_shop.product_images to service_role;
alter table electronic_shop.product_images enable row level security;
drop policy if exists "product_images public read" on electronic_shop.product_images;
create policy "product_images public read" on electronic_shop.product_images
  for select to anon, authenticated using (true);

-- ---------- 6. Product variants ----------
create table if not exists electronic_shop.product_variants (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references electronic_shop.products(id) on delete cascade,
  label           text not null,
  price_delta_paise bigint not null default 0,
  stock           int not null default 0,
  sku             text
);
create index if not exists product_variants_product_idx on electronic_shop.product_variants(product_id);
grant select on electronic_shop.product_variants to anon, authenticated;
grant all on electronic_shop.product_variants to service_role;
alter table electronic_shop.product_variants enable row level security;
drop policy if exists "product_variants public read" on electronic_shop.product_variants;
create policy "product_variants public read" on electronic_shop.product_variants
  for select to anon, authenticated using (true);

-- ---------- 7. User roles (app-scoped, in this schema only) ----------
create table if not exists electronic_shop.user_roles (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role    electronic_shop.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on electronic_shop.user_roles to authenticated;
grant all on electronic_shop.user_roles to service_role;
alter table electronic_shop.user_roles enable row level security;
drop policy if exists "user_roles self read" on electronic_shop.user_roles;
create policy "user_roles self read" on electronic_shop.user_roles
  for select to authenticated using (user_id = auth.uid());

create or replace function electronic_shop.has_role(_user_id uuid, _role electronic_shop.app_role)
returns boolean
language sql stable security definer
set search_path = electronic_shop, public
as $$
  select exists (
    select 1 from electronic_shop.user_roles
    where user_id = _user_id and role = _role
  );
$$;
grant execute on function electronic_shop.has_role(uuid, electronic_shop.app_role)
  to anon, authenticated, service_role;

-- ---------- 8. Addresses ----------
create table if not exists electronic_shop.addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  full_name  text not null,
  phone      text not null,
  line1      text not null,
  line2      text,
  city       text not null,
  state      text not null,
  pincode    text not null,
  country    text not null default 'IN',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists addresses_user_idx on electronic_shop.addresses(user_id);
grant select, insert, update, delete on electronic_shop.addresses to authenticated;
grant all on electronic_shop.addresses to service_role;
alter table electronic_shop.addresses enable row level security;
drop policy if exists "addresses self all" on electronic_shop.addresses;
create policy "addresses self all" on electronic_shop.addresses
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- 9. Orders ----------
create table if not exists electronic_shop.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text not null unique
                       default ('ES-' || to_char(now(),'YYYYMMDD') || '-' ||
                                upper(substring(replace(gen_random_uuid()::text,'-','') from 1 for 6))),
  user_id            uuid references auth.users(id) on delete set null,
  email              text not null,
  phone              text not null,
  shipping_address   jsonb not null,
  subtotal_paise     bigint not null,
  shipping_paise     bigint not null default 0,
  tax_paise          bigint not null default 0,
  total_paise        bigint not null,
  currency           text not null default 'INR',
  status             electronic_shop.order_status not null default 'pending',
  razorpay_order_id  text,
  razorpay_payment_id text,
  shiprocket_order_id text,
  shiprocket_shipment_id text,
  tracking_url       text,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists orders_user_idx on electronic_shop.orders(user_id);
create index if not exists orders_status_idx on electronic_shop.orders(status);
grant select, insert, update on electronic_shop.orders to authenticated;
grant all on electronic_shop.orders to service_role;
alter table electronic_shop.orders enable row level security;

drop policy if exists "orders self read"   on electronic_shop.orders;
drop policy if exists "orders admin read"  on electronic_shop.orders;
drop policy if exists "orders admin update" on electronic_shop.orders;
create policy "orders self read"  on electronic_shop.orders for select to authenticated using (user_id = auth.uid());
create policy "orders admin read" on electronic_shop.orders for select to authenticated using (electronic_shop.has_role(auth.uid(),'admin'));
create policy "orders admin update" on electronic_shop.orders for update to authenticated using (electronic_shop.has_role(auth.uid(),'admin'));

-- ---------- 10. Order items ----------
create table if not exists electronic_shop.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references electronic_shop.orders(id) on delete cascade,
  product_id  uuid references electronic_shop.products(id) on delete set null,
  variant_id  uuid references electronic_shop.product_variants(id) on delete set null,
  name        text not null,
  variant_label text,
  unit_price_paise bigint not null,
  qty         int not null check (qty > 0),
  image_url   text
);
create index if not exists order_items_order_idx on electronic_shop.order_items(order_id);
grant select on electronic_shop.order_items to authenticated;
grant all on electronic_shop.order_items to service_role;
alter table electronic_shop.order_items enable row level security;
drop policy if exists "order_items self read" on electronic_shop.order_items;
create policy "order_items self read" on electronic_shop.order_items
  for select to authenticated using (
    exists (select 1 from electronic_shop.orders o
            where o.id = order_id and (o.user_id = auth.uid()
                                       or electronic_shop.has_role(auth.uid(),'admin')))
  );

-- ---------- 11. Admin write policies ----------
grant select, insert, update, delete on electronic_shop.products to authenticated;
grant select, insert, update, delete on electronic_shop.categories to authenticated;
grant select, insert, update, delete on electronic_shop.product_images to authenticated;
grant select, insert, update, delete on electronic_shop.product_variants to authenticated;
grant select, insert, update, delete on electronic_shop.user_roles to authenticated;

drop policy if exists "products admin write"          on electronic_shop.products;
drop policy if exists "categories admin write"        on electronic_shop.categories;
drop policy if exists "product_images admin write"    on electronic_shop.product_images;
drop policy if exists "product_variants admin write"  on electronic_shop.product_variants;
drop policy if exists "user_roles admin all"          on electronic_shop.user_roles;
create policy "products admin write"         on electronic_shop.products         for all to authenticated using (electronic_shop.has_role(auth.uid(),'admin')) with check (electronic_shop.has_role(auth.uid(),'admin'));
create policy "categories admin write"       on electronic_shop.categories       for all to authenticated using (electronic_shop.has_role(auth.uid(),'admin')) with check (electronic_shop.has_role(auth.uid(),'admin'));
create policy "product_images admin write"   on electronic_shop.product_images   for all to authenticated using (electronic_shop.has_role(auth.uid(),'admin')) with check (electronic_shop.has_role(auth.uid(),'admin'));
create policy "product_variants admin write" on electronic_shop.product_variants for all to authenticated using (electronic_shop.has_role(auth.uid(),'admin')) with check (electronic_shop.has_role(auth.uid(),'admin'));
create policy "user_roles admin all"         on electronic_shop.user_roles       for all to authenticated using (electronic_shop.has_role(auth.uid(),'admin')) with check (electronic_shop.has_role(auth.uid(),'admin'));

-- ---------- 12. updated_at trigger ----------
create or replace function electronic_shop.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists products_touch on electronic_shop.products;
create trigger products_touch before update on electronic_shop.products
  for each row execute function electronic_shop.touch_updated_at();

drop trigger if exists orders_touch on electronic_shop.orders;
create trigger orders_touch before update on electronic_shop.orders
  for each row execute function electronic_shop.touch_updated_at();

-- ---------- 13. Seed categories ----------
insert into electronic_shop.categories (slug, name, sort_order) values
  ('phones',      'Phones',      1),
  ('audio',       'Audio',       2),
  ('wearables',   'Wearables',   3),
  ('accessories', 'Accessories', 4)
on conflict (slug) do nothing;

-- ---------- 14. Store Settings (Hero Banners & Storefront CMS) ----------
create table if not exists electronic_shop.store_settings (
  id text primary key default 'hero_banners',
  hero_1_image text not null,
  hero_1_link text not null,
  hero_1_label text not null,
  hero_2_image text not null,
  hero_2_link text not null,
  hero_2_label text not null,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table if exists electronic_shop.store_settings add column if not exists metadata jsonb not null default '{}'::jsonb;

grant select on electronic_shop.store_settings to anon, authenticated;
grant all on electronic_shop.store_settings to service_role;
grant select, insert, update, delete on electronic_shop.store_settings to authenticated;
alter table electronic_shop.store_settings enable row level security;
drop policy if exists "store_settings public read" on electronic_shop.store_settings;
drop policy if exists "store_settings admin write" on electronic_shop.store_settings;
create policy "store_settings public read" on electronic_shop.store_settings for select to anon, authenticated using (true);
create policy "store_settings admin write" on electronic_shop.store_settings for all to authenticated using (electronic_shop.has_role(auth.uid(),'admin')) with check (electronic_shop.has_role(auth.uid(),'admin'));

insert into electronic_shop.store_settings (id, hero_1_image, hero_1_link, hero_1_label, hero_2_image, hero_2_link, hero_2_label, metadata)
values (
  'hero_banners',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAN4IWZ0o1xacmmTaAaeV4gJ2JM37nCA4Vu9FMZfWJ6CWZ9FReqzNA1zUw6b0z8fcVQRPejT-QofOpAaJlfeyZecXQpvnPZozhZdiZEDOj_qYqjYW64yxxY868yjxmBThtOdw-4pzxzc42bvkJogioVcwVPkGQS6ry7BHc3bO3PdOrAO0BS-A9PtmtRSFRGsIExVtxY8Knwi18rphz2LtaWGl0UbhG2lpi0gT9sXZRW0-4tpyNY7rWZZMvKc--gTZ9bjlCWX_yVWtpO',
  '/product/qin-f22-pro',
  'QIN F22 PRO',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCm_n1zeaqwYJAsYDw_UO82ywo_kvjRIEVnrSe0IXmiCc0w0f4amIl5GPi1qwb0x_zgKFT2Di4PiqffML-GPcSWoClZySpGw7qQ5KichDioDJ3LGIIdRDCp23b_h_HuycTaBl8fCwkN65HACqY2RyAUbuVYXAMUet7R9QZmQP_Hm2XrrGU9PNnw72oQQSSb34P6kf49pocIY_D43rLRUqke2u3g9uKBoBgCxKU3v86La9sWNrLWM38CWCn2F1LBUJKie2Quec_FQzp_',
  '/product/qin-f22-pro',
  'KEYBOARD HYBRID',
  '{}'::jsonb
) on conflict (id) do nothing;

-- ---------- 15. Storage Bucket for Product Images ----------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product-images public read" on storage.objects;
drop policy if exists "product-images auth upload" on storage.objects;
create policy "product-images public read" on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
create policy "product-images auth upload" on storage.objects for insert to authenticated using (bucket_id = 'product-images');

-- ---------- 16. Webhook Idempotency Table ----------
create table if not exists electronic_shop.webhook_events (
  event_id text primary key,
  created_at timestamptz not null default now()
);
grant select, insert on electronic_shop.webhook_events to service_role;

-- ---------- 17. Atomic Stock Decrement RPC ----------
create or replace function electronic_shop.decrement_stock(p_product_id uuid, p_variant_id uuid, p_qty int)
returns boolean
language plpgsql security definer
set search_path = electronic_shop, public
as $$
begin
  if p_variant_id is not null then
    update electronic_shop.product_variants
    set stock = stock - p_qty
    where id = p_variant_id and stock >= p_qty;
  end if;

  if p_product_id is not null then
    update electronic_shop.products
    set stock = stock - p_qty
    where id = p_product_id and stock >= p_qty;
  end if;

  return true;
end;
$$;
grant execute on function electronic_shop.decrement_stock(uuid, uuid, int) to service_role;

-- =====================================================================
-- AFTER signing up once at /auth, promote yourself to admin:
--   insert into electronic_shop.user_roles (user_id, role)
--   values ('<your-auth-user-uuid>', 'admin');
-- Find the UUID in Supabase Studio → Authentication → Users.
-- =====================================================================