-- ================================================
-- TENUTE — Esquema inicial Supabase
-- Ejecutar en: Supabase → SQL Editor
-- ================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ------------------------------------------------
-- Tabla: categories
-- ------------------------------------------------
create table if not exists public.categories (
  id          bigserial primary key,
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

-- ------------------------------------------------
-- Tabla: products
-- ------------------------------------------------
create table if not exists public.products (
  id                      bigserial primary key,
  name                    text not null,
  slug                    text not null unique,
  description             text,
  price                   numeric(12,2) not null check (price >= 0),
  wholesale_price         numeric(12,2) check (wholesale_price >= 0),
  minimum_wholesale_qty   int default 1,
  stock                   int not null default 0 check (stock >= 0),
  image_url               text,
  category_id             bigint references public.categories(id) on delete set null,
  featured                boolean default false,
  active                  boolean default true,
  created_at              timestamptz default now()
);

create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_featured_idx on public.products(featured) where featured = true;
create index if not exists products_active_idx on public.products(active) where active = true;

-- ------------------------------------------------
-- Tabla: customers
-- ------------------------------------------------
create table if not exists public.customers (
  id           bigserial primary key,
  email        text not null unique,
  name         text not null,
  phone        text,
  address      text,
  is_wholesale boolean default false,
  created_at   timestamptz default now()
);

-- ------------------------------------------------
-- Tabla: orders
-- ------------------------------------------------
create table if not exists public.orders (
  id          bigserial primary key,
  customer_id bigint references public.customers(id) on delete restrict,
  status      text not null default 'pending'
              check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  total       numeric(12,2) not null default 0 check (total >= 0),
  notes       text,
  created_at  timestamptz default now()
);

create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists orders_status_idx on public.orders(status);

-- ------------------------------------------------
-- Tabla: order_items
-- ------------------------------------------------
create table if not exists public.order_items (
  id          bigserial primary key,
  order_id    bigint not null references public.orders(id) on delete cascade,
  product_id  bigint not null references public.products(id) on delete restrict,
  quantity    int not null check (quantity > 0),
  unit_price  numeric(12,2) not null check (unit_price >= 0),
  subtotal    numeric(12,2) generated always as (quantity * unit_price) stored
);

create index if not exists order_items_order_id_idx on public.order_items(order_id);

-- ------------------------------------------------
-- Categorías semilla
-- ------------------------------------------------
insert into public.categories (name, slug, description, sort_order) values
  ('Artículos de oficina', 'oficina',     'Lapiceros, archivadores, carpetas, clips y más.',      1),
  ('Insumos desechables',  'desechables', 'Vasos, platos, cubiertos, bolsas y embalaje.',         2),
  ('Papelería',            'papeleria',   'Resmas, papel fotográfico, sobres y artículos varios.', 3),
  ('Tecnología',           'tecnologia',  'Accesorios de computación y electrónica básica.',       4),
  ('Limpieza',             'limpieza',    'Productos de aseo y limpieza para empresas.',           5),
  ('Varios',               'varios',      'Otros productos y novedades.',                          6)
on conflict (slug) do nothing;

-- ------------------------------------------------
-- RLS (Row Level Security) — mínimo recomendado
-- ------------------------------------------------
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.customers   enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Lectura pública para catálogo
create policy "Categorías visibles" on public.categories
  for select using (true);

create policy "Productos activos visibles" on public.products
  for select using (active = true);

-- TODO Fase 2: agregar políticas de escritura para pedidos autenticados
