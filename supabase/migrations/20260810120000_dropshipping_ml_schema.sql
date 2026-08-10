-- ================================================
-- TENUTE — Dropshipping / Mercado Libre schema
-- ================================================
-- Tablas que respaldan la integración con Mercado Libre:
--   /api/ml/auth      → inicia OAuth
--   /api/ml/callback  → guarda tokens en ds_ml_tokens
--   /api/ml/publish   → lee ds_products (+ ds_supplier_products), publica en ML,
--                       registra la publicación en ds_ml_listings
--   /api/ml/webhook   → recibe órdenes de ML y las registra en ds_orders
--
-- Todas estas tablas se acceden EXCLUSIVAMENTE desde el servidor con la
-- service_role key (createAdminClient). Por eso se habilita RLS SIN políticas
-- permisivas: el cliente anónimo/autenticado no puede leerlas ni escribirlas;
-- solo la service_role (que hace bypass de RLS) tiene acceso.
-- ================================================

create extension if not exists pgcrypto;

-- ── Catálogo del proveedor (origen del dropshipping) ─────────────────
create table if not exists public.ds_supplier_products (
  id uuid primary key default gen_random_uuid(),
  supplier text,
  external_id text,
  title text,
  description text,
  price numeric(12,2),
  images text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Producto curado listo para publicar en ML ────────────────────────
-- Relación to-one hacia ds_supplier_products para que el embed
-- `select('*, ds_supplier_products(*)')` de /api/ml/publish devuelva un
-- objeto único (no un array).
create table if not exists public.ds_products (
  id uuid primary key default gen_random_uuid(),
  supplier_product_id uuid references public.ds_supplier_products(id) on delete set null,
  title_cl text not null,
  description_cl text,
  category_ml text default 'MLC1648',
  price_ml numeric(12,2) not null default 0,
  stock_virtual integer not null default 99,
  condition text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ds_products_supplier_product_id_idx
  on public.ds_products (supplier_product_id);

-- ── Tokens OAuth de Mercado Libre ────────────────────────────────────
-- ml_user_id es único porque /api/ml/callback hace upsert onConflict: 'ml_user_id'.
create table if not exists public.ds_ml_tokens (
  id uuid primary key default gen_random_uuid(),
  ml_user_id text not null unique,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Publicaciones activas en Mercado Libre ───────────────────────────
create table if not exists public.ds_ml_listings (
  id uuid primary key default gen_random_uuid(),
  ds_product_id uuid references public.ds_products(id) on delete cascade,
  ml_item_id text not null,
  ml_status text,
  ml_permalink text,
  ml_price numeric(12,2),
  ml_stock integer,
  published_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now()
);

create unique index if not exists ds_ml_listings_ml_item_id_key
  on public.ds_ml_listings (ml_item_id);
create index if not exists ds_ml_listings_ds_product_id_idx
  on public.ds_ml_listings (ds_product_id);

-- ── Órdenes recibidas desde los canales (Mercado Libre, etc.) ────────
create table if not exists public.ds_orders (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'mercadolibre',
  channel_order_id text not null,
  ds_product_id uuid references public.ds_products(id) on delete set null,
  quantity integer not null default 1,
  sale_price integer not null default 0,
  cost_clp integer not null default 0,
  margin_clp integer not null default 0,
  buyer_name text,
  buyer_email text,
  shipping_address jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- channel_order_id es la clave de idempotencia del webhook (busca por
-- channel_order_id antes de insertar). Único por canal.
create unique index if not exists ds_orders_channel_order_key
  on public.ds_orders (channel, channel_order_id);

-- ── Row Level Security: server-only (sin políticas → solo service_role) ─
alter table public.ds_supplier_products enable row level security;
alter table public.ds_products          enable row level security;
alter table public.ds_ml_tokens         enable row level security;
alter table public.ds_ml_listings       enable row level security;
alter table public.ds_orders            enable row level security;
