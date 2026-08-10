-- ================================================
-- TENUTE — Tablas de integración con Mercado Libre
-- ================================================
-- Estas tablas respaldan el flujo de Mercado Libre:
--   /api/ml/callback  → guarda/renueva el token del vendedor en ds_ml_tokens
--   /api/ml/publish   → registra la publicación en ds_ml_listings
--   /api/ml/webhook   → registra las órdenes entrantes en ds_orders
--
-- NOTA sobre el estado real de la base de datos (producción):
-- El esquema de dropshipping ya existía en la base creado fuera de migraciones.
-- Las tablas base `ds_suppliers`, `ds_supplier_products` y `ds_products` son
-- PRERREQUISITO y NO se (re)definen aquí para no divergir de su esquema real.
-- Esta migración solo asegura, de forma idempotente, las tablas propias de la
-- integración con Mercado Libre. En producción es un no-op (ya existen); sirve
-- para reproducir el esquema de ML en entornos nuevos.
--
-- Acceso: exclusivamente server-side con la service_role key (createAdminClient),
-- por eso se habilita RLS sin políticas (el cliente anónimo/autenticado no accede).
-- ================================================

create extension if not exists pgcrypto;

-- ── Tokens OAuth del vendedor en Mercado Libre ───────────────────────
create table if not exists public.ds_ml_tokens (
  id uuid primary key default gen_random_uuid(),
  ml_user_id text not null unique,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Publicaciones activas en Mercado Libre ───────────────────────────
create table if not exists public.ds_ml_listings (
  id uuid primary key default gen_random_uuid(),
  ds_product_id uuid references public.ds_products(id) on delete cascade,
  ml_item_id text,
  ml_status text,
  ml_permalink text,
  ml_price integer,
  ml_stock integer,
  published_at timestamptz default now(),
  last_synced_at timestamptz default now(),
  error_msg text,
  created_at timestamptz default now()
);

create unique index if not exists ds_ml_listings_ml_item_id_key
  on public.ds_ml_listings (ml_item_id);
create index if not exists ds_ml_listings_ds_product_id_idx
  on public.ds_ml_listings (ds_product_id);

-- ── Órdenes entrantes desde los canales (Mercado Libre, etc.) ────────
create table if not exists public.ds_orders (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'mercadolibre',
  channel_order_id text,
  ds_product_id uuid references public.ds_products(id) on delete set null,
  ml_listing_id uuid references public.ds_ml_listings(id) on delete set null,
  quantity integer default 1,
  sale_price integer not null default 0,
  cost_clp integer not null default 0,
  margin_clp integer default 0,
  buyer_name text,
  buyer_email text,
  shipping_address jsonb,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Idempotencia del webhook: busca por channel_order_id antes de insertar.
create unique index if not exists ds_orders_channel_order_key
  on public.ds_orders (channel, channel_order_id);

-- ── Row Level Security: solo acceso server-side (service_role) ───────
alter table public.ds_ml_tokens   enable row level security;
alter table public.ds_ml_listings enable row level security;
alter table public.ds_orders      enable row level security;
