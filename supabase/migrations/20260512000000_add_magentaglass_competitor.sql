-- =====================================================
-- TENUTE — Add Magenta Glass as competitor for disposables
-- =====================================================

-- Insertar Magenta Glass como nuevo competidor
insert into public.competitors (name, base_url)
values
  ('Magenta Glass', 'https://magentaglass.cl')
on conflict (name) do update set base_url = excluded.base_url, active = true;

-- =====================================================
-- Seed: product_competitor_links — desechables comparables
-- NOTA: Reemplazar product_id con los IDs reales de tenute
-- Estos URLs son la referencia para scraping de precios
-- =====================================================

-- Verificar si existe la columna priority (opcional) y agregarla si no existe
alter table public.product_competitor_links
add column if not exists priority integer default 0;

-- Insertar links de competidor para productos desechables clave
-- La categoría desechables de Magenta Glass tiene ~90 productos
-- Enlacemos los SKUs más comparables con Tenute

-- Envases de aluminio
insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/envase-contenedor-desechable-aluminio-c10-c-tapa',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'aluminio-c10',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/envase-aluminio-c-20-con-tapa-domo-ideal-para-delivery-o-comida-preparada',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'aluminio-c20-tapa-domo',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

-- Bowls Kraft
insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/bowl-pote-kraft-500-ml-16-oz-tapa-ecologico',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'bowl-kraft-500ml',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/bowl-pote-kraft-ecologico-1000-ml-32-oz-tapa',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'bowl-kraft-1000ml',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/bowl-pote-kraft-ecologico-750-ml-25-oz-tapa',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'bowl-kraft-750ml',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

-- Cubiertos desechables
insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/cuchara-plastica-economica-blanca-para-fiesta',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'cuchara-plastica',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/cuchara-de-madera-ecologica-biodegradable',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'cuchara-madera',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

-- Bombillas Papel
insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/bombilla-papel-desechable-grusa-blanca-con-rojo',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'bombilla-papel',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

-- Papel Antigrasa
insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/papel-antigrasa-cuadriculado-30x30-cm',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'papel-antigrasa-cuadriculado',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

-- Vasos Desechables - variados
insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/vaso-kraft-12-onzas-350ml-cafe-jugos-bebidas-te',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'vaso-kraft-12oz',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/vaso-kraft-8-onzas-pack-para-cafe-o-te',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'vaso-kraft-8oz',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/vaso-polipapel-blanco-8-onzas-para-cafe-te',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'vaso-polipapel-8oz',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

-- Envases Clamshell / Repostería
insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/envase-clamshell-para-frutas-500-y-1000-gr',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'clamshell-frutas',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

--  Porta Vaso
insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/bandeja-porta-vaso-2-cavidades-compostable-pack-200-unidades',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'bandeja-porta-vaso-2cav-200',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

-- Cajas Pizza Kraft
insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/caja-para-pizza-kraft-delivery-32x32x4',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'caja-pizza-kraft-32',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

-- Bolsas Prepicadas
insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/bolsas-prepicadas-practica-resistente-prepicado-en-rollo',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'bolsas-prepicadas-rollo',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

-- Guantes Desechables
insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/guantes-de-nitrilo-negros-resistentes-sin-polvo-y-de-uso-profesional',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'guantes-nitrilo',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

-- Potes Kraft
insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/pote-kraft-sopa-con-tapa-plastica-8oz-240cc',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'pote-kraft-sopa-8oz',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

-- VASOS PET Compostable
insert into public.product_competitor_links
  (competitor_id, url, selector, sku_competidor, active, priority)
values
  (
    (select id from public.competitors where base_url = 'https://magentaglass.cl'),
    'https://magentaglass.cl/vaso-compostable-una-capa-8-oz-240-ml-para-cafe-o-te',
    '[itemprop="price"], .product-price, #product-price, [data-price]',
    'vaso-compostable-8oz',
    true,
    1
  )
on conflict (competitor_id, url) do nothing;

-- NOTA: Se pueden agregar más URLs de la categoría desechables de Magenta Glass
-- según la disponibilidad de productos equivalentes en Tenute.
