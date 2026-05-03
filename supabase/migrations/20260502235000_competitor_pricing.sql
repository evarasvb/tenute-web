-- ================================================
-- TENUTE — Competitor pricing comparison
-- ================================================

create extension if not exists pgcrypto;

create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  base_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

do $$
declare
  products_id_type text;
begin
  select data_type
  into products_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'products'
    and column_name = 'id'
  limit 1;

  if products_id_type is null then
    raise exception 'No se encontró public.products.id';
  end if;

  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'product_competitor_links'
  ) then
    if products_id_type = 'uuid' then
      execute $ddl$
        create table public.product_competitor_links (
          id uuid primary key default gen_random_uuid(),
          product_id uuid not null references public.products(id) on delete cascade,
          competitor_id uuid not null references public.competitors(id) on delete cascade,
          url text not null,
          selector text,
          sku_competidor text,
          active boolean not null default true,
          created_at timestamptz not null default now(),
          unique (product_id, competitor_id, url)
        )
      $ddl$;
    else
      execute $ddl$
        create table public.product_competitor_links (
          id uuid primary key default gen_random_uuid(),
          product_id bigint not null references public.products(id) on delete cascade,
          competitor_id uuid not null references public.competitors(id) on delete cascade,
          url text not null,
          selector text,
          sku_competidor text,
          active boolean not null default true,
          created_at timestamptz not null default now(),
          unique (product_id, competitor_id, url)
        )
      $ddl$;
    end if;
  end if;

  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'competitor_prices'
  ) then
    if products_id_type = 'uuid' then
      execute $ddl$
        create table public.competitor_prices (
          id uuid primary key default gen_random_uuid(),
          product_id uuid not null references public.products(id) on delete cascade,
          competitor_id uuid not null references public.competitors(id) on delete cascade,
          price numeric(14,2) not null check (price >= 0),
          currency text not null default 'CLP',
          in_stock boolean,
          scraped_at timestamptz not null default now(),
          source_url text not null,
          raw jsonb
        )
      $ddl$;
    else
      execute $ddl$
        create table public.competitor_prices (
          id uuid primary key default gen_random_uuid(),
          product_id bigint not null references public.products(id) on delete cascade,
          competitor_id uuid not null references public.competitors(id) on delete cascade,
          price numeric(14,2) not null check (price >= 0),
          currency text not null default 'CLP',
          in_stock boolean,
          scraped_at timestamptz not null default now(),
          source_url text not null,
          raw jsonb
        )
      $ddl$;
    end if;
  end if;
end $$;

create index if not exists product_competitor_links_product_id_idx
  on public.product_competitor_links (product_id);

create index if not exists competitor_prices_product_id_idx
  on public.competitor_prices (product_id);

create index if not exists competitor_prices_scraped_at_desc_idx
  on public.competitor_prices (scraped_at desc);

create index if not exists competitor_prices_product_scraped_at_desc_idx
  on public.competitor_prices (product_id, scraped_at desc);

alter table public.competitors enable row level security;
alter table public.product_competitor_links enable row level security;
alter table public.competitor_prices enable row level security;

drop policy if exists "Service role manages competitors" on public.competitors;
create policy "Service role manages competitors"
  on public.competitors
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role manages product competitor links" on public.product_competitor_links;
create policy "Service role manages product competitor links"
  on public.product_competitor_links
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role manages competitor prices" on public.competitor_prices;
create policy "Service role manages competitor prices"
  on public.competitor_prices
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Admin read competitors" on public.competitors;
create policy "Admin read competitors"
  on public.competitors
  for select
  to authenticated
  using ((coalesce(auth.jwt() ->> 'role', '') = 'admin'));

drop policy if exists "Admin read product competitor links" on public.product_competitor_links;
create policy "Admin read product competitor links"
  on public.product_competitor_links
  for select
  to authenticated
  using ((coalesce(auth.jwt() ->> 'role', '') = 'admin'));

drop policy if exists "Admin read competitor prices" on public.competitor_prices;
create policy "Admin read competitor prices"
  on public.competitor_prices
  for select
  to authenticated
  using ((coalesce(auth.jwt() ->> 'role', '') = 'admin'));

insert into public.competitors (name, base_url)
values
  ('Dimerc', 'https://www.dimerc.cl'),
  ('Officemax', 'https://www.officemax.cl'),
  ('PC Factory', 'https://www.pcfactory.cl'),
  ('Sodimac', 'https://www.sodimac.cl'),
  ('Mercado Libre', 'https://www.mercadolibre.cl'),
  ('Falabella', 'https://www.falabella.com')
on conflict (name) do update
set
  base_url = excluded.base_url,
  active = true;
