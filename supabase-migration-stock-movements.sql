-- ================================================
-- TENUTE — Historial de movimientos de stock
-- Ejecutar en: Supabase → SQL Editor
-- ================================================

create table if not exists public.stock_movements (
  id          bigserial primary key,
  product_id  uuid references public.products(id) on delete cascade,
  warehouse   text,                       -- 'ocoa' | 'local21'
  delta       integer not null default 0, -- cambio (+ entra / − sale)
  stock_after integer,                    -- stock resultante en esa bodega
  reason      text,                       -- 'inventario' | 'edicion' | 'compra' | 'venta' | 'ajuste'
  note        text,
  created_by  text,
  created_at  timestamptz default now()
);

create index if not exists stock_movements_product_idx on public.stock_movements(product_id);
create index if not exists stock_movements_created_idx on public.stock_movements(created_at desc);

alter table public.stock_movements enable row level security;
-- Solo el service_role (servidor) escribe/lee; sin políticas públicas.
