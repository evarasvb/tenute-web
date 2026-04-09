-- ================================================
-- TENUTE — Migración de catálogo completo
-- Ejecutar en: Supabase → SQL Editor
-- ================================================

-- ------------------------------------------------
-- PASO 1: Agregar columnas extra a products
-- ------------------------------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit text DEFAULT 'UN';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS format text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS content_info text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price numeric(12,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS margin numeric(12,2) DEFAULT 0;

-- Índice único en SKU para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_idx ON public.products(sku);

-- ------------------------------------------------
-- PASO 2: Actualizar categorías (upsert)
-- ------------------------------------------------
INSERT INTO public.categories (name, slug, description, sort_order) VALUES ('Alimentos y Cocina', 'alimentos-cocina', 'Café, azúcar, snacks y artículos de cocina.', 7) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;
INSERT INTO public.categories (name, slug, description, sort_order) VALUES ('Arte y Escolar', 'arte-escolar', 'Témperas, pinturas, materiales artísticos y escolares.', 8) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;
INSERT INTO public.categories (name, slug, description, sort_order) VALUES ('Insumos desechables', 'desechables', 'Vasos, platos, cubiertos, bolsas y embalaje.', 2) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;
INSERT INTO public.categories (name, slug, description, sort_order) VALUES ('Escritura y Corrección', 'escritura', 'Lápices, bolígrafos, correctores y marcadores.', 3) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;
INSERT INTO public.categories (name, slug, description, sort_order) VALUES ('Limpieza', 'limpieza', 'Productos de aseo y limpieza para empresas.', 5) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;
INSERT INTO public.categories (name, slug, description, sort_order) VALUES ('Muebles y Ergonomía', 'muebles-ergonomia', 'Sillas, escritorios, respaldos y mobiliario de oficina.', 9) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;
INSERT INTO public.categories (name, slug, description, sort_order) VALUES ('Artículos de oficina', 'oficina', 'Lapiceros, archivadores, carpetas, clips y más.', 1) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;
INSERT INTO public.categories (name, slug, description, sort_order) VALUES ('Varios', 'varios', 'Otros productos y novedades.', 6) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;
INSERT INTO public.categories (name, slug, description, sort_order) VALUES ('Papelería', 'papeleria', 'Resmas, papel fotográfico, sobres y artículos varios.', 4) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;
INSERT INTO public.categories (name, slug, description, sort_order) VALUES ('Tecnología', 'tecnologia', 'Accesorios de computación y electrónica básica.', 10) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;

-- ------------------------------------------------
-- PASO 3: Insertar productos (624 productos)
-- ------------------------------------------------
-- Usamos DO $$ ... $$ para referenciar category_id por slug

DO $$
DECLARE
  cat_id bigint;
BEGIN

  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('POTE BISAGRA CON TAPA DE 225 CC.', 'pote-bisagra-con-tapa-de-225-cc-foppp-1102', 'FOODPACK - POTE BISAGRA CON TAPA DE 225 CC.', 44, 37.4, 6, 28540, '/products/FOPPP-1102.jpg', cat_id, true, true, 'FOPPP-1102', 'FOODPACK', 'UN', '', '225CC', 35.2, 8.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('POTE DESECHABLE CON TAPA PLANA 250 A 350 CC', 'pote-desechable-con-tapa-plana-250-a-350-cc-fopint-4008-fl', 'FOODPACK - POTE DESECHABLE CON TAPA PLANA 250 A 350 CC', 53, 45.05, 6, 7400, '/products/FOPINT-4008-FL.jpg', cat_id, true, true, 'FOPINT-4008-FL', 'FOODPACK', 'UN', '', '350CC', 36.5, 16.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Adhesivo Barra Proarte 36 g', 'adhesivo-barra-proarte-36-g-pri85550', 'PRISA - Adhesivo Barra Proarte 36 g', 8544, 7262.4, 6, 36, '/products/PRI85550.jpg', cat_id, true, true, 'PRI85550', 'PRISA', 'UN', '', '36G', 5760, 2784)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cartón Piedra Proarte 1.0 mm 650 g 55x77 cm', 'carton-piedra-proarte-10-mm-650-g-55x77-cm-pri17086', 'PRISA - Cartón Piedra Proarte 1.0 mm 650 g 55x77 cm', 683, 580.55, 6, 300, '/products/PRI17086.jpg', cat_id, false, true, 'PRI17086', 'PRISA', 'UN', '55X77', '650G', 602, 81)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('POTE BISAGRA LISO 225 GRMS 1X600', 'pote-bisagra-liso-225-grms-1x600-dpspoten036', 'DPS - POTE BISAGRA LISO 225 GRMS 1X600', 52, 44.2, 6, 4200, NULL, cat_id, true, true, 'DPSPOTEN036', 'DPS', 'UN', '1X600', '', 38.8, 13.2)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Pote 12 oz c/tapa plana PET (1x540)', 'pote-12-oz-ctapa-plana-pet-1x540-fopint-4012-fl', 'FOODPACK - Pote 12 oz c/tapa plana PET (1x540)', 66, 56.1, 6, 3780, '/products/FOPINT-4012-FL.jpg', cat_id, true, true, 'FOPINT-4012-FL', 'FOODPACK', 'UN', '1X540', '12OZ', 38.9, 27.1)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('AGUA PURIFICADA NATURAL SIN GAS 500 CC', 'agua-purificada-natural-sin-gas-500-cc-dimz375824', 'DIMERC - AGUA PURIFICADA NATURAL SIN GAS 500 CC', 51054, 43395.9, 6, 50, NULL, cat_id, true, true, 'DIMZ375824', 'DIMERC', 'UN', '', '500CC', 1926, 49128)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('AGUA PURIFICADA NATURAL CON GAS 500 CC', 'agua-purificada-natural-con-gas-500-cc-dimz416060', 'DIMERC - AGUA PURIFICADA NATURAL CON GAS 500 CC', 11418, 9705.3, 6, 50, '/products/DIMZ416060.jpg', cat_id, true, true, 'DIMZ416060', 'DIMERC', 'UN', '', '500CC', 1926, 9492)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Saco Kraft Café 3 Kilos de 16 x 40 cms.', 'saco-kraft-cafe-3-kilos-de-16-x-40-cms-akisac300', 'SIN MARCA - Saco Kraft Café 3 Kilos de 16 x 40 cms.', 28, 23.8, 6, 6000, NULL, cat_id, true, true, 'AKISAC300', 'SIN MARCA', 'UN', '16X40', '16X40CM', 15.5, 12.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TAPA POTE AVIÓN PP 180 CC', 'tapa-pote-avion-pp-180-cc-foptg-t80', 'FOODPACK - TAPA POTE AVIÓN PP 180 CC', 15, 12.75, 6, 8000, '/products/FOPTG-T80.jpg', cat_id, true, true, 'FOPTG-T80', 'FOODPACK', 'UN', '', '180CC', 9.7, 5.3)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PAQUETE DE BOLSAS PLASTICAS DESECHABLES TIPO CAMISETA 40 X 30 CM, COLOR BLANCA.', 'paquete-de-bolsas-plasticas-desechables-tipo-camiseta-40-x-30-cm-color-blanca-dpsbocan033', 'DPS - PAQUETE DE BOLSAS PLASTICAS DESECHABLES TIPO CAMISETA 40 X 30 CM, COLOR BLANCA.', 14, 11.9, 6, 6900, '/products/DPSBOCAN033.jpg', cat_id, true, true, 'DPSBOCAN033', 'DPS', 'BOLSA', '40X30', '40X30CM', 9.9, 4.1)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('GUANTE LATEX EXAMGLOVE T-L 1X100', 'guante-latex-examglove-t-l-1x100-dpsmagun065', 'DPS - GUANTE LATEX EXAMGLOVE T-L 1X100', 850, 722.5, 6, 30, NULL, cat_id, false, true, 'DPSMAGUN065', 'DPS', 'UN', '1X100', '', 2152, -1302)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Saco Kraft Café 3kg (1x1000)', 'saco-kraft-cafe-3kg-1x1000-foppi-sqk300', 'FOODPACK - Saco Kraft Café 3kg (1x1000)', 28, 23.8, 6, 3000, '/products/FOPPI-SQK300.jpg', cat_id, true, true, 'FOPPI-SQK300', 'FOODPACK', 'UN', '1X1000', '3KG', 15.2, 12.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Saco Kraft Café 1kg (1x1000)', 'saco-kraft-cafe-1kg-1x1000-fopcm-t100', 'FOODPACK - Saco Kraft Café 1kg (1x1000)', 10, 8.5, 6, 5000, '/products/FOPCM-T100.jpg', cat_id, true, true, 'FOPCM-T100', 'FOODPACK', 'UN', '1X1000', '1KG', 8.1, 1.9)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('SALSA DE TOMATE NATURAL 200 GR POMAROLA', 'salsa-de-tomate-natural-200-gr-pomarola-dim123933', 'DIMERC - SALSA DE TOMATE NATURAL 200 GR POMAROLA', 495, 420.75, 6, 108, '/products/DIM123933.jpg', cat_id, false, true, 'DIM123933', 'DIMERC', 'UN', '', '200GR', 371, 124)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('SACO KRAFT CAFE 1KG (1X1000)', 'saco-kraft-cafe-1kg-1x1000-foppi-sqk100', 'FOODPACK - SACO KRAFT CAFE 1KG (1X1000)', 10, 8.5, 6, 3000, '/products/FOPPI-SQK100.jpg', cat_id, true, true, 'FOPPI-SQK100', 'FOODPACK', 'UN', '1X1000', '1KG', 8.1, 1.9)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('JUGO EN POLVO SOBRE 60 GR RINDE 1 LT GO NARANJA ZUKO', 'jugo-en-polvo-sobre-60-gr-rinde-1-lt-go-naranja-zuko-dimz463055', 'DIMERC - JUGO EN POLVO SOBRE 60 GR RINDE 1 LT GO NARANJA ZUKO', 413, 351.05, 6, 70, NULL, cat_id, false, true, 'DIMZ463055', 'DIMERC', 'UN', '', '60GR', 310, 103)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TABLA SALVACORTE 60X45 CMS (A2) AZUL', 'tabla-salvacorte-60x45-cms-a2-azul-pnb517150', 'FULTONS - TABLA SALVACORTE 60X45 CMS (A2) AZUL', 7487, 6363.95, 6, 3, '/products/PNB517150.jpg', cat_id, true, true, 'PNB517150', 'FULTONS', 'UN', '60X45', '60X45CM', 5990, 1497)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Etiqueta Adhesiva Diazol Oficio Matte 180 g 100 Hojas', 'etiqueta-adhesiva-diazol-oficio-matte-180-g-100-hojas-pri45528', 'DIAZOL - Etiqueta Adhesiva Diazol Oficio Matte 180 g 100 Hojas', 15759, 13395.15, 6, 2, '/products/PRI45528.jpg', cat_id, true, true, 'PRI45528', 'DIAZOL', 'UN', '', '180G', 7915, 7844)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Pote Bisagra 340 Grs Tapa Plana', 'pote-bisagra-340-grs-tapa-plana-akipobi4012', 'SIN MARCA - Pote Bisagra 340 Grs Tapa Plana', 56, 47.6, 6, 320, NULL, cat_id, false, true, 'AKIPOBI4012', 'SIN MARCA', 'UN', '', '340GRS', 48, 8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CAFE INST. NESCAFE FIN SELECC.220 GR LIOFI FCO VI', 'cafe-inst-nescafe-fin-selecc220-gr-liofi-fco-vi-pri89289', 'PRISA - CAFE INST. NESCAFE FIN SELECC.220 GR LIOFI FCO VI', 5027, 4272.95, 6, 1, '/products/PRI89289.jpg', cat_id, false, true, 'PRI89289', 'PRISA', 'UN', '', '220GR', 11523, -6496)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TÉMPERA 250 ML AZUL', 'tempera-250-ml-azul-tor30616', 'TORRE - TÉMPERA 250 ML AZUL', 1224, 1040.4, 6, 9, '/products/TOR30616.jpg', cat_id, false, true, 'TOR30616', 'TORRE', 'UN', '', '250ML', 1040, 184)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TÉMPERA 250 ML BLANCO', 'tempera-250-ml-blanco-tor30613', 'TORRE - TÉMPERA 250 ML BLANCO', 1031, 876.35, 6, 9, '/products/TOR30613.jpg', cat_id, false, true, 'TOR30613', 'TORRE', 'UN', '', '250ML', 946, 85)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Lubricante líquido para trituradoras Auto Oil', 'lubricante-liquido-para-trituradoras-auto-oil-acb33643', 'ACCO BRANDS - Lubricante líquido para trituradoras Auto Oil', 0, 0, 6, 1, NULL, cat_id, false, true, 'ACB33643', 'ACCO BRANDS', 'UN', '', '', 8411, -8411)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Revolvedor de Café 140mm (10x1000)', 'revolvedor-de-cafe-140mm-10x1000-fopys-e140b', 'FOODPACK - Revolvedor de Café 140mm (10x1000)', 2, 1.7, 6, 7000, '/products/FOPYS-E140B.jpg', cat_id, true, true, 'FOPYS-E140B', 'FOODPACK', 'UN', '10X1000', '', 1.2, 0.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bombilla Flexible Latina 25 Cm Paquete de 100 Unidades', 'bombilla-flexible-latina-25-cm-paquete-de-100-unidades-pri76304', 'PRISA - Bombilla Flexible Latina 25 Cm Paquete de 100 Unidades', 8, 6.8, 6, 1224, NULL, cat_id, true, true, 'PRI76304', 'PRISA', 'PACK', '', '', 6.2, 1.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TÉMPERA 250 ML DORADO', 'tempera-250-ml-dorado-tor30619', 'TORRE - TÉMPERA 250 ML DORADO', 1441, 1224.85, 6, 6, '/products/TOR30619.jpg', cat_id, false, true, 'TOR30619', 'TORRE', 'UN', '', '250ML', 1225, 216)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Rollo Térmico Engatel 57 mm X 40 M 10 Unidades', 'rollo-termico-engatel-57-mm-x-40-m-10-unidades-pri11718', 'PRISA - Rollo Térmico Engatel 57 mm X 40 M 10 Unidades', 681, 578.85, 6, 14, '/products/PRI11718.jpg', cat_id, false, true, 'PRI11718', 'PRISA', 'ROLLO', '', '', 482.4, 198.6)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Plato oval transparente s/div. (2150)', 'plato-oval-transparente-sdiv-2150-foptg-8010', 'FOODPACK - Plato oval transparente s/div. (2150)', 86, 73.1, 6, 100, '/products/FOPTG-8010.jpg', cat_id, false, true, 'FOPTG-8010', 'FOODPACK', 'UN', '', '', 66, 20)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Nota Adhesiva Stick & Write Verde Claro', 'nota-adhesiva-stick-write-verde-claro-pri87851', 'PRISA - Nota Adhesiva Stick & Write Verde Claro', 375, 318.75, 6, 10, '/products/PRI87851.jpg', cat_id, false, true, 'PRI87851', 'PRISA', 'UN', '', '', 420, -45)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Nota Adhesiva Stick & Write Rosado 100', 'nota-adhesiva-stick-write-rosado-100-pri87852', 'PRISA - Nota Adhesiva Stick & Write Rosado 100', 375, 318.75, 6, 10, '/products/PRI87852.jpg', cat_id, false, true, 'PRI87852', 'PRISA', 'UN', '', '', 407, -32)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('EAS38Amarra plástica transparente 200 x 2 mm Macrotel2379', 'eas38amarra-plastica-transparente-200-x-2-mm-macrotel2379-eas382379', 'SIN MARCA - EAS38Amarra plástica transparente 200 x 2 mm Macrotel2379', 1374, 1167.9, 6, 1, NULL, cat_id, false, true, 'EAS382379', 'SIN MARCA', 'UN', '200X2', '', 3941, -2567)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TÉMPERA 250 ML AMARILLO', 'tempera-250-ml-amarillo-tor30615', 'TORRE - TÉMPERA 250 ML AMARILLO', 1224, 1040.4, 6, 3, '/products/TOR30615.jpg', cat_id, false, true, 'TOR30615', 'TORRE', 'UN', '', '250ML', 1040, 184)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TÉMPERA 250 ML ROJO', 'tempera-250-ml-rojo-tor30617', 'TORRE - TÉMPERA 250 ML ROJO', 1224, 1040.4, 6, 3, '/products/TOR30617.jpg', cat_id, false, true, 'TOR30617', 'TORRE', 'UN', '', '250ML', 1040, 184)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('MICA TRANSPARENTE TAMAÑO OFICIO 100 HJ 200 (10)', 'mica-transparente-tamano-oficio-100-hj-200-10-pnb428164', 'FULTONS - MICA TRANSPARENTE TAMAÑO OFICIO 100 HJ 200 (10)', 105, 89.25, 6, 3, '/products/PNB428164.jpg', cat_id, false, true, 'PNB428164', 'FULTONS', 'UN', '', '', 75.9, 29.1)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('JUGO EN POLVO NARANJA PLATANO BOLSA 1 KG MACROFOOD', 'jugo-en-polvo-naranja-platano-bolsa-1-kg-macrofood-dim563958', 'MACROFOOD - JUGO EN POLVO NARANJA PLATANO BOLSA 1 KG MACROFOOD', 138, 117.3, 6, 1, NULL, cat_id, false, true, 'DIM563958', 'MACROFOOD', 'BOLSA', '', '1KG', 103.8, 34.2)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Revolvedor de Café 140mm', 'revolvedor-de-cafe-140mm-fopys-e140bs', 'FOODPACK - Revolvedor de Café 140mm', 2, 1.7, 6, 18, '/products/FOPYS-E140BS.jpg', cat_id, false, true, 'FOPYS-E140BS', 'FOODPACK', 'UN', '', '', 1.5, 0.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'alimentos-cocina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('POSTRE EN POLVO MERENGUE BOLSA 1 KG MACROFOOD', 'postre-en-polvo-merengue-bolsa-1-kg-macrofood-dim563952', 'MACROFOOD - POSTRE EN POLVO MERENGUE BOLSA 1 KG MACROFOOD', 1973, 1677.05, 6, 120, '/products/DIM563952.jpg', cat_id, false, true, 'DIM563952', 'MACROFOOD', 'BOLSA', '', '1KG', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'arte-escolar' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Acuarela en mezclador 12 colores  Diámetro plastilla 2 cms  Incluye 2 pinceles pelo plástico', 'acuarela-en-mezclador-12-colores-diametro-plastilla-2-cms-incluye-2-pinceles-pel-acb70167', 'ACCO BRANDS - Acuarela en mezclador 12 colores  Diámetro plastilla 2 cms  Incluye 2 pinceles pelo plástico', 1008, 856.8, 6, 144, '/products/ACB70167.jpg', cat_id, false, true, 'ACB70167', 'ACCO BRANDS', 'UN', '', '', 666, 342)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'arte-escolar' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Adhesivo glitter glue Torre Metalicos 5 Colores', 'adhesivo-glitter-glue-torre-metalicos-5-colores-pri59102', 'TORRE - Adhesivo glitter glue Torre Metalicos 5 Colores', 1023, 869.55, 6, 31, '/products/PRI59102.jpg', cat_id, false, true, 'PRI59102', 'TORRE', 'UN', '', '', 921, 102)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'arte-escolar' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Adhesivo En Barra Torre Stick Imagia 40 gr', 'adhesivo-en-barra-torre-stick-imagia-40-gr-pri30547', 'TORRE - Adhesivo En Barra Torre Stick Imagia 40 gr', 2080, 1768.0, 6, 28, '/products/PRI30547.jpg', cat_id, true, true, 'PRI30547', 'TORRE', 'UN', '', '40GR', 713, 1367)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'arte-escolar' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TEMPERA 12 COLORES TORRE 22 ML', 'tempera-12-colores-torre-22-ml-tor972', 'TORRE - TEMPERA 12 COLORES TORRE 22 ML', 1252, 1064.2, 6, 7, '/products/TOR972.jpg', cat_id, false, true, 'TOR972', 'TORRE', 'UN', '', '22ML', 1170, 82)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'arte-escolar' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PINCEL N10 ESPATULA MANGO DE MADERA', 'pincel-n10-espatula-mango-de-madera-dim497684', 'DIMERC - PINCEL N10 ESPATULA MANGO DE MADERA', 188, 159.8, 6, 18, NULL, cat_id, false, true, 'DIM497684', 'DIMERC', 'UN', '', '', 370, -182)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'arte-escolar' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PINCEL N6 ESPATULA MANGO DE MADERA', 'pincel-n6-espatula-mango-de-madera-dim497686', 'DIMERC - PINCEL N6 ESPATULA MANGO DE MADERA', 207, 175.95, 6, 18, NULL, cat_id, false, true, 'DIM497686', 'DIMERC', 'UN', '', '', 126, 81)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bandeja Alum. 600ml cTapa Cart-Alum. (30x20)', 'bandeja-alum-600ml-ctapa-cart-alum-30x20-foply-c18nt', 'FOODPACK - Bandeja Alum. 600ml cTapa Cart-Alum. (30x20)', 1499, 1274.15, 6, 19700, '/products/FOPLY-C18NT.jpg', cat_id, true, true, 'FOPLY-C18NT', 'FOODPACK', 'UN', '30X20', '600ML', 1198, 301)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Vaso polipapel alta temperatura.', 'vaso-polipapel-alta-temperatura-fopaht-vpc08-kr', 'FOODPACK - Vaso polipapel alta temperatura.', 2800, 2380.0, 6, 10001, '/products/FOPAHT-VPC08-KR.jpg', cat_id, true, true, 'FOPAHT-VPC08-KR', 'FOODPACK', 'UN', '', '', 2106, 694)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Vaso Papel PLA 8 oz. Imp. ECO (50x20)', 'vaso-papel-pla-8-oz-imp-eco-50x20-fopiy-hcpla08-tg', 'FOODPACK - Vaso Papel PLA 8 oz. Imp. ECO (50x20)', 38, 32.3, 6, 77000, '/products/FOPIY-HCPLA08-TG.jpg', cat_id, true, true, 'FOPIY-HCPLA08-TG', 'FOODPACK', 'UN', '50X20', '8OZ', 28.4, 9.6)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Vaso 16oz PP transp. (20x50)', 'vaso-16oz-pp-transp-20x50-foptg-cl16', 'FOODPACK - Vaso 16oz PP transp. (20x50)', 50, 42.5, 6, 55000, '/products/FOPTG-CL16.jpg', cat_id, true, true, 'FOPTG-CL16', 'FOODPACK', 'UN', '20X50', '16OZ', 33.2, 16.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Vaso polipapel 12oz Kraft (1x1000)', 'vaso-polipapel-12oz-kraft-1x1000-fopaht-vpc12-kr', 'FOODPACK - Vaso polipapel 12oz Kraft (1x1000)', 37, 31.45, 6, 61000, '/products/FOPAHT-VPC12-KR.jpg', cat_id, true, true, 'FOPAHT-VPC12-KR', 'FOODPACK', 'UN', '1X1000', '12OZ', 26.6, 10.4)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tapa plana p/vaso 12/14/16/20oz (20x50)', 'tapa-plana-pvaso-12141620oz-20x50-foptg-clfl1220', 'FOODPACK - Tapa plana p/vaso 12/14/16/20oz (20x50)', 24, 20.4, 6, 69000, '/products/FOPTG-CLFL1220.jpg', cat_id, true, true, 'FOPTG-CLFL1220', 'FOODPACK', 'UN', '20X50', '20OZ', 15.4, 8.6)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Pocillo PP 5,5 oz', 'pocillo-pp-55-oz-akipc550', 'SIN MARCA - Pocillo PP 5,5 oz', 20, 17.0, 6, 60000, NULL, cat_id, true, true, 'AKIPC550', 'SIN MARCA', 'UN', '', '5,5OZ', 15, 5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Vaso 300cc Blanco (1X2500)', 'vaso-300cc-blanco-1x2500-fopvc-v10b', 'FOODPACK - Vaso 300cc Blanco (1X2500)', 886, 753.1, 6, 2500, '/products/FOPVC-V10B.jpg', cat_id, true, true, 'FOPVC-V10B', 'FOODPACK', 'UN', '1X2500', '300CC', 351, 535)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CUCHARA ALMIDON MAIZ 7 NATURAL PACK (20X50)', 'cuchara-almidon-maiz-7-natural-pack-20x50-dpsbiocuden016', 'DPS - CUCHARA ALMIDON MAIZ 7 NATURAL PACK (20X50)', 25, 21.25, 6, 43000, NULL, cat_id, true, true, 'DPSBIOCUDEN016', 'DPS', 'PACK', '20X50', '', 20, 5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BANDEJAS PLUMAVIT CON DIVISION 33 X 23 X 7,5 CM.', 'bandejas-plumavit-con-division-33-x-23-x-75-cm-fopdco-403201nw', 'FOODPACK - BANDEJAS PLUMAVIT CON DIVISION 33 X 23 X 7,5 CM.', 94, 79.9, 6, 10700, '/products/FOPDCO-403201NW.jpg', cat_id, true, true, 'FOPDCO-403201NW', 'FOODPACK', 'UN', '33X23', '', 70.5, 23.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TAPAS PARA VASOS DE PLUMAVIT 10 OZ 300 ML.', 'tapas-para-vasos-de-plumavit-10-oz-300-ml-fopd-10ftl', 'FOODPACK - TAPAS PARA VASOS DE PLUMAVIT 10 OZ 300 ML.', 28, 23.8, 6, 24000, '/products/FOPD-10FTL.jpg', cat_id, true, true, 'FOPD-10FTL', 'FOODPACK', 'UN', '', '10OZ', 30, -2)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cling Film PVC 28cm x 300m', 'cling-film-pvc-28cm-x-300m-fopcip-cf28300', 'FOODPACK - Cling Film PVC 28cm x 300m', 5165, 4390.25, 6, 144, '/products/FOPCIP-CF28300.jpg', cat_id, true, true, 'FOPCIP-CF28300', 'FOODPACK', 'UN', '', '', 4125, 1040)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tenedor MW NatCorn (10x100)', 'tenedor-mw-natcorn-10x100-fopja-psm-mfork', 'FOODPACK - Tenedor MW NatCorn (10x100)', 23, 19.55, 6, 36400, '/products/FOPJA-PSM-MFORK.jpg', cat_id, true, true, 'FOPJA-PSM-MFORK', 'FOODPACK', 'UN', '10X100', '', 15.4, 7.6)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TAPA PLA VASO POLI. COMPOST. 8 OZ (20X50)', 'tapa-pla-vaso-poli-compost-8-oz-20x50-dpsbiotapva001', 'DPS - TAPA PLA VASO POLI. COMPOST. 8 OZ (20X50)', 17, 14.45, 6, 32000, '/products/DPSBIOTAPVA001.jpg', cat_id, true, true, 'DPSBIOTAPVA001', 'DPS', 'UN', '20X50', '8OZ', 14.3, 2.7)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CUCHARA COMPOST. NATURAL PACK 6,5 CPLA 20X50', 'cuchara-compost-natural-pack-65-cpla-20x50-dpsbiocuden013', 'DPS - CUCHARA COMPOST. NATURAL PACK 6,5 CPLA 20X50', 24, 20.4, 6, 21000, NULL, cat_id, true, true, 'DPSBIOCUDEN013', 'DPS', 'PACK', '20X50', '', 19.4, 4.6)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cuchara MW NatCorn postre (10x100)', 'cuchara-mw-natcorn-postre-10x100-fopja-psm-mtspn', 'FOODPACK - Cuchara MW NatCorn postre (10x100)', 43, 36.55, 6, 24400, '/products/FOPJA-PSM-MTSPN.jpg', cat_id, true, true, 'FOPJA-PSM-MTSPN', 'FOODPACK', 'UN', '10X100', '', 16.6, 26.4)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('VASO POLIPAPEL UNA CAPA BLANCO NP 8 OZ (50 UNIDADES)', 'vaso-polipapel-una-capa-blanco-np-8-oz-50-unidades-foptg-vpc08w', 'FOODPACK - VASO POLIPAPEL UNA CAPA BLANCO NP 8 OZ (50 UNIDADES)', 27, 22.95, 6, 15000, '/products/FOPTG-VPC08W.jpg', cat_id, true, true, 'FOPTG-VPC08W', 'FOODPACK', 'CAJA', '', '8OZ', 22.3, 4.7)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TENEDOR ALMIDON MAIZ 7 NATURAL PACK (20X50)', 'tenedor-almidon-maiz-7-natural-pack-20x50-dpsbiocuden017', 'DPS - TENEDOR ALMIDON MAIZ 7 NATURAL PACK (20X50)', 24, 20.4, 6, 16000, NULL, cat_id, true, true, 'DPSBIOCUDEN017', 'DPS', 'PACK', '20X50', '', 20.3, 3.7)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Vaso 8oz Polipapel PLA Imp. Tugou (2050', 'vaso-8oz-polipapel-pla-imp-tugou-2050-fophl-hcplaf08-tg', 'FOODPACK - Vaso 8oz Polipapel PLA Imp. Tugou (2050', 38, 32.3, 6, 10000, '/products/FOPHL-HCPLAF08-TG.jpg', cat_id, true, true, 'FOPHL-HCPLAF08-TG', 'FOODPACK', 'UN', '', '8OZ', 30.4, 7.6)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Vaso 12oz PET 92mm  (20x50)', 'vaso-12oz-pet-92mm-20x50-fopsn-pet12', 'FOODPACK - Vaso 12oz PET 92mm  (20x50)', 18, 15.3, 6, 9000, '/products/FOPSN-PET12.jpg', cat_id, true, true, 'FOPSN-PET12', 'FOODPACK', 'UN', '20X50', '12OZ', 32.4, -14.4)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Vaso Dart 120cc. (4 oz) (1x1000)', 'vaso-dart-120cc-4-oz-1x1000-fopd-4j4', 'FOODPACK - Vaso Dart 120cc. (4 oz) (1x1000)', 28, 23.8, 6, 15000, '/products/FOPD-4J4.jpg', cat_id, true, true, 'FOPD-4J4', 'FOODPACK', 'UN', '1X1000', '4OZ', 17.7, 10.3)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tenedor Blanco PP', 'tenedor-blanco-pp-fopie-70043', 'FOODPACK - Tenedor Blanco PP', 9, 7.65, 6, 42997, '/products/FOPIE-70043.jpg', cat_id, true, true, 'FOPIE-70043', 'FOODPACK', 'UN', '', '', 6, 3)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CUCHARA TE PLASTICA PLA BLANCA', 'cuchara-te-plastica-pla-blanca-van2511105', 'SIN MARCA - CUCHARA TE PLASTICA PLA BLANCA', 43, 36.55, 6, 6000, '/products/VAN2511105.jpg', cat_id, true, true, 'VAN2511105', 'SIN MARCA', 'UN', '', '', 36.7, 6.3)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('VASO UNA CAPA BLANCO NP 4 OZ', 'vaso-una-capa-blanco-np-4-oz-dpsvapin111', 'DPS - VASO UNA CAPA BLANCO NP 4 OZ', 24, 20.4, 6, 23000, '/products/DPSVAPIN111.jpg', cat_id, true, true, 'DPSVAPIN111', 'DPS', 'UN', '', '4OZ', 9, 15)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BANDEJA RECTANGULAR N 3', 'bandeja-rectangular-n-3-dpscartn047', 'DPS - BANDEJA RECTANGULAR N 3', 32, 27.2, 6, 6600, NULL, cat_id, true, true, 'DPSCARTN047', 'DPS', 'UN', '', '', 22.5, 9.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Vaso 110cc Blanco (16000)', 'vaso-110cc-blanco-16000-fopvc-v35b', 'FOODPACK - Vaso 110cc Blanco (16000)', 16, 13.6, 6, 17000, '/products/FOPVC-V35B.jpg', cat_id, true, true, 'FOPVC-V35B', 'FOODPACK', 'UN', '', '110CC', 8.6, 7.4)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Pocillo Traslúcido 4oz (12500)', 'pocillo-traslucido-4oz-12500-fopiy-pcs40', 'FOODPACK - Pocillo Traslúcido 4oz (12500)', 19, 16.15, 6, 12500, '/products/FOPIY-PCS40.jpg', cat_id, true, true, 'FOPIY-PCS40', 'FOODPACK', 'UN', '', '4OZ', 11.5, 7.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('VASOS DE PLUMAVIT DE 10 OZ, 300 ML', 'vasos-de-plumavit-de-10-oz-300-ml-fopd-10j10', 'FOODPACK - VASOS DE PLUMAVIT DE 10 OZ, 300 ML', 38, 32.3, 6, 5000, '/products/FOPD-10J10.jpg', cat_id, true, true, 'FOPD-10J10', 'FOODPACK', 'UN', '', '10OZ', 27.5, 10.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CUCHARA ECON. BLANCO 10X100', 'cuchara-econ-blanco-10x100-dpscuden028', 'DPS - CUCHARA ECON. BLANCO 10X100', 8, 6.8, 6, 20000, '/products/DPSCUDEN028.jpg', cat_id, true, true, 'DPSCUDEN028', 'DPS', 'UN', '10X100', '', 6.5, 1.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CONTENEDOR DELI ProToGo 8 OZ TRANSPARENTE PET CON TAPA DE PP. ALTO 7 CM Y 9 CM DE DIAMETR', 'contenedor-deli-protogo-8-oz-transparente-pet-con-tapa-de-pp-alto-7-cm-y-9-cm-de-dnldp73m00802', 'SIN MARCA - CONTENEDOR DELI ProToGo 8 OZ TRANSPARENTE PET CON TAPA DE PP. ALTO 7 CM Y 9 CM DE DIAMETR', 62, 52.7, 6, 2400, NULL, cat_id, true, true, 'DNLDP73M00802', 'SIN MARCA', 'UN', '', '8OZ', 49.5, 12.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CUCHARA PLASTICA SOPERA', 'cuchara-plastica-sopera-dpscuden081', 'DPS - CUCHARA PLASTICA SOPERA', 8, 6.8, 6, 13000, '/products/DPSCUDEN081.jpg', cat_id, true, true, 'DPSCUDEN081', 'DPS', 'UN', '', '', 9, -1)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Inserto 92mm  4oz PET p/vaso 12/20oz (10x100)', 'inserto-92mm-4oz-pet-pvaso-1220oz-10x100-fopsn-petpci4', 'FOODPACK - Inserto 92mm  4oz PET p/vaso 12/20oz (10x100)', 13, 11.05, 6, 6000, '/products/FOPSN-PETPCI4.jpg', cat_id, true, true, 'FOPSN-PETPCI4', 'FOODPACK', 'UN', '10X100', '4OZ', 19.4, -6.4)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Vaso 200cc PP Transp. (25100)', 'vaso-200cc-pp-transp-25100-fopcob-201138', 'FOODPACK - Vaso 200cc PP Transp. (25100)', 13, 11.05, 6, 12000, '/products/FOPCOB-201138.jpg', cat_id, true, true, 'FOPCOB-201138', 'FOODPACK', 'UN', '', '200CC', 7.9, 5.1)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Rollo de Aluminio 30cm x 100m', 'rollo-de-aluminio-30cm-x-100m-foply-al300100', 'FOODPACK - Rollo de Aluminio 30cm x 100m', 5260, 4471.0, 6, 22, '/products/FOPLY-AL300100.jpg', cat_id, true, true, 'FOPLY-AL300100', 'FOODPACK', 'ROLLO', '', '', 4050, 1210)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('VASO TRANPARENTE PP 110 CC', 'vaso-tranparente-pp-110-cc-fopvc-v35t', 'FOODPACK - VASO TRANPARENTE PP 110 CC', 50, 42.5, 6, 10000, '/products/FOPVC-V35T.jpg', cat_id, true, true, 'FOPVC-V35T', 'FOODPACK', 'UN', '', '110CC', 8.6, 41.4)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cuchara de Sopa Blanca PP', 'cuchara-de-sopa-blanca-pp-fopie-70042', 'FOODPACK - Cuchara de Sopa Blanca PP', 10, 8.5, 6, 13898, '/products/FOPIE-70042.jpg', cat_id, true, true, 'FOPIE-70042', 'FOODPACK', 'UN', '', '', 6.1, 3.9)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Vaso 16oz PET 98mm  (2050)', 'vaso-16oz-pet-98mm-2050-fopsn-pet16', 'FOODPACK - Vaso 16oz PET 98mm  (2050)', 58, 49.3, 6, 2000, '/products/FOPSN-PET16.jpg', cat_id, true, true, 'FOPSN-PET16', 'FOODPACK', 'UN', '', '16OZ', 42.1, 15.9)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('VASO PET 16 OZ PACK LIST V.2 (20X50)', 'vaso-pet-16-oz-pack-list-v2-20x50-dpsvascup036', 'DPS - VASO PET 16 OZ PACK LIST V.2 (20X50)', 58, 49.3, 6, 2000, '/products/DPSVASCUP036.jpg', cat_id, true, true, 'DPSVASCUP036', 'DPS', 'PACK', '20X50', '16OZ', 40, 18)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cuchara de Postre Blanca', 'cuchara-de-postre-blanca-fopie-6020', 'FOODPACK - Cuchara de Postre Blanca', 6, 5.1, 6, 14600, '/products/FOPIE-6020.jpg', cat_id, true, true, 'FOPIE-6020', 'FOODPACK', 'UN', '', '', 4.5, 1.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tenedor de Madera 16 cm', 'tenedor-de-madera-16-cm-akitnmd160', 'SIN MARCA - Tenedor de Madera 16 cm', 17, 14.45, 6, 5000, '/products/AKITNMD160.jpg', cat_id, true, true, 'AKITNMD160', 'SIN MARCA', 'UN', '', '', 13, 4)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PAPEL FILM 300 MTS', 'papel-film-300-mts-dnlsd131-280-300d', 'SIN MARCA - PAPEL FILM 300 MTS', 4750, 4037.5, 6, 20, '/products/DNLSD131-280-300D.jpg', cat_id, true, true, 'DNLSD131-280-300D', 'SIN MARCA', 'UN', '', '', 3000, 1750)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('VASO DART 240cc  (8 oz)  (1 x1000)', 'vaso-dart-240cc-8-oz-1-x1000-fopd-8j8', 'FOODPACK - VASO DART 240cc  (8 oz)  (1 x1000)', 32, 27.2, 6, 2480, '/products/FOPD-8J8.jpg', cat_id, true, true, 'FOPD-8J8', 'FOODPACK', 'UN', '1X1000', '8OZ', 23.7, 8.3)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Rollo Aluminio 30 cms. x 100 mts', 'rollo-aluminio-30-cms-x-100-mts-akira1230100', 'SIN MARCA - Rollo Aluminio 30 cms. x 100 mts', 2147, 1824.95, 6, 12, '/products/AKIRA1230100.jpg', cat_id, false, true, 'AKIRA1230100', 'SIN MARCA', 'ROLLO', '', '', 4600, -2453)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('VASO TERMICO CHICO 125 CC', 'vaso-termico-chico-125-cc-foptg-vpc04w', 'FOODPACK - VASO TERMICO CHICO 125 CC', 24, 20.4, 6, 3998, '/products/FOPTG-VPC04W.jpg', cat_id, true, true, 'FOPTG-VPC04W', 'FOODPACK', 'UN', '', '125CC', 12.6, 11.4)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BANDEJA RECTANGULAR 6 1X100', 'bandeja-rectangular-6-1x100-dpscartn020', 'DPS - BANDEJA RECTANGULAR 6 1X100', 49, 41.65, 6, 1600, NULL, cat_id, true, true, 'DPSCARTN020', 'DPS', 'UN', '1X100', '', 30.2, 18.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('FILM ALUSA PARA ALIMENTOS 28cm x50mts 8mic. MATERIAL: PVC PARA ALIMENTOS.', 'film-alusa-para-alimentos-28cm-x50mts-8mic-material-pvc-para-alimentos-dnlst2-280-50r', 'SIN MARCA - FILM ALUSA PARA ALIMENTOS 28cm x50mts 8mic. MATERIAL: PVC PARA ALIMENTOS.', 1384, 1176.4, 6, 56, NULL, cat_id, true, true, 'DNLST2-280-50R', 'SIN MARCA', 'UN', '', '', 830, 554)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CONTENEDOR ALUM. C 20 LT CTAPA40X20', 'contenedor-alum-c-20-lt-ctapa40x20-dpsalumn020', 'DPS - CONTENEDOR ALUM. C 20 LT CTAPA40X20', 194, 164.9, 6, 600, NULL, cat_id, true, true, 'DPSALUMN020', 'DPS', 'UN', '40X20', '', 71, 123)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Contenedor Aluminio C5', 'contenedor-aluminio-c5-dpsalumn008', 'DPS - Contenedor Aluminio C5', 36, 30.6, 6, 1002, '/products/DPSALUMN008.jpg', cat_id, true, true, 'DPSALUMN008', 'DPS', 'UN', '', '', 27, 9)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cuchara de Madera 16 cm', 'cuchara-de-madera-16-cm-akichmd160', 'SIN MARCA - Cuchara de Madera 16 cm', 17, 14.45, 6, 2000, NULL, cat_id, true, true, 'AKICHMD160', 'SIN MARCA', 'UN', '', '', 12.5, 4.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bandeja HotDog Chico (100u)', 'bandeja-hotdog-chico-100u-fopiv-10801', 'FOODPACK - Bandeja HotDog Chico (100u)', 24, 20.4, 6, 1000, '/products/FOPIV-10801.jpg', cat_id, true, true, 'FOPIV-10801', 'FOODPACK', 'UN', '', '', 25, -1)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('POCILLO TRASLUCIDO 3.25 OZ (1X2500)', 'pocillo-traslucido-325-oz-1x2500-fopiy-pcs325', 'FOODPACK - POCILLO TRASLUCIDO 3.25 OZ (1X2500)', 28, 23.8, 6, 2500, '/products/FOPIY-PCS325.jpg', cat_id, true, true, 'FOPIY-PCS325', 'FOODPACK', 'UN', '1X2500', '3.25OZ', 8.9, 19.1)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TENEDOR MADERA ASL', 'tenedor-madera-asl-dpscudema006', 'DPS - TENEDOR MADERA ASL', 17, 14.45, 6, 2000, NULL, cat_id, true, true, 'DPSCUDEMA006', 'DPS', 'UN', '', '', 10.4, 6.6)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('POCILLO PP 1,0 OZ PACK LIST (25X100)', 'pocillo-pp-10-oz-pack-list-25x100-dpspoded013', 'DPS - POCILLO PP 1,0 OZ PACK LIST (25X100)', 7, 5.95, 6, 2500, NULL, cat_id, true, true, 'DPSPODED013', 'DPS', 'PACK', '25X100', '1,0OZ', 8.1, -1.1)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TAPA DESECHABLE PARA VASO TÉRMICO 240CC', 'tapa-desechable-para-vaso-termico-240cc-dpstapva097', 'DPS - TAPA DESECHABLE PARA VASO TÉRMICO 240CC', 23, 19.55, 6, 1000, '/products/DPSTAPVA097.jpg', cat_id, true, true, 'DPSTAPVA097', 'DPS', 'UN', '', '240CC', 20, 3)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Contenedor C10 (1.000 und)', 'contenedor-c10-1000-und-akicoalc10', 'SIN MARCA - Contenedor C10 (1.000 und)', 54, 45.9, 6, 500, NULL, cat_id, false, true, 'AKICOALC10', 'SIN MARCA', 'UN', '', '', 39, 15)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cuchara de Sopa Blanca(1X1000)', 'cuchara-de-sopa-blanca1x1000-fopja-rcss1cc', 'FOODPACK - Cuchara de Sopa Blanca(1X1000)', 9, 7.65, 6, 3000, '/products/FOPJA-RCSS1CC.jpg', cat_id, true, true, 'FOPJA-RCSS1CC', 'FOODPACK', 'UN', '1X1000', '', 6.1, 2.9)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TENEDOR PLASTICO', 'tenedor-plastico-fopja-rcf1cc', 'FOODPACK - TENEDOR PLASTICO', 8, 6.8, 6, 2900, '/products/FOPJA-RCF1CC.jpg', cat_id, true, true, 'FOPJA-RCF1CC', 'FOODPACK', 'UN', '', '', 6, 2)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tenedor de madera 16cm (10x100)', 'tenedor-de-madera-16cm-10x100-fopys-f160b', 'FOODPACK - Tenedor de madera 16cm (10x100)', 17, 14.45, 6, 1000, '/products/FOPYS-F160B.jpg', cat_id, true, true, 'FOPYS-F160B', 'FOODPACK', 'UN', '10X100', '', 12.4, 4.6)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cinta Adhesiva Sellofilm Transparente 12 mm x 30 m', 'cinta-adhesiva-sellofilm-transparente-12-mm-x-30-m-pri99400', 'PRISA - Cinta Adhesiva Sellofilm Transparente 12 mm x 30 m', 210, 178.5, 6, 36, '/products/PRI99400.jpg', cat_id, false, true, 'PRI99400', 'PRISA', 'UN', '', '', 168, 42)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('VASOS DE POLIPAPEL (TERMICO) 300 MO O 10 ONZAS', 'vasos-de-polipapel-termico-300-mo-o-10-onzas-foptg-vpc010w', 'FOODPACK - VASOS DE POLIPAPEL (TERMICO) 300 MO O 10 ONZAS', 43, 36.55, 6, 200, '/products/FOPTG-VPC010W.jpg', cat_id, false, true, 'FOPTG-VPC010W', 'FOODPACK', 'UN', '', '', 30, 13)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BOMBILLA DE PAPEL 14 CM COPA O VASO CORTO, DIMENSIONES 14 CM LARGO X 6 MM DE ANCHO, COLOR NEGRO', 'bombilla-de-papel-14-cm-copa-o-vaso-corto-dimensiones-14-cm-largo-x-6-mm-de-anch-dpsbompap04', 'DPS - BOMBILLA DE PAPEL 14 CM COPA O VASO CORTO, DIMENSIONES 14 CM LARGO X 6 MM DE ANCHO, COLOR NEGRO', 9, 7.65, 6, 800, '/products/DPSBOMPAP04.jpg', cat_id, true, true, 'DPSBOMPAP04', 'DPS', 'UN', '', '', 6.1, 2.9)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('ROLLO ALUMINIO 100 MTS', 'rollo-aluminio-100-mts-dpsroala002', 'DPS - ROLLO ALUMINIO 100 MTS', 5380, 4573.0, 6, 1, '/products/DPSROALA002.jpg', cat_id, true, true, 'DPSROALA002', 'DPS', 'ROLLO', '', '', 4850, 530)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CUCHARA PLASTICA PARA CAFE LARGO 10-12-CM ANCHO DE CUCHARA DE 15 CM', 'cuchara-plastica-para-cafe-largo-10-12-cm-ancho-de-cuchara-de-15-cm-dpscuden078', 'DPS - CUCHARA PLASTICA PARA CAFE LARGO 10-12-CM ANCHO DE CUCHARA DE 15 CM', 6, 5.1, 6, 1000, '/products/DPSCUDEN078.jpg', cat_id, true, true, 'DPSCUDEN078', 'DPS', 'UN', '', '', 4.5, 1.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tapa Capuccino Negra pvaso 08 oz', 'tapa-capuccino-negra-pvaso-08-oz-fopiy-lhc08', 'FOODPACK - Tapa Capuccino Negra pvaso 08 oz', 19, 16.15, 6, 1, '/products/FOPIY-LHC08.jpg', cat_id, false, true, 'FOPIY-LHC08', 'FOODPACK', 'UN', '', '08OZ', 15, 4)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'desechables' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TAPA VASO POLIPAPEL 8 OZ', 'tapa-vaso-polipapel-8-oz-dnlrpn0602082t', 'SIN MARCA - TAPA VASO POLIPAPEL 8 OZ', 36, 30.6, 6, 4000, NULL, cat_id, true, true, 'DNLRPN0602082T', 'SIN MARCA', 'UN', '', '8OZ', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PORTAMINAS PLAST. 0,9 MM AZUL TORRE', 'portaminas-plast-09-mm-azul-torre-tor34049', 'TORRE - PORTAMINAS PLAST. 0,9 MM AZUL TORRE', 7364, 6259.4, 6, 1440, '/products/TOR34049.jpg', cat_id, true, true, 'TOR34049', 'TORRE', 'UN', '', '', 6840, 524)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Lápiz Pasta Torre Punta Media 1.0 MM', 'lapiz-pasta-torre-punta-media-10-mm-pri31458az', 'TORRE - Lápiz Pasta Torre Punta Media 1.0 MM', 6900, 5865.0, 6, 599, '/products/PRI31458AZ.jpg', cat_id, true, true, 'PRI31458AZ', 'TORRE', 'UN', '', '', 5100, 1800)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Marcador Permanente Isofit Punta Fina 0.8', 'marcador-permanente-isofit-punta-fina-08-pri45188', 'ISOFIT - Marcador Permanente Isofit Punta Fina 0.8', 6492, 5518.2, 6, 141, NULL, cat_id, true, true, 'PRI45188', 'ISOFIT', 'UN', '', '', 3492, 3000)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Lápiz Pasta Torre Punta Media 1.0 ROJO', 'lapiz-pasta-torre-punta-media-10-rojo-pri31458rj', 'TORRE - Lápiz Pasta Torre Punta Media 1.0 ROJO', 4128, 3508.8, 6, 50, '/products/PRI31458RJ.jpg', cat_id, false, true, 'PRI31458RJ', 'TORRE', 'UN', '', '', 5100, -972)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BL. 2 GRAFITOGOMASACAPUNTAREGLA TORRE', 'bl-2-grafitogomasacapuntaregla-torre-tor34196', 'TORRE - BL. 2 GRAFITOGOMASACAPUNTAREGLA TORRE', 1686, 1433.1, 6, 192, '/products/TOR34196.jpg', cat_id, false, true, 'TOR34196', 'TORRE', 'UN', '', '', 1290, 396)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Lápiz Pasta Pilot Bp-S Punta Fina 0.7 Azul', 'lapiz-pasta-pilot-bp-s-punta-fina-07-azul-pri10016az', 'PRISA - Lápiz Pasta Pilot Bp-S Punta Fina 0.7 Azul', 904, 768.4, 6, 180, '/products/PRI10016AZ.jpg', cat_id, false, true, 'PRI10016AZ', 'PRISA', 'UN', '', '', 768, 136)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BOLIGRAFO GEL PENTEL ENERGEL PUNTA AGUJA 0.5 MM AZUL', 'boligrafo-gel-pentel-energel-punta-aguja-05-mm-azul-pri10874az', 'PRISA - BOLIGRAFO GEL PENTEL ENERGEL PUNTA AGUJA 0.5 MM AZUL', 1368, 1162.8, 6, 70, '/products/PRI10874AZ.jpg', cat_id, false, true, 'PRI10874AZ', 'PRISA', 'UN', '', '', 1163, 205)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bolígrafo Tinta Pilot Vball Grip Broad 1.0 mm Azul', 'boligrafo-tinta-pilot-vball-grip-broad-10-mm-azul-pri17445az', 'PRISA - Bolígrafo Tinta Pilot Vball Grip Broad 1.0 mm Azul', 16110, 13693.5, 6, 6, NULL, cat_id, true, true, 'PRI17445AZ', 'PRISA', 'UN', '', '', 12890, 3220)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('GOMA EVA 60X40 CMS METALIZADA X COLOR', 'goma-eva-60x40-cms-metalizada-x-color-marmp705', 'SIN MARCA - GOMA EVA 60X40 CMS METALIZADA X COLOR', 652, 554.2, 6, 88, NULL, cat_id, false, true, 'MARMP705', 'SIN MARCA', 'UN', '60X40', '60X40CM', 494, 158)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('MARCADOR PIZARRA RECARGABLE VERDE', 'marcador-pizarra-recargable-verde-pnb497985', 'FULTONS - MARCADOR PIZARRA RECARGABLE VERDE', 2409, 2047.65, 6, 36, '/products/PNB497985.jpg', cat_id, true, true, 'PNB497985', 'FULTONS', 'UN', '', '', 1196, 1213)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Plumón Pizarra Pilot Vboard Recargable Cartucho Azul', 'plumon-pizarra-pilot-vboard-recargable-cartucho-azul-pri25910az', 'PRISA - Plumón Pizarra Pilot Vboard Recargable Cartucho Azul', 1581, 1343.85, 6, 30, '/products/PRI25910AZ.jpg', cat_id, false, true, 'PRI25910AZ', 'PRISA', 'UN', '', '', 1344, 237)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Plumón Pizarra Pilot Vboard Recargable Cartucho Negro', 'plumon-pizarra-pilot-vboard-recargable-cartucho-negro-pri25910ng', 'PRISA - Plumón Pizarra Pilot Vboard Recargable Cartucho Negro', 1581, 1343.85, 6, 30, '/products/PRI25910NG.jpg', cat_id, false, true, 'PRI25910NG', 'PRISA', 'UN', '', '', 1344, 237)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Plumón Pizarra Pilot Vboard Recargable con Cartucho Rojo', 'plumon-pizarra-pilot-vboard-recargable-con-cartucho-rojo-pri25910rj', 'PRISA - Plumón Pizarra Pilot Vboard Recargable con Cartucho Rojo', 1581, 1343.85, 6, 30, '/products/PRI25910RJ.jpg', cat_id, false, true, 'PRI25910RJ', 'PRISA', 'UN', '', '', 1344, 237)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Plumón Pizarra Pilot Vboard Recargable Cartucho Violeta', 'plumon-pizarra-pilot-vboard-recargable-cartucho-violeta-pri25910vi', 'PRISA - Plumón Pizarra Pilot Vboard Recargable Cartucho Violeta', 1581, 1343.85, 6, 30, '/products/PRI25910VI.jpg', cat_id, false, true, 'PRI25910VI', 'PRISA', 'UN', '', '', 1344, 237)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('GOMA DE BORRAR FACTIS MIGA BLANCO s20', 'goma-de-borrar-factis-miga-blanco-s20-pri99825', 'PRISA - GOMA DE BORRAR FACTIS MIGA BLANCO s20', 415, 352.75, 6, 120, '/products/PRI99825.jpg', cat_id, false, true, 'PRI99825', 'PRISA', 'UN', '', '', 299, 116)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('DESTACADOR CELESTE', 'destacador-celeste-pnb435182', 'FULTONS - DESTACADOR CELESTE', 233, 198.05, 6, 171, '/products/PNB435182.jpg', cat_id, false, true, 'PNB435182', 'FULTONS', 'UN', '', '', 199, 34)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('DEDO DE GOMA MEDIDA S REF.3050 12 UNID.(12-144)', 'dedo-de-goma-medida-s-ref3050-12-unid12-144-jmidedohai001', 'BEIFA - DEDO DE GOMA MEDIDA S REF.3050 12 UNID.(12-144)', 1323, 1124.55, 6, 32, '/products/JMIDEDOHAI001.jpg', cat_id, false, true, 'JMIDEDOHAI001', 'BEIFA', 'UN', '', '', 1050, 273)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('LAMINAS PLASTIFICAR A7 80X110 125 MIC TORRE 100 UNI', 'laminas-plastificar-a7-80x110-125-mic-torre-100-uni-tor33712', 'TORRE - LAMINAS PLASTIFICAR A7 80X110 125 MIC TORRE 100 UNI', 1981, 1683.85, 6, 11, '/products/TOR33712.jpg', cat_id, false, true, 'TOR33712', 'TORRE', 'UN', '80X110', '', 2784, -803)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Botella de Tinta Epson T544120220320420 Pack 4 Colores', 'botella-de-tinta-epson-t544120220320420-pack-4-colores-pri29084', 'PRISA - Botella de Tinta Epson T544120220320420 Pack 4 Colores', 14073, 11962.05, 6, 1, NULL, cat_id, false, true, 'PRI29084', 'PRISA', 'PACK', 'PACK4', '', 28329, -14256)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Botella de Tinta Epson T664120/220/320/420 Pack 4 Colores', 'botella-de-tinta-epson-t664120220320420-pack-4-colores-pri29085', 'PRISA - Botella de Tinta Epson T664120/220/320/420 Pack 4 Colores', 35404, 30093.4, 6, 1, NULL, cat_id, true, true, 'PRI29085', 'PRISA', 'PACK', 'PACK4', '', 28323, 7081)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PORTA SCOTCH MEDIANO C/PORTA LAPIZ 89043S(1-60)', 'porta-scotch-mediano-cporta-lapiz-89043s1-60-jmiporthai001', 'BEIFA - PORTA SCOTCH MEDIANO C/PORTA LAPIZ 89043S(1-60)', 2205, 1874.25, 6, 28, NULL, cat_id, true, true, 'JMIPORTHAI001', 'BEIFA', 'UN', '', '', 938, 1267)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Destacador Sharpie S Note 12 Colores', 'destacador-sharpie-s-note-12-colores-pri78655', 'PRISA - Destacador Sharpie S Note 12 Colores', 7764, 6599.4, 6, 3, '/products/PRI78655.jpg', cat_id, false, true, 'PRI78655', 'PRISA', 'UN', '', '', 7923, -159)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Pintura de Cara Artel Lápiz 6 Colores', 'pintura-de-cara-artel-lapiz-6-colores-pri10226', 'ARTEL - Pintura de Cara Artel Lápiz 6 Colores', 5240, 4454.0, 6, 5, NULL, cat_id, true, true, 'PRI10226', 'ARTEL', 'UN', '', '', 4454, 786)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CORCHETERA SEMI INDUSTRIAL METAL BASE GOMA P/100HJS. 23/6,23/8,23/10,23/1 LAVORO', 'corchetera-semi-industrial-metal-base-goma-p100hjs-2362382310231-lavoro-pnb355234', 'FULTONS - CORCHETERA SEMI INDUSTRIAL METAL BASE GOMA P/100HJS. 23/6,23/8,23/10,23/1 LAVORO', 11237, 9551.45, 6, 2, NULL, cat_id, true, true, 'PNB355234', 'FULTONS', 'UN', '', '', 8990, 2247)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Botella de Tinta Epson T504120 Negro', 'botella-de-tinta-epson-t504120-negro-pri28583', 'PRISA - Botella de Tinta Epson T504120 Negro', 10465, 8895.25, 6, 2, NULL, cat_id, true, true, 'PRI28583', 'PRISA', 'UN', '', '', 8372, 2093)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('DESTACADOR BOLSILLO PTA.BISEL VERDE FULTONS', 'destacador-bolsillo-ptabisel-verde-fultons-pnb435179', 'FULTONS - DESTACADOR BOLSILLO PTA.BISEL VERDE FULTONS', 1650, 1402.5, 6, 84, '/products/PNB435179.jpg', cat_id, true, true, 'PNB435179', 'FULTONS', 'UN', '', '', 199, 1451)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BOLIGRAFO CRISTAL ROJO SELLOFFICE', 'boligrafo-cristal-rojo-selloffice-adiabgf403003', 'SELLOFFICE - BOLIGRAFO CRISTAL ROJO SELLOFFICE', 230, 195.5, 6, 196, '/products/ADIABGF403003.jpg', cat_id, false, true, 'ADIABGF403003', 'SELLOFFICE', 'UN', '', '', 83, 147)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Botella de Tinta Epson T664120 Negro', 'botella-de-tinta-epson-t664120-negro-pri27228', 'PRISA - Botella de Tinta Epson T664120 Negro', 9413, 8001.05, 6, 2, NULL, cat_id, true, true, 'PRI27228', 'PRISA', 'UN', '', '', 7530, 1883)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Botella de Tinta Epson T504220 Cian', 'botella-de-tinta-epson-t504220-cian-pri28584', 'PRISA - Botella de Tinta Epson T504220 Cian', 9413, 8001.05, 6, 2, NULL, cat_id, true, true, 'PRI28584', 'PRISA', 'UN', '', '', 7530, 1883)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Botella de Tinta Epson T504320 Magenta Botella de Tinta Epson T504320 Magenta', 'botella-de-tinta-epson-t504320-magenta-botella-de-tinta-epson-t504320-magenta-pri28585', 'PRISA - Botella de Tinta Epson T504320 Magenta Botella de Tinta Epson T504320 Magenta', 9413, 8001.05, 6, 2, NULL, cat_id, true, true, 'PRI28585', 'PRISA', 'UN', '', '', 7530, 1883)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Botella de Tinta Epson T504420 Amarillo', 'botella-de-tinta-epson-t504420-amarillo-pri28586', 'PRISA - Botella de Tinta Epson T504420 Amarillo', 9413, 8001.05, 6, 2, NULL, cat_id, true, true, 'PRI28586', 'PRISA', 'UN', '', '', 7530, 1883)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Marcador Permanente Zebra Punta Fina Negro', 'marcador-permanente-zebra-punta-fina-negro-pri45816ng', 'PRISA - Marcador Permanente Zebra Punta Fina Negro', 524, 445.4, 6, 36, '/products/PRI45816NG.jpg', cat_id, false, true, 'PRI45816NG', 'PRISA', 'UN', '', '', 401, 123)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TINTA PARA TAMPON COLOR ROJO 30ML (12-360)', 'tinta-para-tampon-color-rojo-30ml-12-360-jmitintbei002', 'BEIFA - TINTA PARA TAMPON COLOR ROJO 30ML (12-360)', 339, 288.15, 6, 54, '/products/JMITINTBEI002.jpg', cat_id, false, true, 'JMITINTBEI002', 'BEIFA', 'UN', '', '30ML', 263, 76)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Plumón Pizarra Faber-Castell 123 Jumbo Desechable Negro', 'plumon-pizarra-faber-castell-123-jumbo-desechable-negro-pri83226ng', 'PRISA - Plumón Pizarra Faber-Castell 123 Jumbo Desechable Negro', 1056, 897.6, 6, 15, NULL, cat_id, false, true, 'PRI83226NG', 'PRISA', 'UN', '', '', 845, 211)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BOLIGRAFO PASTA AZUL P/GRUESA AA935 (50-1000)', 'boligrafo-pasta-azul-pgruesa-aa935-50-1000-jmibolibei001', 'BEIFA - BOLIGRAFO PASTA AZUL P/GRUESA AA935 (50-1000)', 216, 183.6, 6, 200, '/products/JMIBOLIBEI001.jpg', cat_id, false, true, 'JMIBOLIBEI001', 'BEIFA', 'UN', '', '', 56, 160)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PORTAMINAS PLASTICO CON GRIP 0,5 MM', 'portaminas-plastico-con-grip-05-mm-pnb551774', 'FULTONS - PORTAMINAS PLASTICO CON GRIP 0,5 MM', 298, 253.3, 6, 36, NULL, cat_id, false, true, 'PNB551774', 'FULTONS', 'UN', '', '', 290, 8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BOLIGRAFO GEL ISOFIT 0,7MM AZUL-8', 'boligrafo-gel-isofit-07mm-azul-8-lib35145-8', 'ISOFIT - BOLIGRAFO GEL ISOFIT 0,7MM AZUL-8', 426, 362.1, 6, 32, '/products/LIB35145-8.jpg', cat_id, false, true, 'LIB35145-8', 'ISOFIT', 'UN', '', '', 319, 107)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BOLIGRAFO PASTA AZUL P/GRUESA AA935 (50-1000)', 'boligrafo-pasta-azul-pgruesa-aa935-50-1000-jmbolibei001', 'SIN MARCA - BOLIGRAFO PASTA AZUL P/GRUESA AA935 (50-1000)', 201, 170.85, 6, 195, '/products/JMBOLIBEI001.jpg', cat_id, false, true, 'JMBOLIBEI001', 'SIN MARCA', 'UN', '', '', 49, 152)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('DESTACADOR ROSADO', 'destacador-rosado-pnb435180', 'FULTONS - DESTACADOR ROSADO', 258, 219.3, 6, 48, '/products/PNB435180.jpg', cat_id, false, true, 'PNB435180', 'FULTONS', 'UN', '', '', 199, 59)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PORTAMINAS PLAST. 0,7MM MIX COLORES TORRE', 'portaminas-plast-07mm-mix-colores-torre-tor30200', 'TORRE - PORTAMINAS PLAST. 0,7MM MIX COLORES TORRE', 298, 253.3, 6, 15, '/products/TOR30200.jpg', cat_id, false, true, 'TOR30200', 'TORRE', 'UN', '', '', 620, -322)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('LAPIZ GEL ROJO 0.7 MM', 'lapiz-gel-rojo-07-mm-tor15848', 'TORRE - LAPIZ GEL ROJO 0.7 MM', 464, 394.4, 6, 17, '/products/TOR15848.jpg', cat_id, false, true, 'TOR15848', 'TORRE', 'UN', '', '', 500, -36)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('MARCADOR PERMANENTE FINO DOBLE PUNTA 24 UN - ADIX', 'marcador-permanente-fino-doble-punta-24-un-adix-dim498474', 'DIMERC - MARCADOR PERMANENTE FINO DOBLE PUNTA 24 UN - ADIX', 3223, 2739.55, 6, 3, NULL, cat_id, true, true, 'DIM498474', 'DIMERC', 'CAJA', '', '', 2563, 660)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Botella de Tinta Epson T664220 Cian', 'botella-de-tinta-epson-t664220-cian-pri27229', 'PRISA - Botella de Tinta Epson T664220 Cian', 9413, 8001.05, 6, 1, NULL, cat_id, true, true, 'PRI27229', 'PRISA', 'UN', '', '', 7530, 1883)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('COMPÁS CON PORTALÁPIZ (BOX) COLON', 'compas-con-portalapiz-box-colon-tor31234', 'TORRE - COMPÁS CON PORTALÁPIZ (BOX) COLON', 560, 476.0, 6, 16, '/products/TOR31234.jpg', cat_id, false, true, 'TOR31234', 'TORRE', 'UN', '', '', 462, 98)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('GOMA EVA 20X30 10UND.00 SURTIDO (100)', 'goma-eva-20x30-10und00-surtido-100-jmigomashi017', 'BEIFA - GOMA EVA 20X30 10UND.00 SURTIDO (100)', 953, 810.05, 6, 10, NULL, cat_id, false, true, 'JMIGOMASHI017', 'BEIFA', 'UN', '20X30', '', 638, 315)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('DESTACADOR NARANJO', 'destacador-naranjo-pnb435181', 'FULTONS - DESTACADOR NARANJO', 428, 363.8, 6, 32, NULL, cat_id, false, true, 'PNB435181', 'FULTONS', 'UN', '', '', 199, 229)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('GOMA EVA PLIEGO AZUL 45X60CM.EVA046 (20)', 'goma-eva-pliego-azul-45x60cmeva046-20-jmigomashi049', 'BEIFA - GOMA EVA PLIEGO AZUL 45X60CM.EVA046 (20)', 684, 581.4, 6, 45, NULL, cat_id, true, true, 'JMIGOMASHI049', 'BEIFA', 'UN', '45X60', '45X60CM', 133.2, 550.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Lápiz Fibra Artline 210 0.6 mm Azul', 'lapiz-fibra-artline-210-06-mm-azul-pri80073az', 'PRISA - Lápiz Fibra Artline 210 0.6 mm Azul', 821, 697.85, 6, 8, NULL, cat_id, false, true, 'PRI80073AZ', 'PRISA', 'UN', '', '', 657, 164)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PLUMONES DIBUJO 12 COLORES COLÓN', 'plumones-dibujo-12-colores-colon-tor30575', 'TORRE - PLUMONES DIBUJO 12 COLORES COLÓN', 813, 691.05, 6, 7, '/products/TOR30575.jpg', cat_id, false, true, 'TOR30575', 'TORRE', 'UN', '', '', 715, 98)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bolígrafo Tinta Pilot Vball 0.7 grip Broad Negro', 'boligrafo-tinta-pilot-vball-07-grip-broad-negro-pri17446ng', 'PRISA - Bolígrafo Tinta Pilot Vball 0.7 grip Broad Negro', 1623, 1379.55, 6, 3, '/products/PRI17446NG.jpg', cat_id, false, true, 'PRI17446NG', 'PRISA', 'UN', '', '', 1289, 334)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bolígrafo Tinta Pilot Vball 0.7 grip Broad Rojo', 'boligrafo-tinta-pilot-vball-07-grip-broad-rojo-pri17446rj', 'PRISA - Bolígrafo Tinta Pilot Vball 0.7 grip Broad Rojo', 1626, 1382.1, 6, 3, '/products/PRI17446RJ.jpg', cat_id, false, true, 'PRI17446RJ', 'PRISA', 'UN', '', '', 1289, 337)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BORRADOR PIZARRA MAGNETICA AZUL TORRE', 'borrador-pizarra-magnetica-azul-torre-tor30570', 'TORRE - BORRADOR PIZARRA MAGNETICA AZUL TORRE', 535, 454.75, 6, 9, '/products/TOR30570.jpg', cat_id, false, true, 'TOR30570', 'TORRE', 'UN', '', '', 425, 110)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Lápiz Cera Torre Jumbo Pekes 24 Colores', 'lapiz-cera-torre-jumbo-pekes-24-colores-pri45553', 'TORRE - Lápiz Cera Torre Jumbo Pekes 24 Colores', 6515, 5537.75, 6, 1, '/products/PRI45553.jpg', cat_id, true, true, 'PRI45553', 'TORRE', 'UN', '', '', 3696, 2819)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('MARCADOR PIZARRA PTA REDONDA VERDE TORRE', 'marcador-pizarra-pta-redonda-verde-torre-tor28204', 'TORRE - MARCADOR PIZARRA PTA REDONDA VERDE TORRE', 563, 478.55, 6, 6, '/products/TOR28204.jpg', cat_id, false, true, 'TOR28204', 'TORRE', 'UN', '', '', 493, 70)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BOLIGRAFO GEL AZUL 0.7 PUNTA METAL', 'boligrafo-gel-azul-07-punta-metal-jmibolibei009', 'BEIFA - BOLIGRAFO GEL AZUL 0.7 PUNTA METAL', 495, 420.75, 6, 15, NULL, cat_id, false, true, 'JMIBOLIBEI009', 'BEIFA', 'UN', '', '', 184, 311)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BL. SET 3 BOLIGRAFO 0.5 MM PUNTA FINA 1A1R1N', 'bl-set-3-boligrafo-05-mm-punta-fina-1a1r1n-tor34031', 'TORRE - BL. SET 3 BOLIGRAFO 0.5 MM PUNTA FINA 1A1R1N', 342, 290.7, 6, 4, '/products/TOR34031.jpg', cat_id, false, true, 'TOR34031', 'TORRE', 'UN', '', '', 625, -283)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('MARCADOR PIZARRA PTA REDONDA ROJO TORRE', 'marcador-pizarra-pta-redonda-rojo-torre-tor28203', 'TORRE - MARCADOR PIZARRA PTA REDONDA ROJO TORRE', 563, 478.55, 6, 5, '/products/TOR28203.jpg', cat_id, false, true, 'TOR28203', 'TORRE', 'UN', '', '', 493, 70)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BOLIGRAFO PASTA AZUL PUNTA FINA', 'boligrafo-pasta-azul-punta-fina-jmibolibei018', 'BEIFA - BOLIGRAFO PASTA AZUL PUNTA FINA', 122, 103.7, 6, 50, '/products/JMIBOLIBEI018.jpg', cat_id, false, true, 'JMIBOLIBEI018', 'BEIFA', 'UN', '', '', 49, 73)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BOLIGRAFO PASTA NEGRO P/FINA (50/1000)', 'boligrafo-pasta-negro-pfina-501000-jmibolibei019', 'BEIFA - BOLIGRAFO PASTA NEGRO P/FINA (50/1000)', 230, 195.5, 6, 50, NULL, cat_id, false, true, 'JMIBOLIBEI019', 'BEIFA', 'UN', '', '', 49, 181)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Lápiz Color Giotto 24 Unidades', 'lapiz-color-giotto-24-unidades-pri45677', 'PRISA - Lápiz Color Giotto 24 Unidades', 2193, 1864.05, 6, 1, '/products/PRI45677.jpg', cat_id, false, true, 'PRI45677', 'PRISA', 'CAJA', '', '', 2429, -236)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Corrector Líquido en Lápiz Hand 10 Ml', 'corrector-liquido-en-lapiz-hand-10-ml-pri74714', 'PRISA - Corrector Líquido en Lápiz Hand 10 Ml', 301, 255.85, 6, 9, NULL, cat_id, false, true, 'PRI74714', 'PRISA', 'UN', '', '10ML', 256, 45)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PLUMON DE PIZARRA VERDE MONAMI', 'plumon-de-pizarra-verde-monami-sen2080151522', 'MONAMI - PLUMON DE PIZARRA VERDE MONAMI', 526, 447.1, 6, 9, NULL, cat_id, false, true, 'SEN2080151522', 'MONAMI', 'UN', '', '', 249, 277)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('MARCADOR PERM PTA RED AZUL', 'marcador-perm-pta-red-azul-pnb104422', 'FULTONS - MARCADOR PERM PTA RED AZUL', 227, 192.95, 6, 9, '/products/PNB104422.jpg', cat_id, false, true, 'PNB104422', 'FULTONS', 'UN', '', '', 199, 28)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('DEDO DE GOMA MEDIDA M REF.3051M12 UNID.(12-144)', 'dedo-de-goma-medida-m-ref3051m12-unid12-144-jmidedohai002', 'BEIFA - DEDO DE GOMA MEDIDA M REF.3051M12 UNID.(12-144)', 1678, 1426.3, 6, 2, '/products/JMIDEDOHAI002.jpg', cat_id, true, true, 'JMIDEDOHAI002', 'BEIFA', 'UN', '', '', 825, 853)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('MARCADOR PERM. PTA.RED. ROJO FULTONS', 'marcador-perm-ptared-rojo-fultons-pnb104420', 'FULTONS - MARCADOR PERM. PTA.RED. ROJO FULTONS', 227, 192.95, 6, 8, NULL, cat_id, false, true, 'PNB104420', 'FULTONS', 'UN', '', '', 199, 28)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Destacador Offione Tipo Lápiz Naranjo Fluorescente', 'destacador-offione-tipo-lapiz-naranjo-fluorescente-pri56827nj', 'PRISA - Destacador Offione Tipo Lápiz Naranjo Fluorescente', 316, 268.6, 6, 6, '/products/PRI56827NJ.jpg', cat_id, false, true, 'PRI56827NJ', 'PRISA', 'UN', '', '', 220, 96)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BOLIGRAFO NEGRO 1,0 TORRE', 'boligrafo-negro-10-torre-tor34040', 'TORRE - BOLIGRAFO NEGRO 1,0 TORRE', 143, 121.55, 6, 10, '/products/TOR34040.jpg', cat_id, false, true, 'TOR34040', 'TORRE', 'UN', '', '', 115, 28)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TINTA PARA TAMPON COLOR AZUL 30ML (12-360)', 'tinta-para-tampon-color-azul-30ml-12-360-jmitintbei001', 'BEIFA - TINTA PARA TAMPON COLOR AZUL 30ML (12-360)', 1093, 929.05, 6, 3, '/products/JMITINTBEI001.jpg', cat_id, true, true, 'JMITINTBEI001', 'BEIFA', 'UN', '', '30ML', 350, 743)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('DEDO DE GOMA MEDIDA L REF.3052L', 'dedo-de-goma-medida-l-ref3052l-jmidedohai003', 'BEIFA - DEDO DE GOMA MEDIDA L REF.3052L', 122, 103.7, 6, 11, '/products/JMIDEDOHAI003.jpg', cat_id, false, true, 'JMIDEDOHAI003', 'BEIFA', 'UN', '', '3052L', 76, 46)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('LÁPIZ GRAFITO TRIANGULAR, HB N2, SELLOFFICE', 'lapiz-grafito-triangular-hb-n2-selloffice-adialgf102013', 'SELLOFFICE - LÁPIZ GRAFITO TRIANGULAR, HB N2, SELLOFFICE', 1406, 1195.1, 6, 1, '/products/ADIALGF102013.jpg', cat_id, true, true, 'ADIALGF102013', 'SELLOFFICE', 'UN', '', '', 792, 614)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('MARCADOR DE PIZARRA DESECH. PTA.RED. VERDE FULTONS', 'marcador-de-pizarra-desech-ptared-verde-fultons-pnb393818', 'FULTONS - MARCADOR DE PIZARRA DESECH. PTA.RED. VERDE FULTONS', 341, 289.85, 6, 3, '/products/PNB393818.jpg', cat_id, false, true, 'PNB393818', 'FULTONS', 'UN', '', '', 249, 92)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('GOMA DE BORRAR GRANDE MIGA FULTONS', 'goma-de-borrar-grande-miga-fultons-pnb103561', 'FULTONS - GOMA DE BORRAR GRANDE MIGA FULTONS', 278, 236.3, 6, 5, '/products/PNB103561.jpg', cat_id, false, true, 'PNB103561', 'FULTONS', 'UN', '', '', 139, 139)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('LAPIZ PASTA BIC CRISTAL PUNTA MEDIANA 1.0 MM AZUL', 'lapiz-pasta-bic-cristal-punta-mediana-10-mm-azul-pri10001az', 'PRISA - LAPIZ PASTA BIC CRISTAL PUNTA MEDIANA 1.0 MM AZUL', 186, 158.1, 6, 3, '/products/PRI10001AZ.jpg', cat_id, false, true, 'PRI10001AZ', 'PRISA', 'UN', '', '', 175, 11)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('MARCADOR DE PIZARRA DESECH. PTA.RED. AZUL FULTONS', 'marcador-de-pizarra-desech-ptared-azul-fultons-pnb393816', 'FULTONS - MARCADOR DE PIZARRA DESECH. PTA.RED. AZUL FULTONS', 737, 626.45, 6, 1, '/products/PNB393816.jpg', cat_id, false, true, 'PNB393816', 'FULTONS', 'UN', '', '', 259, 478)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('LÁPIZ PASTA PTA.MEDIA 1.0MM AZUL CP TRANSPARENTE FULTONS', 'lapiz-pasta-ptamedia-10mm-azul-cp-transparente-fultons-pnb463094', 'FULTONS - LÁPIZ PASTA PTA.MEDIA 1.0MM AZUL CP TRANSPARENTE FULTONS', 108.4, 92.14, 6, 2, NULL, cat_id, false, true, 'PNB463094', 'FULTONS', 'UN', '', '', 82, 26.4)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('LAMINAS PLASTIFICAR OFICIO 75 MIC TORRE UND', 'laminas-plastificar-oficio-75-mic-torre-und-tor35060', 'TORRE - LAMINAS PLASTIFICAR OFICIO 75 MIC TORRE UND', 100, 85.0, 6, 1, '/products/TOR35060.jpg', cat_id, false, true, 'TOR35060', 'TORRE', 'UN', '', '', 53.4, 46.6)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BOLIGRAFO PASTA NEGRO P/GRUESAA935 (50-1000)', 'boligrafo-pasta-negro-pgruesaa935-50-1000-jmbolibei002', 'SIN MARCA - BOLIGRAFO PASTA NEGRO P/GRUESAA935 (50-1000)', 201, 170.85, 6, 1, NULL, cat_id, false, true, 'JMBOLIBEI002', 'SIN MARCA', 'UN', '', '', 49, 152)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BOLIGRAFO GEL AZUL 0.5 PUNTA METAL PUNTA METAL', 'boligrafo-gel-azul-05-punta-metal-punta-metal-jmibolibei005', 'BEIFA - BOLIGRAFO GEL AZUL 0.5 PUNTA METAL PUNTA METAL', 512, 435.2, 6, 44, '/products/JMIBOLIBEI005.jpg', cat_id, false, true, 'JMIBOLIBEI005', 'BEIFA', 'UN', '', '', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BOLIGRAFO GEL NEGRO 0.7 PUNTA METAL (12-144)', 'boligrafo-gel-negro-07-punta-metal-12-144-jmibolibei010', 'BEIFA - BOLIGRAFO GEL NEGRO 0.7 PUNTA METAL (12-144)', 496, 421.6, 6, 10, '/products/JMIBOLIBEI010.jpg', cat_id, false, true, 'JMIBOLIBEI010', 'BEIFA', 'UN', '', '', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BORRADOR DE MADERA PARA PIZARRA 13 X 4 CM (12-144)', 'borrador-de-madera-para-pizarra-13-x-4-cm-12-144-jmiborrbei003', 'BEIFA - BORRADOR DE MADERA PARA PIZARRA 13 X 4 CM (12-144)', 507, 430.95, 6, 30, '/products/JMIBORRBEI003.jpg', cat_id, false, true, 'JMIBORRBEI003', 'BEIFA', 'UN', '13X4', '13X4CM', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('MINAS 0.7 MM. HB 12 UN. FULTONS', 'minas-07-mm-hb-12-un-fultons-pnb292094', 'FULTONS - MINAS 0.7 MM. HB 12 UN. FULTONS', 313, 266.05, 6, 25, '/products/PNB292094.jpg', cat_id, false, true, 'PNB292094', 'FULTONS', 'CAJA', '', '', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('DESTACADOR COLOR AMARILLO PUNTA BISELADA', 'destacador-color-amarillo-punta-biselada-pnb435178', 'FULTONS - DESTACADOR COLOR AMARILLO PUNTA BISELADA', 2516, 2138.6, 6, 50, '/products/PNB435178.jpg', cat_id, false, true, 'PNB435178', 'FULTONS', 'UN', '', '', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'escritura' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BOLSON GOMA EVA TORRE IMAGIA', 'bolson-goma-eva-torre-imagia-tor21734', 'TORRE - BOLSON GOMA EVA TORRE IMAGIA', 989, 840.65, 6, 14, '/products/TOR21734.jpg', cat_id, false, true, 'TOR21734', 'TORRE', 'BOLSA', '', '', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Toalla de Papel Tecnoroll Económica 2 Rollos 150 m Hoja Simple', 'toalla-de-papel-tecnoroll-economica-2-rollos-150-m-hoja-simple-pri34312', 'TECNOROLL - Toalla de Papel Tecnoroll Económica 2 Rollos 150 m Hoja Simple', 28488, 24214.8, 6, 144, '/products/PRI34312.jpg', cat_id, true, true, 'PRI34312', 'TECNOROLL', 'ROLLO', '2ROLLOS', '', 16050, 12438)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Virutilla Piso Manlac Gruesa N 4 Mediana', 'virutilla-piso-manlac-gruesa-n-4-mediana-pri51101', 'MANLAC - Virutilla Piso Manlac Gruesa N 4 Mediana', 5620, 4777.0, 6, 270, NULL, cat_id, true, true, 'PRI51101', 'MANLAC', 'UN', '', '', 4780, 840)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Toalla de Papel Ovella Plus 2 Rollos 250 m Hoja Simple', 'toalla-de-papel-ovella-plus-2-rollos-250-m-hoja-simple-pri14965', 'PRISA - Toalla de Papel Ovella Plus 2 Rollos 250 m Hoja Simple', 9511, 8084.35, 6, 120, '/products/PRI14965.jpg', cat_id, true, true, 'PRI14965', 'PRISA', 'ROLLO', '2ROLLOS', '', 8084, 1427)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('DESINFECTANTE EN AEROSOL IGENIX TRADICIONAL ANTIBACTERIAL 360 CC', 'desinfectante-en-aerosol-igenix-tradicional-antibacterial-360-cc-pri84802t', 'PRISA - DESINFECTANTE EN AEROSOL IGENIX TRADICIONAL ANTIBACTERIAL 360 CC', 736, 625.6, 6, 301, '/products/PRI84802T.jpg', cat_id, false, true, 'PRI84802T', 'PRISA', 'UN', '', '360CC', 1796, -1060)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Jabón para Manos Tork Espuma 1 L', 'jabon-para-manos-tork-espuma-1-l-pri18692', 'PRISA - Jabón para Manos Tork Espuma 1 L', 13192, 11213.2, 6, 40, '/products/PRI18692.jpg', cat_id, true, true, 'PRI18692', 'PRISA', 'UN', '', '1L', 10866, 2326)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Desinfectante en Aerosol Lysoform Antibacterial Frutal 360 ml', 'desinfectante-en-aerosol-lysoform-antibacterial-frutal-360-ml-pri84542fr', 'PRISA - Desinfectante en Aerosol Lysoform Antibacterial Frutal 360 ml', 3373, 2867.05, 6, 100, '/products/PRI84542FR.jpg', cat_id, false, true, 'PRI84542FR', 'PRISA', 'UN', '', '360ML', 3391, -18)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Jabón Líquido Difem Pharma Neutro Balsámico 1 l', 'jabon-liquido-difem-pharma-neutro-balsamico-1-l-pri89384', 'PRISA - Jabón Líquido Difem Pharma Neutro Balsámico 1 l', 6488, 5514.8, 6, 50, NULL, cat_id, true, true, 'PRI89384', 'PRISA', 'UN', '', '1L', 5515, 973)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('LIMPIADOR AMONIO CUATERNARIO 500 CC', 'limpiador-amonio-cuaternario-500-cc-dim529435', 'DIMERC - LIMPIADOR AMONIO CUATERNARIO 500 CC', 2854, 2425.9, 6, 199, '/products/DIM529435.jpg', cat_id, true, true, 'DIM529435', 'DIMERC', 'UN', '', '500CC', 1368, 1486)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Toalla de Papel Tecnoroll Jumbo 2 Rollos 250 m Hoja Simple', 'toalla-de-papel-tecnoroll-jumbo-2-rollos-250-m-hoja-simple-pri27594', 'TECNOROLL - Toalla de Papel Tecnoroll Jumbo 2 Rollos 250 m Hoja Simple', 2929, 2489.65, 6, 30, '/products/PRI27594.jpg', cat_id, false, true, 'PRI27594', 'TECNOROLL', 'ROLLO', '2ROLLOS', '', 7750, -4821)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bolsa de Aseo Tremex Eco Activa Basurero Municipal 90x120 cm 10 Unidades', 'bolsa-de-aseo-tremex-eco-activa-basurero-municipal-90x120-cm-10-unidades-pri72128', 'PRISA - Bolsa de Aseo Tremex Eco Activa Basurero Municipal 90x120 cm 10 Unidades', 2877, 2445.45, 6, 100, NULL, cat_id, true, true, 'PRI72128', 'PRISA', 'BOLSA', '90X120', '90X120CM', 2305, 572)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('LIMPIADOR CREMA CIF ORIGINAL MICROPARTÍCULAS 750 grs', 'limpiador-crema-cif-original-microparticulas-750-grs-pri80715', 'PRISA - LIMPIADOR CREMA CIF ORIGINAL MICROPARTÍCULAS 750 grs', 2052, 1744.2, 6, 57, '/products/PRI80715.jpg', cat_id, false, true, 'PRI80715', 'PRISA', 'UN', '', '750GRS', 1962, 90)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Toalla de Papel Tork Interfoliada Advance 200 Unidades Doble Hoja', 'toalla-de-papel-tork-interfoliada-advance-200-unidades-doble-hoja-pri15591', 'PRISA - Toalla de Papel Tork Interfoliada Advance 200 Unidades Doble Hoja', 2669, 2268.65, 6, 50, '/products/PRI15591.jpg', cat_id, true, true, 'PRI15591', 'PRISA', 'CAJA', '', '', 2065, 604)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Limpiador Multisuperficies Excell con Amonio Cuaternario 500 ml', 'limpiador-multisuperficies-excell-con-amonio-cuaternario-500-ml-pri98850', 'PRISA - Limpiador Multisuperficies Excell con Amonio Cuaternario 500 ml', 2854, 2425.9, 6, 75, '/products/PRI98850.jpg', cat_id, true, true, 'PRI98850', 'PRISA', 'UN', '', '500ML', 1316, 1538)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('LIMPIADOR MULTISUPERFICIES HIGIENIC AMONIO 500 ML', 'limpiador-multisuperficies-higienic-amonio-500-ml-dim125538', 'DIMERC - LIMPIADOR MULTISUPERFICIES HIGIENIC AMONIO 500 ML', 2854, 2425.9, 6, 28, '/products/DIM125538.jpg', cat_id, false, true, 'DIM125538', 'DIMERC', 'UN', '', '500ML', 2659, 195)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Toalla de Papel Elite 2 Rollos 200 m Doble Hoja', 'toalla-de-papel-elite-2-rollos-200-m-doble-hoja-pri78604', 'PRISA - Toalla de Papel Elite 2 Rollos 200 m Doble Hoja', 18579, 15792.15, 6, 5, NULL, cat_id, true, true, 'PRI78604', 'PRISA', 'ROLLO', '2ROLLOS', '', 14746, 3833)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Trapero Húmedo Virutex Desinfectante Limón 40x60 cm Paquete de 10', 'trapero-humedo-virutex-desinfectante-limon-40x60-cm-paquete-de-10-pri88271', 'PRISA - Trapero Húmedo Virutex Desinfectante Limón 40x60 cm Paquete de 10', 2303, 1957.55, 6, 30, '/products/PRI88271.jpg', cat_id, false, true, 'PRI88271', 'PRISA', 'PACK', '40X60', '40X60CM', 1942, 361)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Papel Higiénico Elite Classic Hoja Simple 4 Rollos 500 m', 'papel-higienico-elite-classic-hoja-simple-4-rollos-500-m-pri88803', 'PRISA - Papel Higiénico Elite Classic Hoja Simple 4 Rollos 500 m', 12399, 10539.15, 6, 5, '/products/PRI88803.jpg', cat_id, true, true, 'PRI88803', 'PRISA', 'ROLLO', '4ROLLOS', '', 9841, 2558)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bolsa de Aseo Impeke 70x90 cm 10 Unidades', 'bolsa-de-aseo-impeke-70x90-cm-10-unidades-pri12473', 'PRISA - Bolsa de Aseo Impeke 70x90 cm 10 Unidades', 401, 340.85, 6, 80, '/products/PRI12473.jpg', cat_id, false, true, 'PRI12473', 'PRISA', 'BOLSA', '70X90', '70X90CM', 551, -150)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Toallas Desinfectantes Virutex Easy Clean', 'toallas-desinfectantes-virutex-easy-clean-pri13812', 'PRISA - Toallas Desinfectantes Virutex Easy Clean', 4670, 3969.5, 6, 10, NULL, cat_id, true, true, 'PRI13812', 'PRISA', 'UN', '', '', 3736, 934)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Sabanilla Tork Advance 48 M 2 Rollos', 'sabanilla-tork-advance-48-m-2-rollos-pri78282', 'PRISA - Sabanilla Tork Advance 48 M 2 Rollos', 6976, 5929.6, 6, 6, NULL, cat_id, true, true, 'PRI78282', 'PRISA', 'ROLLO', '2ROLLOS', '', 5707, 1269)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Trapero Microfibra Te Abastece con Ojal Uni Color 50X70 cm', 'trapero-microfibra-te-abastece-con-ojal-uni-color-50x70-cm-pri42922', 'PRISA - Trapero Microfibra Te Abastece con Ojal Uni Color 50X70 cm', 1149, 976.65, 6, 30, NULL, cat_id, false, true, 'PRI42922', 'PRISA', 'UN', '50X70', '50X70CM', 1030, 119)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Amoniocuaternario EcoIndustrial 5000 PPM Para diluir', 'amoniocuaternario-ecoindustrial-5000-ppm-para-diluir-tar1100052', 'SIN MARCA - Amoniocuaternario EcoIndustrial 5000 PPM Para diluir', 1625, 1381.25, 6, 6, '/products/TAR1100052.jpg', cat_id, false, true, 'TAR1100052', 'SIN MARCA', 'UN', '', '', 4958, -3333)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Desinfectante en Aerosol Lysoform Antibacterial Cítrico', 'desinfectante-en-aerosol-lysoform-antibacterial-citrico-pri84542ci', 'PRISA - Desinfectante en Aerosol Lysoform Antibacterial Cítrico', 3844, 3267.4, 6, 10, '/products/PRI84542CI.jpg', cat_id, true, true, 'PRI84542CI', 'PRISA', 'UN', '', '', 2883, 961)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bolsa de Aseo Impeke 50x70 cm 10 Unidades', 'bolsa-de-aseo-impeke-50x70-cm-10-unidades-pri82917', 'PRISA - Bolsa de Aseo Impeke 50x70 cm 10 Unidades', 84, 71.4, 6, 80, '/products/PRI82917.jpg', cat_id, false, true, 'PRI82917', 'PRISA', 'BOLSA', '50X70', '50X70CM', 282, -198)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Limpiador de Piso Poett Frescura de Lavanda 4 l', 'limpiador-de-piso-poett-frescura-de-lavanda-4-l-pri25530lv', 'PRISA - Limpiador de Piso Poett Frescura de Lavanda 4 l', 6444, 5477.4, 6, 2, '/products/PRI25530LV.jpg', cat_id, true, true, 'PRI25530LV', 'PRISA', 'UN', '', '4L', 4706, 1738)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cartulina Española Halley 55X77 cm Amarillo', 'cartulina-espanola-halley-55x77-cm-amarillo-pri14248am', 'PRISA - Cartulina Española Halley 55X77 cm Amarillo', 255, 216.75, 6, 25, NULL, cat_id, false, true, 'PRI14248AM', 'PRISA', 'UN', '55X77', '55X77CM', 204.2, 50.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARTULINA ESPAÑOLA ROJA HALLEY 55X77', 'cartulina-espanola-roja-halley-55x77-pri14248rj', 'PRISA - CARTULINA ESPAÑOLA ROJA HALLEY 55X77', 255, 216.75, 6, 25, NULL, cat_id, false, true, 'PRI14248RJ', 'PRISA', 'UN', '55X77', '', 204.2, 50.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARTULINA ESPAÑOLA HALLEY 55X77', 'cartulina-espanola-halley-55x77-pri14248vc', 'PRISA - CARTULINA ESPAÑOLA HALLEY 55X77', 255, 216.75, 6, 25, NULL, cat_id, false, true, 'PRI14248VC', 'PRISA', 'UN', '55X77', '', 204.2, 50.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARTULINA ESPAÑOLA 50X65 CM. AZUL 180 GR. ART & CRAF', 'cartulina-espanola-50x65-cm-azul-180-gr-art-craf-pnb422358', 'FULTONS - CARTULINA ESPAÑOLA 50X65 CM. AZUL 180 GR. ART & CRAF', 20, 17.0, 6, 20, '/products/PNB422358.jpg', cat_id, false, true, 'PNB422358', 'FULTONS', 'UN', '50X65', '180GR', 249, -229)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARTULINA ESPAÑOLA 50X65 CM. MORADO 180 GR. ART & CRAF', 'cartulina-espanola-50x65-cm-morado-180-gr-art-craf-pnb422360', 'FULTONS - CARTULINA ESPAÑOLA 50X65 CM. MORADO 180 GR. ART & CRAF', 20, 17.0, 6, 20, NULL, cat_id, false, true, 'PNB422360', 'FULTONS', 'UN', '50X65', '180GR', 249, -229)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARTULINA ESPAÑOLA 50X65 CM. VERDE CLARO 180 GR. ART & CRAF', 'cartulina-espanola-50x65-cm-verde-claro-180-gr-art-craf-pnb422365', 'FULTONS - CARTULINA ESPAÑOLA 50X65 CM. VERDE CLARO 180 GR. ART & CRAF', 20, 17.0, 6, 20, '/products/PNB422365.jpg', cat_id, false, true, 'PNB422365', 'FULTONS', 'UN', '50X65', '180GR', 249, -229)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARPETA CPAPEL CART.ESPAÑOLA 25X35 CM. 10 HJS.', 'carpeta-cpapel-cartespanola-25x35-cm-10-hjs-pnb394110', 'FULTONS - CARPETA CPAPEL CART.ESPAÑOLA 25X35 CM. 10 HJS.', 1102, 936.7, 6, 3, '/products/PNB394110.jpg', cat_id, false, true, 'PNB394110', 'FULTONS', 'UN', '25X35', '25X35CM', 990, 112)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bolsa de Aseo BM 50x70 cm', 'bolsa-de-aseo-bm-50x70-cm-pri80312', 'PRISA - Bolsa de Aseo BM 50x70 cm', 36, 30.6, 6, 100, NULL, cat_id, false, true, 'PRI80312', 'PRISA', 'BOLSA', '50X70', '50X70CM', 29.3, 6.7)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('JABON LIQUIDO CREMOSO 5 LT', 'jabon-liquido-cremoso-5-lt-dimz280540', 'DIMERC - JABON LIQUIDO CREMOSO 5 LT', 1629, 1384.65, 6, 2, NULL, cat_id, false, true, 'DIMZ280540', 'DIMERC', 'UN', '', '', 1385, 244)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'limpieza' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Rollos de Acero Virutex con Jabón Mago Pads 6 Unidades', 'rollos-de-acero-virutex-con-jabon-mago-pads-6-unidades-pri83114', 'PRISA - Rollos de Acero Virutex con Jabón Mago Pads 6 Unidades', 299, 254.15, 6, 2, NULL, cat_id, false, true, 'PRI83114', 'PRISA', 'ROLLO', '', '', 256.7, 42.3)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Silla de Oficina Ejecutiva con Apoya Brazos Ajustables Color Negro', 'silla-de-oficina-ejecutiva-con-apoya-brazos-ajustables-color-negro-tstsoerme-pro-negra', 'SIN MARCA - Silla de Oficina Ejecutiva con Apoya Brazos Ajustables Color Negro', 84500, 71825.0, 6, 163, '/products/TSTSOERME-PRO-NEGRA.jpg', cat_id, true, true, 'TSTSOERME-PRO-NEGRA', 'SIN MARCA', 'UN', '', '', 58815, 25685)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Silla De Oficina Escritorio Reclinable PRO Negra', 'silla-de-oficina-escritorio-reclinable-pro-negra-ttksoerme-pro-negra', 'SIN MARCA - Silla De Oficina Escritorio Reclinable PRO Negra', 108000, 91800.0, 6, 79, '/products/TTKSOERME-PRO-NEGRA.jpg', cat_id, true, true, 'TTKSOERME-PRO-NEGRA', 'SIN MARCA', 'UN', '', '', 58815, 49185)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('AIRE ACONDIC PORTATIL 14000BTU', 'aire-acondic-portatil-14000btu-sod758976x', 'SODIMAC - AIRE ACONDIC PORTATIL 14000BTU', 485000, 412250.0, 6, 6, NULL, cat_id, true, true, 'SOD758976X', 'SODIMAC', 'UN', '', '', 403353, 81647)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('8784590-SILLON MICHELLIN2 PU NG', '8784590-sillon-michellin2-pu-ng-sod8784590', 'SODIMAC - 8784590-SILLON MICHELLIN2 PU NG', 63000, 53550.0, 6, 42, NULL, cat_id, true, true, 'SOD8784590', 'SODIMAC', 'UN', '', '', 47270, 15730)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Silla de oficina -2025-', 'silla-de-oficina-2025-fm-2025', 'SIN MARCA - Silla de oficina -2025-', 48600, 41310.0, 6, 60, NULL, cat_id, true, true, 'FM-2025', 'SIN MARCA', 'UN', '', '', 31084, 17516)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('SILLA SOERME PRO NEGRO', 'silla-soerme-pro-negro-tktksoerme-pro', 'SIN MARCA - SILLA SOERME PRO NEGRO', 75000, 63750.0, 6, 20, '/products/TKTKSOERME-PRO.jpg', cat_id, true, true, 'TKTKSOERME-PRO', 'SIN MARCA', 'UN', '', '', 58815, 16185)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Silla de oficina Plus -3027- Cromada', 'silla-de-oficina-plus-3027-cromada-fm0015555', 'SIN MARCA - Silla de oficina Plus -3027- Cromada', 122000, 103700.0, 6, 8, NULL, cat_id, true, true, 'FM0015555', 'SIN MARCA', 'UN', '', '', 100832, 21168)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('AIRE ACONDIC PORTATIL 12000BTU', 'aire-acondic-portatil-12000btu-sod7589751', 'SODIMAC - AIRE ACONDIC PORTATIL 12000BTU', 400000, 340000.0, 6, 2, NULL, cat_id, true, true, 'SOD7589751', 'SODIMAC', 'UN', '', '', 336126, 63874)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Respaldo/Cojín Lumbar SmartFit®', 'respaldocojin-lumbar-smartfit-acb27167', 'ACCO BRANDS - Respaldo/Cojín Lumbar SmartFit®', 37500, 31875.0, 6, 6, NULL, cat_id, true, true, 'ACB27167', 'ACCO BRANDS', 'UN', '', '', 31141, 6359)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PERFORADORA ESCRITORIO 25 HJS', 'perforadora-escritorio-25-hjs-tor24087', 'TORRE - PERFORADORA ESCRITORIO 25 HJS', 2902, 2466.7, 6, 55, '/products/TOR24087.jpg', cat_id, false, true, 'TOR24087', 'TORRE', 'UN', '', '', 3030, -128)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Escritorio 3 cajones 120x60x75cm', 'escritorio-3-cajones-120x60x75cm-fmbc09p0011', 'SIN MARCA - Escritorio 3 cajones 120x60x75cm', 116000, 98600.0, 6, 1, NULL, cat_id, true, true, 'FMBC09P0011', 'SIN MARCA', 'UN', '120X60', '60X75CM', 90000, 26000)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CALCULADORA ESCRITORIO 12 DIG NEGRA', 'calculadora-escritorio-12-dig-negra-pnb553262', 'FULTONS - CALCULADORA ESCRITORIO 12 DIG NEGRA', 1093, 929.05, 6, 20, '/products/PNB553262.jpg', cat_id, false, true, 'PNB553262', 'FULTONS', 'UN', '', '', 2190, -1097)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('DESTACADOR ESCRITORIO BLISTER 4COL METAL', 'destacador-escritorio-blister-4col-metal-pnb523415', 'FULTONS - DESTACADOR ESCRITORIO BLISTER 4COL METAL', 2953, 2510.05, 6, 24, NULL, cat_id, true, true, 'PNB523415', 'FULTONS', 'UN', '', '', 1790, 1163)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bandeja de Escritorio Selloffice Triple Metálica de Malla', 'bandeja-de-escritorio-selloffice-triple-metalica-de-malla-pri88425', 'SELLOFFICE - Bandeja de Escritorio Selloffice Triple Metálica de Malla', 7215, 6132.75, 6, 6, '/products/PRI88425.jpg', cat_id, true, true, 'PRI88425', 'SELLOFFICE', 'UN', '', '', 5727, 1488)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Silla De Oficina Ejecutiva Altura Ajustable Modelo MESH', 'silla-de-oficina-ejecutiva-altura-ajustable-modelo-mesh-tkkmesh1b', 'SIN MARCA - Silla De Oficina Ejecutiva Altura Ajustable Modelo MESH', 99600, 84660.0, 6, 1, NULL, cat_id, true, true, 'TKKMESH1B', 'SIN MARCA', 'UN', '', '', 27722, 71878)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bandeja de Escritorio Doble', 'bandeja-de-escritorio-doble-pri45401', 'PRISA - Bandeja de Escritorio Doble', 4203, 3572.55, 6, 4, '/products/PRI45401.jpg', cat_id, true, true, 'PRI45401', 'PRISA', 'UN', '', '', 3109, 1094)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Taco Calendario Buho Escritorio Ural 2026', 'taco-calendario-buho-escritorio-ural-2026-pri91039', 'PRISA - Taco Calendario Buho Escritorio Ural 2026', 2431, 2066.35, 6, 5, '/products/PRI91039.jpg', cat_id, true, true, 'PRI91039', 'PRISA', 'UN', '', '', 1930, 501)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Calendario Anual Buho 1992 Escritorio 2026', 'calendario-anual-buho-1992-escritorio-2026-pri91038', 'PRISA - Calendario Anual Buho 1992 Escritorio 2026', 2272, 1931.2, 6, 5, NULL, cat_id, false, true, 'PRI91038', 'PRISA', 'UN', '', '', 1804, 468)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('DESTACADOR ESCRITORIO PTA.BISEL. VERDE FULTONS', 'destacador-escritorio-ptabisel-verde-fultons-pnb101407', 'FULTONS - DESTACADOR ESCRITORIO PTA.BISEL. VERDE FULTONS', 365, 310.25, 6, 6, '/products/PNB101407.jpg', cat_id, false, true, 'PNB101407', 'FULTONS', 'UN', '', '', 269, 96)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'muebles-ergonomia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('SILLA SOERME PRO NEGRA', 'silla-soerme-pro-negra-tkssoerme-pro', 'SIN MARCA - SILLA SOERME PRO NEGRA', 0, 0, 6, 18, '/products/TKSSOERME-PRO.jpg', cat_id, false, true, 'TKSSOERME-PRO', 'SIN MARCA', 'UN', '', '', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Corchetera Isofit cm-70 Metalica P40 Hjs', 'corchetera-isofit-cm-70-metalica-p40-hjs-pri88753', 'ISOFIT - Corchetera Isofit cm-70 Metalica P40 Hjs', 8011, 6809.35, 6, 500, '/products/PRI88753.jpg', cat_id, true, true, 'PRI88753', 'ISOFIT', 'UN', '', '', 5166, 2845)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Corchetera eléctrica sin contacto Rapid Optima 60E', 'corchetera-electrica-sin-contacto-rapid-optima-60e-acb27894', 'ACCO BRANDS - Corchetera eléctrica sin contacto Rapid Optima 60E', 140000, 119000.0, 6, 11, '/products/ACB27894.jpg', cat_id, true, true, 'ACB27894', 'ACCO BRANDS', 'UN', '', '', 98314, 41686)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PIZARRA ACRILICA MAGNETICA 30X40CM TORRE', 'pizarra-acrilica-magnetica-30x40cm-torre-tor30563', 'TORRE - PIZARRA ACRILICA MAGNETICA 30X40CM TORRE', 5895, 5010.75, 6, 180, '/products/TOR30563.jpg', cat_id, false, true, 'TOR30563', 'TORRE', 'UN', '30X40', '30X40CM', 5895, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cinta Adhesiva 3M Scotch Book Tape 845', 'cinta-adhesiva-3m-scotch-book-tape-845-pri11151', 'PRISA - Cinta Adhesiva 3M Scotch Book Tape 845', 10136, 8615.6, 6, 96, '/products/PRI11151.jpg', cat_id, true, true, 'PRI11151', 'PRISA', 'UN', '', '', 8109, 2027)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CINTA ADH MASKING 24X40MT CREMA', 'cinta-adh-masking-24x40mt-crema-pnb447562', 'FULTONS - CINTA ADH MASKING 24X40MT CREMA', 702, 596.7, 6, 1000, '/products/PNB447562.jpg', cat_id, true, true, 'PNB447562', 'FULTONS', 'UN', '24X40', '', 689, 13)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tijera Torre Oficina 7.5 Ergonómica', 'tijera-torre-oficina-75-ergonomica-pri31387', 'TORRE - Tijera Torre Oficina 7.5 Ergonómica', 1129, 959.65, 6, 467, '/products/PRI31387.jpg', cat_id, false, true, 'PRI31387', 'TORRE', 'UN', '', '', 1276, -147)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CLIPS CHICO 33MM CAJA 100UNIDADES', 'clips-chico-33mm-caja-100unidades-acb27670', 'ACCO BRANDS - CLIPS CHICO 33MM CAJA 100UNIDADES', 199, 169.15, 6, 1934, NULL, cat_id, true, true, 'ACB27670', 'ACCO BRANDS', 'CAJA', '', '', 160, 39)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PERFORADORA GRANDE METAL 40HJS NEGRO LAV', 'perforadora-grande-metal-40hjs-negro-lav-pnb455930', 'FULTONS - PERFORADORA GRANDE METAL 40HJS NEGRO LAV', 7181, 6103.85, 6, 48, '/products/PNB455930.jpg', cat_id, true, true, 'PNB455930', 'FULTONS', 'UN', '', '', 5550, 1631)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PERFORADORA ISOFIT CAPACIDAD 45 HOJAS UNIDAD REGIÓN VIII', 'perforadora-isofit-capacidad-45-hojas-unidad-region-viii-pri25225', 'ISOFIT - PERFORADORA ISOFIT CAPACIDAD 45 HOJAS UNIDAD REGIÓN VIII', 7181, 6103.85, 6, 32, '/products/PRI25225.jpg', cat_id, true, true, 'PRI25225', 'ISOFIT', 'UN', '', '', 5061, 2120)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Clip Isofit Metálico Punta Redonda 78 mm Caja de 50 Unidades', 'clip-isofit-metalico-punta-redonda-78-mm-caja-de-50-unidades-pri83558', 'ISOFIT - Clip Isofit Metálico Punta Redonda 78 mm Caja de 50 Unidades', 1661, 1411.85, 6, 100, '/products/PRI83558.jpg', cat_id, false, true, 'PRI83558', 'ISOFIT', 'CAJA', '', '', 1487, 174)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CINTA EMBALAJE 48X50MT TRANSP. PLUS SELLOCINTA', 'cinta-embalaje-48x50mt-transp-plus-sellocinta-pri89987', 'PRISA - CINTA EMBALAJE 48X50MT TRANSP. PLUS SELLOCINTA', 657, 558.45, 6, 300, '/products/PRI89987.jpg', cat_id, false, true, 'PRI89987', 'PRISA', 'UN', '48X50', '', 487, 170)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TIJERA  PARA ZURDOS 5 TORRE', 'tijera-para-zurdos-5-torre-tor24272', 'TORRE - TIJERA  PARA ZURDOS 5 TORRE', 867, 736.95, 6, 180, '/products/TOR24272.jpg', cat_id, false, true, 'TOR24272', 'TORRE', 'UN', '', '', 715, 152)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CORCHETERA ISOFIT METALICA ALICATE CM-80', 'corchetera-isofit-metalica-alicate-cm-80-lib15152-1', 'ISOFIT - CORCHETERA ISOFIT METALICA ALICATE CM-80', 2039, 1733.15, 6, 30, '/products/LIB15152-1.jpg', cat_id, false, true, 'LIB15152-1', 'ISOFIT', 'UN', '', '', 4135, -2096)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Perforador modelo MP-3131 2 hoyos cap 40hjs', 'perforador-modelo-mp-3131-2-hoyos-cap-40hjs-acb21850', 'ACCO BRANDS - Perforador modelo MP-3131 2 hoyos cap 40hjs', 6369, 5413.65, 6, 24, '/products/ACB21850.jpg', cat_id, true, true, 'ACB21850', 'ACCO BRANDS', 'UN', '', '', 4900, 1469)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CINTA MAQUINA SUMADORA KC-ELCA A TWIN NYLON NEGRO/ROJO', 'cinta-maquina-sumadora-kc-elca-a-twin-nylon-negrorojo-dime360204', 'DIMERC - CINTA MAQUINA SUMADORA KC-ELCA A TWIN NYLON NEGRO/ROJO', 2000, 1700.0, 6, 50, '/products/DIME360204.jpg', cat_id, false, true, 'DIME360204', 'DIMERC', 'UN', '', '', 1636, 364)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('REGLA FULTONS METÁLICA ROTULADA 30 CM', 'regla-fultons-metalica-rotulada-30-cm-pnb367085', 'FULTONS - REGLA FULTONS METÁLICA ROTULADA 30 CM', 734, 623.9, 6, 108, '/products/PNB367085.jpg', cat_id, false, true, 'PNB367085', 'FULTONS', 'UN', '', '', 690, 44)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CORCHETES RAPID 23/12 /PATA DE 12MM DE LARGO / ALAMBRE SUPER REFORZADO GALVANIZADO / PATAS CON BORDE', 'corchetes-rapid-2312-pata-de-12mm-de-largo-alambre-super-reforzado-galvanizado-p-acb24869400', 'ACCO BRANDS - CORCHETES RAPID 23/12 /PATA DE 12MM DE LARGO / ALAMBRE SUPER REFORZADO GALVANIZADO / PATAS CON BORDE', 1298, 1103.3, 6, 10, '/products/ACB24869400.jpg', cat_id, false, true, 'ACB24869400', 'ACCO BRANDS', 'UN', '', '', 6705, -5407)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Corrector en Cinta Adix Roller', 'corrector-en-cinta-adix-roller-pri10647', 'PRISA - Corrector en Cinta Adix Roller', 1351, 1148.35, 6, 110, '/products/PRI10647.jpg', cat_id, true, true, 'PRI10647', 'PRISA', 'UN', '', '', 604, 747)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Dispensador Cinta Adhesiva 3M Scotch C-3', 'dispensador-cinta-adhesiva-3m-scotch-c-3-pri99298', 'PRISA - Dispensador Cinta Adhesiva 3M Scotch C-3', 5400, 4590.0, 6, 15, '/products/PRI99298.jpg', cat_id, true, true, 'PRI99298', 'PRISA', 'UN', '', '', 4321, 1079)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cinta Adhesiva Isotape Cristal 18 mm x 25 m', 'cinta-adhesiva-isotape-cristal-18-mm-x-25-m-pri85210', 'PRISA - Cinta Adhesiva Isotape Cristal 18 mm x 25 m', 3348, 2845.8, 6, 23, '/products/PRI85210.jpg', cat_id, true, true, 'PRI85210', 'PRISA', 'UN', '', '', 2784, 564)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Pistola de Silicona Proarte 12 Mm 25 W', 'pistola-de-silicona-proarte-12-mm-25-w-pri44412', 'PRISA - Pistola de Silicona Proarte 12 Mm 25 W', 4409, 3747.65, 6, 15, '/products/PRI44412.jpg', cat_id, false, true, 'PRI44412', 'PRISA', 'UN', '', '', 3955, 454)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CINTA EMBALAJE 48 MM X 50 MT TRANSPARENTE', 'cinta-embalaje-48-mm-x-50-mt-transparente-dim488987', 'DIMERC - CINTA EMBALAJE 48 MM X 50 MT TRANSPARENTE', 680, 578.0, 6, 100, '/products/DIM488987.jpg', cat_id, false, true, 'DIM488987', 'DIMERC', 'UN', '', '', 588, 92)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TIJERA ESCOLAR 5 COLÓN (BAG)', 'tijera-escolar-5-colon-bag-tor31293', 'TORRE - TIJERA ESCOLAR 5 COLÓN (BAG)', 769, 653.65, 6, 192, '/products/TOR31293.jpg', cat_id, true, true, 'TOR31293', 'TORRE', 'UN', '', '', 261, 508)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('SacaCorchete para Uso pesado', 'sacacorchete-para-uso-pesado-acb15189', 'ACCO BRANDS - SacaCorchete para Uso pesado', 6067, 5156.95, 6, 9, NULL, cat_id, true, true, 'ACB15189', 'ACCO BRANDS', 'UN', '', '', 5157, 910)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CLIP TORRE METÁLICO PUNTA REDONDA 33 MM ACERO CROMADO 100 UNIDADES', 'clip-torre-metalico-punta-redonda-33-mm-acero-cromado-100-unidades-pri10835', 'TORRE - CLIP TORRE METÁLICO PUNTA REDONDA 33 MM ACERO CROMADO 100 UNIDADES', 199, 169.15, 6, 178, '/products/PRI10835.jpg', cat_id, false, true, 'PRI10835', 'TORRE', 'CAJA', '', '', 250, -51)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Accoclip Auca Plástico Colores 50 Unidades', 'accoclip-auca-plastico-colores-50-unidades-pri36545', 'PRISA - Accoclip Auca Plástico Colores 50 Unidades', 995, 845.75, 6, 42, '/products/PRI36545.jpg', cat_id, false, true, 'PRI36545', 'PRISA', 'CAJA', '', '', 970, 25)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Corchetes Stanley Tra704T 14 Caja de 1000 Unidades', 'corchetes-stanley-tra704t-14-caja-de-1000-unidades-pri85493', 'PRISA - Corchetes Stanley Tra704T 14 Caja de 1000 Unidades', 5222, 4438.7, 6, 9, '/products/PRI85493.jpg', cat_id, true, true, 'PRI85493', 'PRISA', 'CAJA', '', '', 4439, 783)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CLIPS MAGICOS ADIX METALICOS 4.8 MM CAJA DE 50 UNIDADES', 'clips-magicos-adix-metalicos-48-mm-caja-de-50-unidades-pri82768', 'PRISA - CLIPS MAGICOS ADIX METALICOS 4.8 MM CAJA DE 50 UNIDADES', 1479, 1257.15, 6, 30, NULL, cat_id, false, true, 'PRI82768', 'PRISA', 'CAJA', '', '', 1257, 222)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('DOBLE CLIP 32MM 12 UNIDADES', 'doble-clip-32mm-12-unidades-acb676', 'ACCO BRANDS - DOBLE CLIP 32MM 12 UNIDADES', 511, 434.35, 6, 56, '/products/ACB676.jpg', cat_id, false, true, 'ACB676', 'ACCO BRANDS', 'CAJA', '', '', 511, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Caja Accoclips Metálicos  (50 Unidades)', 'caja-accoclips-metalicos-50-unidades-pnb349771', 'FULTONS - Caja Accoclips Metálicos  (50 Unidades)', 1737, 1476.45, 6, 30, '/products/PNB349771.jpg', cat_id, true, true, 'PNB349771', 'FULTONS', 'CAJA', '', '', 890, 847)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cinta Adhesiva Tesa 18 mm x 20 m Cinta Adhesiva Tesa 18 mm x 20 m', 'cinta-adhesiva-tesa-18-mm-x-20-m-cinta-adhesiva-tesa-18-mm-x-20-m-pri17813', 'PRISA - Cinta Adhesiva Tesa 18 mm x 20 m Cinta Adhesiva Tesa 18 mm x 20 m', 618, 525.3, 6, 100, '/products/PRI17813.jpg', cat_id, false, true, 'PRI17813', 'PRISA', 'UN', '', '', 226, 392)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TIJERA OFICINA 21CM MANGO SOFT (24-144)', 'tijera-oficina-21cm-mango-soft-24-144-jmitijehol004', 'BEIFA - TIJERA OFICINA 21CM MANGO SOFT (24-144)', 1129, 959.65, 6, 30, '/products/JMITIJEHOL004.jpg', cat_id, false, true, 'JMITIJEHOL004', 'BEIFA', 'UN', '', '', 746, 383)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('REPUESTO MAGIC CLIP 6.4MM (24-288)', 'repuesto-magic-clip-64mm-24-288-jmiclipbei007', 'BEIFA - REPUESTO MAGIC CLIP 6.4MM (24-288)', 1224, 1040.4, 6, 30, '/products/JMICLIPBEI007.jpg', cat_id, false, true, 'JMICLIPBEI007', 'BEIFA', 'UN', '', '', 743, 481)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Corchete Optima 70 High Capacity / Medida 3/8/ Contiene 2.500 piezas', 'corchete-optima-70-high-capacity-medida-38-contiene-2500-piezas-acb15315', 'ACCO BRANDS - Corchete Optima 70 High Capacity / Medida 3/8/ Contiene 2.500 piezas', 3346, 2844.1, 6, 10, '/products/ACB15315.jpg', cat_id, true, true, 'ACB15315', 'ACCO BRANDS', 'UN', '', '', 2099, 1247)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('REGLA METALICA 60 CM', 'regla-metalica-60-cm-jmireglhai003', 'BEIFA - REGLA METALICA 60 CM', 3191, 2712.35, 6, 9, '/products/JMIREGLHAI003.jpg', cat_id, true, true, 'JMIREGLHAI003', 'BEIFA', 'UN', '', '', 2204, 987)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CORCHETES RAPID 23/17 Corchetea de 110 a 140 hojas / Caja 1000 unidades /', 'corchetes-rapid-2317-corchetea-de-110-a-140-hojas-caja-1000-unidades-acb27820', 'ACCO BRANDS - CORCHETES RAPID 23/17 Corchetea de 110 a 140 hojas / Caja 1000 unidades /', 4151, 3528.35, 6, 15, '/products/ACB27820.jpg', cat_id, true, true, 'ACB27820', 'ACCO BRANDS', 'CAJA', '', '', 1322, 2829)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('DISPENSADOR DE CLIP ADIX MAGIC CLIPPER 4A6MM', 'dispensador-de-clip-adix-magic-clipper-4a6mm-pri99306', 'PRISA - DISPENSADOR DE CLIP ADIX MAGIC CLIPPER 4A6MM', 1460, 1241.0, 6, 15, '/products/PRI99306.jpg', cat_id, false, true, 'PRI99306', 'PRISA', 'UN', '', '', 1241, 219)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CORCHETERA METAL LARGA NEGRA', 'corchetera-metal-larga-negra-jmicorchai007', 'BEIFA - CORCHETERA METAL LARGA NEGRA', 9013, 7661.05, 6, 10, '/products/JMICORCHAI007.jpg', cat_id, true, true, 'JMICORCHAI007', 'BEIFA', 'UN', '', '', 1838, 7175)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CORCHETE SEMI INDUSTRIAL 23/12 1000 UN', 'corchete-semi-industrial-2312-1000-un-dim507704', 'DIMERC - CORCHETE SEMI INDUSTRIAL 23/12 1000 UN', 3000, 2550.0, 6, 34, '/products/DIM507704.jpg', cat_id, true, true, 'DIM507704', 'DIMERC', 'CAJA', '', '', 521, 2479)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Clip Metálico Pedin 50 Mm Punta Redonda Liso Caja de 50 Unidades', 'clip-metalico-pedin-50-mm-punta-redonda-liso-caja-de-50-unidades-pri82773', 'PRISA - Clip Metálico Pedin 50 Mm Punta Redonda Liso Caja de 50 Unidades', 736, 625.6, 6, 25, '/products/PRI82773.jpg', cat_id, false, true, 'PRI82773', 'PRISA', 'CAJA', '', '', 598, 138)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('REGLA METÁLICA DE 60 CM. (10-200)', 'regla-metalica-de-60-cm-10-200-jmireglbei006', 'BEIFA - REGLA METÁLICA DE 60 CM. (10-200)', 1863, 1583.55, 6, 10, '/products/JMIREGLBEI006.jpg', cat_id, false, true, 'JMIREGLBEI006', 'BEIFA', 'UN', '', '', 1463, 400)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cinta Masking Offione 24 mm x 40 m', 'cinta-masking-offione-24-mm-x-40-m-pri75172', 'PRISA - Cinta Masking Offione 24 mm x 40 m', 702, 596.7, 6, 21, '/products/PRI75172.jpg', cat_id, false, true, 'PRI75172', 'PRISA', 'UN', '', '', 689, 13)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cinta Embalaje Sellocinta Max Transparente 48 mm x 50 m', 'cinta-embalaje-sellocinta-max-transparente-48-mm-x-50-m-pri85531', 'PRISA - Cinta Embalaje Sellocinta Max Transparente 48 mm x 50 m', 436, 370.6, 6, 30, '/products/PRI85531.jpg', cat_id, false, true, 'PRI85531', 'PRISA', 'UN', '', '', 450, -14)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('SACACORCHETE PALANCA METALICO FULTONS', 'sacacorchete-palanca-metalico-fultons-pnb370423', 'FULTONS - SACACORCHETE PALANCA METALICO FULTONS', 576, 489.6, 6, 54, '/products/PNB370423.jpg', cat_id, false, true, 'PNB370423', 'FULTONS', 'UN', '', '', 249, 327)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CLIPS ISOFIT METAL 50 MM DE 100 UNIDADES', 'clips-isofit-metal-50-mm-de-100-unidades-lib11304-2', 'ISOFIT - CLIPS ISOFIT METAL 50 MM DE 100 UNIDADES', 782, 664.7, 6, 20, NULL, cat_id, false, true, 'LIB11304-2', 'ISOFIT', 'CAJA', '', '', 580, 202)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Pistola de Silicona Proarte 7 mm 10 W', 'pistola-de-silicona-proarte-7-mm-10-w-pri11090', 'PRISA - Pistola de Silicona Proarte 7 mm 10 W', 3850, 3272.5, 6, 4, '/products/PRI11090.jpg', cat_id, true, true, 'PRI11090', 'PRISA', 'UN', '', '', 2849, 1001)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cinta Adhesiva Torre Doble Contacto 18 mm x 50 m', 'cinta-adhesiva-torre-doble-contacto-18-mm-x-50-m-pri45899', 'TORRE - Cinta Adhesiva Torre Doble Contacto 18 mm x 50 m', 1466, 1246.1, 6, 10, '/products/PRI45899.jpg', cat_id, false, true, 'PRI45899', 'TORRE', 'UN', '', '', 1054, 412)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Regla Geopen Metálica 60 cm', 'regla-geopen-metalica-60-cm-pri80441', 'PRISA - Regla Geopen Metálica 60 cm', 3191, 2712.35, 6, 6, '/products/PRI80441.jpg', cat_id, true, true, 'PRI80441', 'PRISA', 'UN', '', '', 1707, 1484)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tijera para Zurdos Multiuso Mundial N 661 Largo 8.5', 'tijera-para-zurdos-multiuso-mundial-n-661-largo-85-pri87704', 'PRISA - Tijera para Zurdos Multiuso Mundial N 661 Largo 8.5', 4789, 4070.65, 6, 2, '/products/PRI87704.jpg', cat_id, false, true, 'PRI87704', 'PRISA', 'UN', '', '', 4310, 479)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CLIPS TORRE 1 PUNTA TRIANGULAR 33 MM', 'clips-torre-1-punta-triangular-33-mm-tor11714', 'TORRE - CLIPS TORRE 1 PUNTA TRIANGULAR 33 MM', 287, 243.95, 6, 30, '/products/TOR11714.jpg', cat_id, false, true, 'TOR11714', 'TORRE', 'UN', '', '', 280, 7)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('HILO ELÁSTICO SILICONA  0.6MM  100 MTRS', 'hilo-elastico-silicona-06mm-100-mtrs-taehw268-1', 'SIN MARCA - HILO ELÁSTICO SILICONA  0.6MM  100 MTRS', 1893, 1609.05, 6, 5, '/products/TAEHW268-1.jpg', cat_id, false, true, 'TAEHW268-1', 'SIN MARCA', 'UN', '', '', 1606.7, 286.3)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('REPUESTO P/MAGIC CLIP 1201 13 MM METALICO 50 UN. CROMADO FULTONS', 'repuesto-pmagic-clip-1201-13-mm-metalico-50-un-cromado-fultons-pnb102361', 'FULTONS - REPUESTO P/MAGIC CLIP 1201 13 MM METALICO 50 UN. CROMADO FULTONS', 1478, 1256.3, 6, 8, '/products/PNB102361.jpg', cat_id, false, true, 'PNB102361', 'FULTONS', 'CAJA', '', '', 990, 488)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cinta de Embalaje Offione 48 X 100 M', 'cinta-de-embalaje-offione-48-x-100-m-pri74409', 'PRISA - Cinta de Embalaje Offione 48 X 100 M', 737, 626.45, 6, 10, '/products/PRI74409.jpg', cat_id, false, true, 'PRI74409', 'PRISA', 'UN', '48X100', '', 788, -51)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tijera Torini 6.0 Mango Plástico 15.24 cm', 'tijera-torini-60-mango-plastico-1524-cm-pri29281', 'PRISA - Tijera Torini 6.0 Mango Plástico 15.24 cm', 699, 594.15, 6, 16, '/products/PRI29281.jpg', cat_id, false, true, 'PRI29281', 'PRISA', 'UN', '', '', 484, 215)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PEGAMENTO EN BARRA 21 GRS', 'pegamento-en-barra-21-grs-pnb517772', 'FULTONS - PEGAMENTO EN BARRA 21 GRS', 411, 349.35, 6, 24, '/products/PNB517772.jpg', cat_id, false, true, 'PNB517772', 'FULTONS', 'UN', '', '21GRS', 299, 112)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CLIPS MAGICOS 50 UN. ADIX METALICOS 6.4MM', 'clips-magicos-50-un-adix-metalicos-64mm-pri78352', 'PRISA - CLIPS MAGICOS 50 UN. ADIX METALICOS 6.4MM', 1680, 1428.0, 6, 5, NULL, cat_id, false, true, 'PRI78352', 'PRISA', 'CAJA', '', '', 1344, 336)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tijera Isofit 7', 'tijera-isofit-7-pri10914', 'ISOFIT - Tijera Isofit 7', 1032, 877.2, 6, 9, '/products/PRI10914.jpg', cat_id, false, true, 'PRI10914', 'ISOFIT', 'UN', '', '', 728, 304)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CINTA MASKING TAPE', 'cinta-masking-tape-aditee3000133', 'SELLOFFICE - CINTA MASKING TAPE', 1580, 1343.0, 6, 5, '/products/ADITEE3000133.jpg', cat_id, false, true, 'ADITEE3000133', 'SELLOFFICE', 'UN', '', '', 1160.8, 419.2)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PORTA CLIPS MAGNÉTICO DOBLE TRACOL SURT', 'porta-clips-magnetico-doble-tracol-surt-pnb542749', 'FULTONS - PORTA CLIPS MAGNÉTICO DOBLE TRACOL SURT', 1081, 918.85, 6, 6, '/products/PNB542749.jpg', cat_id, false, true, 'PNB542749', 'FULTONS', 'UN', '', '', 919, 162)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PERFORADORA 20 HOJAS METÁLICA', 'perforadora-20-hojas-metalica-pri29264', 'PRISA - PERFORADORA 20 HOJAS METÁLICA', 1989, 1690.65, 6, 3, '/products/PRI29264.jpg', cat_id, false, true, 'PRI29264', 'PRISA', 'UN', '', '', 1728, 261)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CINTA DOBLE CONTACTO 25 MM X 50 MT', 'cinta-doble-contacto-25-mm-x-50-mt-dim554893', 'DIMERC - CINTA DOBLE CONTACTO 25 MM X 50 MT', 3073, 2612.05, 6, 2, '/products/DIM554893.jpg', cat_id, true, true, 'DIM554893', 'DIMERC', 'UN', '', '', 2529, 544)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cinta Embalaje Ofixpres Transparente 48 mm x 40 m', 'cinta-embalaje-ofixpres-transparente-48-mm-x-40-m-pri45412', 'PRISA - Cinta Embalaje Ofixpres Transparente 48 mm x 40 m', 259, 220.15, 6, 24, '/products/PRI45412.jpg', cat_id, false, true, 'PRI45412', 'PRISA', 'UN', '', '', 207, 52)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Doble Clips Acco 51 mm Caja de 12 Unidades', 'doble-clips-acco-51-mm-caja-de-12-unidades-pri25338', 'PRISA - Doble Clips Acco 51 mm Caja de 12 Unidades', 214, 181.9, 6, 33, '/products/PRI25338.jpg', cat_id, false, true, 'PRI25338', 'PRISA', 'CAJA', '', '', 145.8, 68.2)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CORCHETERA DS-45 METALICA, NEGRO,30HJS, KANGARO', 'corchetera-ds-45-metalica-negro30hjs-kangaro-adiacrt120002', 'SELLOFFICE - CORCHETERA DS-45 METALICA, NEGRO,30HJS, KANGARO', 3216, 2733.6, 6, 2, '/products/ADIACRT120002.jpg', cat_id, true, true, 'ADIACRT120002', 'SELLOFFICE', 'UN', '', '', 2297, 919)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('REGLA PLASTICA TRANSP.30 CM. BISELADA (50-250-500)', 'regla-plastica-transp30-cm-biselada-50-250-500-jmireglbei004', 'BEIFA - REGLA PLASTICA TRANSP.30 CM. BISELADA (50-250-500)', 213, 181.05, 6, 35, '/products/JMIREGLBEI004.jpg', cat_id, false, true, 'JMIREGLBEI004', 'BEIFA', 'UN', '', '', 131, 82)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CINTA EMBALAJE 48 X 30 MT TRANSP. SELLOCINTA', 'cinta-embalaje-48-x-30-mt-transp-sellocinta-pri89055', 'PRISA - CINTA EMBALAJE 48 X 30 MT TRANSP. SELLOCINTA', 733, 623.05, 6, 20, '/products/PRI89055.jpg', cat_id, true, true, 'PRI89055', 'PRISA', 'UN', '48X30', '', 220, 513)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TIJERA ESCOLAR PARA ZURDOS 13 CM', 'tijera-escolar-para-zurdos-13-cm-dim534332', 'DIMERC - TIJERA ESCOLAR PARA ZURDOS 13 CM', 838, 712.3, 6, 6, '/products/DIM534332.jpg', cat_id, false, true, 'DIM534332', 'DIMERC', 'UN', '', '', 725, 113)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PERFORADORA GRANDE METAL P30 HJ NEGRO', 'perforadora-grande-metal-p30-hj-negro-pnb542570', 'FULTONS - PERFORADORA GRANDE METAL P30 HJ NEGRO', 3405, 2894.25, 6, 1, '/products/PNB542570.jpg', cat_id, false, true, 'PNB542570', 'FULTONS', 'UN', '', '', 3990, -585)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CLIPS TORRE 1 PUNTA REDONDA 33 MM 100 UNIDADES', 'clips-torre-1-punta-redonda-33-mm-100-unidades-tor11716', 'TORRE - CLIPS TORRE 1 PUNTA REDONDA 33 MM 100 UNIDADES', 271, 230.35, 6, 17, '/products/TOR11716.jpg', cat_id, false, true, 'TOR11716', 'TORRE', 'CAJA', '', '', 223, 48)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Corchetes Swingline Sf-13 1/2 Caja de 1000 Unidades', 'corchetes-swingline-sf-13-12-caja-de-1000-unidades-pri83471', 'PRISA - Corchetes Swingline Sf-13 1/2 Caja de 1000 Unidades', 764, 649.4, 6, 2, '/products/PRI83471.jpg', cat_id, false, true, 'PRI83471', 'PRISA', 'CAJA', '', '', 1882, -1118)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TIJERA DE OFICINA MANGO SOFT 19 CM (12-144)', 'tijera-de-oficina-mango-soft-19-cm-12-144-jmitijehol005', 'BEIFA - TIJERA DE OFICINA MANGO SOFT 19 CM (12-144)', 769, 653.65, 6, 5, '/products/JMITIJEHOL005.jpg', cat_id, false, true, 'JMITIJEHOL005', 'BEIFA', 'UN', '', '', 743, 26)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cinta de Transferencia Térmica, Negra, 110mm x 74m, Cera, OUT C1/2', 'cinta-de-transferencia-termica-negra-110mm-x-74m-cera-out-c12-aditcc0500125', 'SELLOFFICE - Cinta de Transferencia Térmica, Negra, 110mm x 74m, Cera, OUT C1/2', 1253, 1065.05, 6, 4, NULL, cat_id, false, true, 'ADITCC0500125', 'SELLOFFICE', 'UN', '', '', 902, 351)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CORCHETE 26/6-1000 UNID. 11120005 (10-500)', 'corchete-266-1000-unid-11120005-10-500-jmicorchol003', 'BEIFA - CORCHETE 26/6-1000 UNID. 11120005 (10-500)', 179, 152.15, 6, 24, NULL, cat_id, false, true, 'JMICORCHOL003', 'BEIFA', 'UN', '', '', 146, 33)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('GORRO DESECHABLE TIPO CLIP 100 UNI BLANCO BOLSA', 'gorro-desechable-tipo-clip-100-uni-blanco-bolsa-pri19659', 'PRISA - GORRO DESECHABLE TIPO CLIP 100 UNI BLANCO BOLSA', 2089, 1775.65, 6, 2, NULL, cat_id, false, true, 'PRI19659', 'PRISA', 'BOLSA', '', '', 1732, 357)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Clip Metálico Torini 50 mm 100 Unidades', 'clip-metalico-torini-50-mm-100-unidades-pri29255', 'PRISA - Clip Metálico Torini 50 mm 100 Unidades', 1112, 945.2, 6, 5, '/products/PRI29255.jpg', cat_id, false, true, 'PRI29255', 'PRISA', 'CAJA', '', '', 651, 461)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CORCHETES ESTANDAR 26/6 1000 UN. CROMADO FULTONS', 'corchetes-estandar-266-1000-un-cromado-fultons-pnb107212', 'FULTONS - CORCHETES ESTANDAR 26/6 1000 UN. CROMADO FULTONS', 179, 152.15, 6, 20, '/products/PNB107212.jpg', cat_id, false, true, 'PNB107212', 'FULTONS', 'CAJA', '', '', 149, 30)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Doble Clip Adix 15 mm Caja de 12 Unidades Doble Clip Adix 15 mm Caja de 12 Unidades', 'doble-clip-adix-15-mm-caja-de-12-unidades-doble-clip-adix-15-mm-caja-de-12-unida-pri25328', 'PRISA - Doble Clip Adix 15 mm Caja de 12 Unidades Doble Clip Adix 15 mm Caja de 12 Unidades', 227, 192.95, 6, 11, '/products/PRI25328.jpg', cat_id, false, true, 'PRI25328', 'PRISA', 'CAJA', '', '', 261, -34)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PORTA CLIPS MAGNÉTICO DOBLE NEGRO Y TRANSP', 'porta-clips-magnetico-doble-negro-y-transp-pnb542748', 'FULTONS - PORTA CLIPS MAGNÉTICO DOBLE NEGRO Y TRANSP', 1081, 918.85, 6, 2, '/products/PNB542748.jpg', cat_id, false, true, 'PNB542748', 'FULTONS', 'UN', '', '', 919, 162)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cinta Adhesiva 3M Doble Contacto 9945 18 Mm x 40 M', 'cinta-adhesiva-3m-doble-contacto-9945-18-mm-x-40-m-pri77350', 'PRISA - Cinta Adhesiva 3M Doble Contacto 9945 18 Mm x 40 M', 2109, 1792.65, 6, 1, '/products/PRI77350.jpg', cat_id, false, true, 'PRI77350', 'PRISA', 'UN', '', '', 1793, 316)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('ADHESIVO SILICONA LIQUIDA 30 CC', 'adhesivo-silicona-liquida-30-cc-pnb287542', 'FULTONS - ADHESIVO SILICONA LIQUIDA 30 CC', 530, 450.5, 6, 6, '/products/PNB287542.jpg', cat_id, false, true, 'PNB287542', 'FULTONS', 'UN', '', '30CC', 259, 271)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Dispensador 898-M, Mediano, Para cintas de 12 y 34, SELLOFICC', 'dispensador-898-m-mediano-para-cintas-de-12-y-34-selloficc-adiadic102002', 'SELLOFFICE - Dispensador 898-M, Mediano, Para cintas de 12 y 34, SELLOFICC', 2450, 2082.5, 6, 1, NULL, cat_id, true, true, 'ADIADIC102002', 'SELLOFFICE', 'UN', '', '', 1419, 1031)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CINTA DE ENMASCARAR SELLOCINTA MASKING GP, 24MM X 40M', 'cinta-de-enmascarar-sellocinta-masking-gp-24mm-x-40m-jmicinthon042', 'BEIFA - CINTA DE ENMASCARAR SELLOCINTA MASKING GP, 24MM X 40M', 1121, 952.85, 6, 2, '/products/JMICINTHON042.jpg', cat_id, false, true, 'JMICINTHON042', 'BEIFA', 'UN', '', '', 700, 421)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('USATAPE, 48MM X 40M, TRANSP. ARO SELLOCINTA', 'usatape-48mm-x-40m-transp-aro-sellocinta-aditee1500165', 'SELLOFFICE - USATAPE, 48MM X 40M, TRANSP. ARO SELLOCINTA', 328, 278.8, 6, 5, NULL, cat_id, false, true, 'ADITEE1500165', 'SELLOFFICE', 'UN', '', '', 276.4, 51.6)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CINTA DOBLE CONTACTO 18X13,7MT BLANCO', 'cinta-doble-contacto-18x137mt-blanco-pnb401445', 'FULTONS - CINTA DOBLE CONTACTO 18X13,7MT BLANCO', 591, 502.35, 6, 3, '/products/PNB401445.jpg', cat_id, false, true, 'PNB401445', 'FULTONS', 'UN', '18X13', '', 459, 132)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cinta Adhesiva 3M Doble Contacto 9945 12 mm X 40 M', 'cinta-adhesiva-3m-doble-contacto-9945-12-mm-x-40-m-pri75843', 'PRISA - Cinta Adhesiva 3M Doble Contacto 9945 12 mm X 40 M', 1484, 1261.4, 6, 1, '/products/PRI75843.jpg', cat_id, false, true, 'PRI75843', 'PRISA', 'UN', '', '', 1261, 223)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CAJA CORCHETES N 266, 5000 UNIDADES, SELLOFFICE', 'caja-corchetes-n-266-5000-unidades-selloffice-adiactt100001', 'SELLOFFICE - CAJA CORCHETES N 266, 5000 UNIDADES, SELLOFFICE', 176, 149.6, 6, 7, NULL, cat_id, false, true, 'ADIACTT100001', 'SELLOFFICE', 'CAJA', '', '', 142.8, 33.2)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CAJAS DE CLIPS 28 MM., 100 UNIDADES, SELLOFFICE', 'cajas-de-clips-28-mm-100-unidades-selloffice-adiaclp100001', 'SELLOFFICE - CAJAS DE CLIPS 28 MM., 100 UNIDADES, SELLOFFICE', 271, 230.35, 6, 5, NULL, cat_id, false, true, 'ADIACLP100001', 'SELLOFFICE', 'CAJA', '', '', 195, 76)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CINTA CORRECTORA MINI COLORES TORRE', 'cinta-correctora-mini-colores-torre-tor30533', 'TORRE - CINTA CORRECTORA MINI COLORES TORRE', 995, 845.75, 6, 1, '/products/TOR30533.jpg', cat_id, false, true, 'TOR30533', 'TORRE', 'UN', '', '', 525, 470)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CLIPS TORRE 1 PUNTA REDONDA 33 MM 100 UNIDADES', 'clips-torre-1-punta-redonda-33-mm-100-unidades-adiaclp100002', 'TORRE - CLIPS TORRE 1 PUNTA REDONDA 33 MM 100 UNIDADES', 234, 198.9, 6, 2, '/products/ADIACLP100002.jpg', cat_id, false, true, 'ADIACLP100002', 'TORRE', 'CAJA', '', '', 244, -10)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CINTA ADHESIVA ECONOMICA 18MMX30MT FULTONS', 'cinta-adhesiva-economica-18mmx30mt-fultons-pnb407606', 'FULTONS - CINTA ADHESIVA ECONOMICA 18MMX30MT FULTONS', 307, 260.95, 6, 3, '/products/PNB407606.jpg', cat_id, false, true, 'PNB407606', 'FULTONS', 'UN', '', '', 149, 158)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CLIP 50 MM REDONDO CAJA 50 UNIDADES', 'clip-50-mm-redondo-caja-50-unidades-pnb107127', 'FULTONS - CLIP 50 MM REDONDO CAJA 50 UNIDADES', 12, 10.2, 6, 10, '/products/PNB107127.jpg', cat_id, false, true, 'PNB107127', 'FULTONS', 'CAJA', '', '', 7.2, 4.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CORCHETES 53 A6 DE 1800 NOVUS', 'corchetes-53-a6-de-1800-novus-pri83854', 'PRISA - CORCHETES 53 A6 DE 1800 NOVUS', 0, 0, 6, 3602, NULL, cat_id, true, true, 'PRI83854', 'PRISA', 'UN', '', '', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PEGAMENTO EN BARRA 36GRS, MONAMI', 'pegamento-en-barra-36grs-monami-adizdi1200274', 'MONAMI - PEGAMENTO EN BARRA 36GRS, MONAMI', 671, 570.35, 6, 3, '/products/ADIZDI1200274.jpg', cat_id, false, true, 'ADIZDI1200274', 'MONAMI', 'UN', '', '36GRS', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CORCHETE 2310 1000 UNIDADES', 'corchete-2310-1000-unidades-jmicorcbei002', 'BEIFA - CORCHETE 2310 1000 UNIDADES', 1432, 1217.2, 6, 1, NULL, cat_id, false, true, 'JMICORCBEI002', 'BEIFA', 'CAJA', '', '', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CORCHETE 23/13 1000 UNID.(10-300)', 'corchete-2313-1000-unid10-300-jmicorcbei003', 'BEIFA - CORCHETE 23/13 1000 UNID.(10-300)', 1540, 1309.0, 6, 2, NULL, cat_id, false, true, 'JMICORCBEI003', 'BEIFA', 'UN', '', '', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PISTOLA DE SILICONA PROARTE 12MM', 'pistola-de-silicona-proarte-12mm-lib31003-4', 'SIN MARCA - PISTOLA DE SILICONA PROARTE 12MM', 4716, 4008.6, 6, 6, '/products/LIB31003-4.jpg', cat_id, false, true, 'LIB31003-4', 'SIN MARCA', 'UN', '', '', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('DOBLE CLIP NEGRO 25 MM. METALICO 12 UN. FULTONS', 'doble-clip-negro-25-mm-metalico-12-un-fultons-pnb101096', 'FULTONS - DOBLE CLIP NEGRO 25 MM. METALICO 12 UN. FULTONS', 416, 353.6, 6, 59, NULL, cat_id, false, true, 'PNB101096', 'FULTONS', 'CAJA', '', '', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('SILICONA LIQ ARTEL 250 ML', 'silicona-liq-artel-250-ml-tor25491', 'ARTEL - SILICONA LIQ ARTEL 250 ML', 2089, 1775.65, 6, 8, '/products/TOR25491.jpg', cat_id, false, true, 'TOR25491', 'ARTEL', 'UN', '', '250ML', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oficina' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PISTOLA SILICONA 20W TORRE', 'pistola-silicona-20w-torre-tor35336', 'TORRE - PISTOLA SILICONA 20W TORRE', 4458, 3789.3, 6, 9, '/products/TOR35336.jpg', cat_id, false, true, 'TOR35336', 'TORRE', 'UN', '', '', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bolsa en rollo prepicada 40x60 (kg)', 'bolsa-en-rollo-prepicada-40x60-kg-fopjs-prep40x60', 'FOODPACK - Bolsa en rollo prepicada 40x60 (kg)', 19934, 16943.9, 6, 301, '/products/FOPJS-PREP40X60.jpg', cat_id, true, true, 'FOPJS-PREP40X60', 'FOODPACK', 'ROLLO', '40X60', '', 11664, 8270)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bolsa en rollo prepicada 20x30', 'bolsa-en-rollo-prepicada-20x30-fopjs-prep20x30', 'FOODPACK - Bolsa en rollo prepicada 20x30', 19934, 16943.9, 6, 182, '/products/FOPJS-PREP20X30.jpg', cat_id, true, true, 'FOPJS-PREP20X30', 'FOODPACK', 'ROLLO', '20X30', '', 14175, 5759)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Env. Rect. Bisagra PET 170ml Mod.161 (1x1000)', 'env-rect-bisagra-pet-170ml-mod161-1x1000-fopbx-105161', 'FOODPACK - Env. Rect. Bisagra PET 170ml Mod.161 (1x1000)', 57, 48.45, 6, 26000, '/products/FOPBX-105161.jpg', cat_id, true, true, 'FOPBX-105161', 'FOODPACK', 'UN', '1X1000', '170ML', 42.5, 14.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tapa plana 6-8oz PET (5020)', 'tapa-plana-6-8oz-pet-5020-fopiy-flfc06', 'FOODPACK - Tapa plana 6-8oz PET (5020)', 32, 27.2, 6, 35000, '/products/FOPIY-FLFC06.jpg', cat_id, true, true, 'FOPIY-FLFC06', 'FOODPACK', 'UN', '', '8OZ', 23.5, 8.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Porta sándwich Mediano C-1 (500 unidades)', 'porta-sandwich-mediano-c-1-500-unidades-fopd402101nw', 'FOODPACK - Porta sándwich Mediano C-1 (500 unidades)', 74, 62.9, 6, 13000, '/products/FOPD402101NW.jpg', cat_id, true, true, 'FOPD402101NW', 'FOODPACK', 'CAJA', '', '', 55, 19)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tapa PET Bowl Kraft 500 / 750 / 1.000 cc', 'tapa-pet-bowl-kraft-500-750-1000-cc-akitbk571', 'SIN MARCA - Tapa PET Bowl Kraft 500 / 750 / 1.000 cc', 50, 42.5, 6, 18000, NULL, cat_id, true, true, 'AKITBK571', 'SIN MARCA', 'UN', '', '1.000CC', 38, 12)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Refrigerador Side by Side No Frost 504 Litros Plateado HC-660W', 'refrigerador-side-by-side-no-frost-504-litros-plateado-hc-660w-sod5372909', 'SODIMAC - Refrigerador Side by Side No Frost 504 Litros Plateado HC-660W', 800000, 680000.0, 6, 1, NULL, cat_id, true, true, 'SOD5372909', 'SODIMAC', 'UN', '', '', 638647, 161353)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Lápíz Pasta Isofit 1.6 mm Punta Gruesa Azul', 'lapiz-pasta-isofit-16-mm-punta-gruesa-azul-pri45185', 'ISOFIT - Lápíz Pasta Isofit 1.6 mm Punta Gruesa Azul', 7977, 6780.45, 6, 100, '/products/PRI45185.jpg', cat_id, true, true, 'PRI45185', 'ISOFIT', 'UN', '', '', 6332, 1645)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bowl Kraft 1.000 cc', 'bowl-kraft-1000-cc-akibk1000', 'SIN MARCA - Bowl Kraft 1.000 cc', 80, 68.0, 6, 9300, NULL, cat_id, true, true, 'AKIBK1000', 'SIN MARCA', 'UN', '', '1.000CC', 62, 18)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tapa PET Bowl Kraft 500 / 750 / 1.000 cc', 'tapa-pet-bowl-kraft-500-750-1000-cc-akitppet150nbr', 'SIN MARCA - Tapa PET Bowl Kraft 500 / 750 / 1.000 cc', 64, 54.4, 6, 14100, NULL, cat_id, true, true, 'AKITPPET150NBR', 'SIN MARCA', 'UN', '', '1.000CC', 36, 28)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bowl Kraft 750 cc', 'bowl-kraft-750-cc-akibk700', 'SIN MARCA - Bowl Kraft 750 cc', 105, 89.25, 6, 9900, NULL, cat_id, true, true, 'AKIBK700', 'SIN MARCA', 'UN', '', '750CC', 51, 54)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bowl Kraft 1.000 cc', 'bowl-kraft-1000-cc-akibb1000', 'SIN MARCA - Bowl Kraft 1.000 cc', 100, 85.0, 6, 8100, NULL, cat_id, true, true, 'AKIBB1000', 'SIN MARCA', 'UN', '', '1.000CC', 62, 38)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('SERVILLETA DE COCTEL (12X300)', 'servilleta-de-coctel-12x300-fopst-se3108', 'FOODPACK - SERVILLETA DE COCTEL (12X300)', 19934, 16943.9, 6, 40, '/products/FOPST-SE3108.jpg', cat_id, true, true, 'FOPST-SE3108', 'FOODPACK', 'UN', '12X300', '', 12344, 7590)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Sandwich Pequeño B-1 (1X500)', 'sandwich-pequeno-b-1-1x500-fopdco-402001', 'FOODPACK - Sandwich Pequeño B-1 (1X500)', 74, 62.9, 6, 9000, '/products/FOPDCO-402001.jpg', cat_id, true, true, 'FOPDCO-402001', 'FOODPACK', 'UN', '1X500', '', 49.4, 24.6)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Caja De Archivo Prisa Doble Standard 26 Cm 23 Cm 37.5 Cm', 'caja-de-archivo-prisa-doble-standard-26-cm-23-cm-375-cm-pri17810', 'PRISA - Caja De Archivo Prisa Doble Standard 26 Cm 23 Cm 37.5 Cm', 1096, 931.6, 6, 500, '/products/PRI17810.jpg', cat_id, false, true, 'PRI17810', 'PRISA', 'UN', '', '', 877, 219)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BARRA PROTEINA WILD PROTEIN 30GR MUNCHY CHOC.MANI', 'barra-proteina-wild-protein-30gr-munchy-chocmani-pri11738cm', 'PRISA - BARRA PROTEINA WILD PROTEIN 30GR MUNCHY CHOC.MANI', 889, 755.65, 6, 370, NULL, cat_id, false, true, 'PRI11738CM', 'PRISA', 'UN', '', '30GR', 1078, -189)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('ARCILLA 1KG TORRE', 'arcilla-1kg-torre-tor34958', 'TORRE - ARCILLA 1KG TORRE', 1223, 1039.55, 6, 372, '/products/TOR34958.jpg', cat_id, false, true, 'TOR34958', 'TORRE', 'UN', '', '1KG', 1030, 193)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Sobre Teknofas Oficio 24x34 Blanco', 'sobre-teknofas-oficio-24x34-blanco-pri85370', 'PRISA - Sobre Teknofas Oficio 24x34 Blanco', 3518, 2990.3, 6, 131, '/products/PRI85370.jpg', cat_id, true, true, 'PRI85370', 'PRISA', 'UN', '24X34', '', 2893, 625)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tóner HP 151A Negro Original (W1510A)', 'toner-hp-151a-negro-original-w1510a-priw1510a', 'PRISA - Tóner HP 151A Negro Original (W1510A)', 51321, 43622.85, 6, 3, NULL, cat_id, false, true, 'PRIW1510A', 'PRISA', 'UN', '', '', 123076, -71755)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('ESTUCHE 161 PET 1X1000', 'estuche-161-pet-1x1000-dpsestua034', 'DPS - ESTUCHE 161 PET 1X1000', 57, 48.45, 6, 7000, NULL, cat_id, true, true, 'DPSESTUA034', 'DPS', 'UN', '1X1000', '', 49, 8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('ANTIPARRA PARA PRODUCTOS QUIMICOS K2 CLARA STEELPR', 'antiparra-para-productos-quimicos-k2-clara-steelpr-pri33264cl', 'PRISA - ANTIPARRA PARA PRODUCTOS QUIMICOS K2 CLARA STEELPR', 7944, 6752.4, 6, 50, NULL, cat_id, true, true, 'PRI33264CL', 'PRISA', 'UN', '', '', 6305, 1639)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Mica Encuadernar Diazol Oficio Lisa Humo 100 Unidades', 'mica-encuadernar-diazol-oficio-lisa-humo-100-unidades-pri12396hu', 'DIAZOL - Mica Encuadernar Diazol Oficio Lisa Humo 100 Unidades', 10889, 9255.65, 6, 30, NULL, cat_id, true, true, 'PRI12396HU', 'DIAZOL', 'CAJA', '', '', 9256, 1633)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Etiqueta Ink/Láser Autoadhesiva Adetec 14 Por Hoja 101x34 mm 25 Unidades', 'etiqueta-inklaser-autoadhesiva-adetec-14-por-hoja-101x34-mm-25-unidades-pri14038', 'PRISA - Etiqueta Ink/Láser Autoadhesiva Adetec 14 Por Hoja 101x34 mm 25 Unidades', 3300, 2805.0, 6, 80, NULL, cat_id, true, true, 'PRI14038', 'PRISA', 'CAJA', '101X34', '', 2794, 506)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BL. SET ESCRITURA UNIVERSITARIO 3 BOL A/N/R  CORRECTOR TORRE', 'bl-set-escritura-universitario-3-bol-anr-corrector-torre-tor35266', 'TORRE - BL. SET ESCRITURA UNIVERSITARIO 3 BOL A/N/R  CORRECTOR TORRE', 1461, 1241.85, 6, 192, '/products/TOR35266.jpg', cat_id, false, true, 'TOR35266', 'TORRE', 'UN', '', '', 1120, 341)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('MAQUINA DE HIELO AUTOMATICA', 'maquina-de-hielo-automatica-sod9100067', 'SODIMAC - MAQUINA DE HIELO AUTOMATICA', 123000, 104550.0, 6, 1, '/products/SOD9100067.jpg', cat_id, false, true, 'SOD9100067', 'SODIMAC', 'UN', '', '', 211757.1, -88757.1)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CALCULADORA BÁSICA TORRE 12 DÍGITOS CS-332 UNIDAD REGIÓN VIII', 'calculadora-basica-torre-12-digitos-cs-332-unidad-region-viii-pri45905', 'TORRE - CALCULADORA BÁSICA TORRE 12 DÍGITOS CS-332 UNIDAD REGIÓN VIII', 5064, 4304.4, 6, 50, '/products/PRI45905.jpg', cat_id, true, true, 'PRI45905', 'TORRE', 'UN', '', '', 4201, 863)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('LUPA PLASTICA DIAMETRO 80MM', 'lupa-plastica-diametro-80mm-pnb107197', 'FULTONS - LUPA PLASTICA DIAMETRO 80MM', 1860, 1581.0, 6, 168, NULL, cat_id, true, true, 'PNB107197', 'FULTONS', 'UN', '', '', 1190, 670)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Candado Nanosaver con Combinación', 'candado-nanosaver-con-combinacion-acb27831', 'ACCO BRANDS - Candado Nanosaver con Combinación', 23000, 19550.0, 6, 10, NULL, cat_id, true, true, 'ACB27831', 'ACCO BRANDS', 'UN', '', '', 19796, 3204)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Copa Gelatera 200cc (50x32)', 'copa-gelatera-200cc-50x32-foptg-cg6510', 'FOODPACK - Copa Gelatera 200cc (50x32)', 40, 34.0, 6, 9600, '/products/FOPTG-CG6510.jpg', cat_id, true, true, 'FOPTG-CG6510', 'FOODPACK', 'UN', '50X32', '200CC', 20.3, 19.7)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('DURACELL AA4 RECARGABLE 1,5V', 'duracell-aa4-recargable-15v-pri24186', 'PRISA - DURACELL AA4 RECARGABLE 1,5V', 4856, 4127.6, 6, 45, NULL, cat_id, true, true, 'PRI24186', 'PRISA', 'UN', '', '', 4284.5, 571.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TAPA BOWL KRAFT 750 ML', 'tapa-bowl-kraft-750-ml-akitk-571pet', 'SIN MARCA - TAPA BOWL KRAFT 750 ML', 64, 54.4, 6, 5100, '/products/AKITK-571PET.jpg', cat_id, true, true, 'AKITK-571PET', 'SIN MARCA', 'UN', '', '750ML', 36, 28)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tapa p/ Copa Gelatera 200cc (100x16)', 'tapa-p-copa-gelatera-200cc-100x16-foptg-tcg10', 'FOODPACK - Tapa p/ Copa Gelatera 200cc (100x16)', 26, 22.1, 6, 9600, '/products/FOPTG-TCG10.jpg', cat_id, true, true, 'FOPTG-TCG10', 'FOODPACK', 'UN', '100X16', '200CC', 17.8, 8.2)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('EST. TEMP GEORGI 12 COLORES 15 ML', 'est-temp-georgi-12-colores-15-ml-art10950110', 'SIN MARCA - EST. TEMP GEORGI 12 COLORES 15 ML', 1084, 921.4, 6, 174, '/products/ART10950110.jpg', cat_id, false, true, 'ART10950110', 'SIN MARCA', 'UN', '', '15ML', 921, 163)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Elástico Offione Blanco 60x1.6 Mm', 'elastico-offione-blanco-60x16-mm-pri74411', 'PRISA - Elástico Offione Blanco 60x1.6 Mm', 4473, 3802.05, 6, 44, '/products/PRI74411.jpg', cat_id, true, true, 'PRI74411', 'PRISA', 'UN', '60X1', '', 3334, 1139)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('OREGANO ENTERO 250 GR ALMIFRUT', 'oregano-entero-250-gr-almifrut-dimz419940', 'DIMERC - OREGANO ENTERO 250 GR ALMIFRUT', 9484, 8061.4, 6, 20, '/products/DIMZ419940.jpg', cat_id, true, true, 'DIMZ419940', 'DIMERC', 'UN', '', '250GR', 7112, 2372)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CUCHILLO PLASTICO DESECHABLE', 'cuchillo-plastico-desechable-dpscuden027', 'DPS - CUCHILLO PLASTICO DESECHABLE', 8, 6.8, 6, 20000, '/products/DPSCUDEN027.jpg', cat_id, true, true, 'DPSCUDEN027', 'DPS', 'UN', '', '', 6.5, 1.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bowl Kraft 750 cc', 'bowl-kraft-750-cc-akinbbk700', 'SIN MARCA - Bowl Kraft 750 cc', 105, 89.25, 6, 2100, NULL, cat_id, true, true, 'AKINBBK700', 'SIN MARCA', 'UN', '', '750CC', 58, 47)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('USATAPE, 48MM X 100, TRANSPARENTE', 'usatape-48mm-x-100-transparente-aditee1500185', 'SELLOFFICE - USATAPE, 48MM X 100, TRANSPARENTE', 737, 626.45, 6, 209, '/products/ADITEE1500185.jpg', cat_id, false, true, 'ADITEE1500185', 'SELLOFFICE', 'UN', '', '', 565, 172)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TAPA PARA 3, 4 Y 5.5 OZ CRISTAL (1X2500)', 'tapa-para-3-4-y-55-oz-cristal-1x2500-fopiy-tpcs55', 'FOODPACK - TAPA PARA 3, 4 Y 5.5 OZ CRISTAL (1X2500)', 9, 7.65, 6, 15000, '/products/FOPIY-TPCS55.jpg', cat_id, true, true, 'FOPIY-TPCS55', 'FOODPACK', 'UN', '1X2500', '5.5OZ', 7.5, 1.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Etiqueta Ink/Láser Autoadhesiva Adetec 30 Por Hoja 66X25 mm 25 Unidades', 'etiqueta-inklaser-autoadhesiva-adetec-30-por-hoja-66x25-mm-25-unidades-pri10436', 'PRISA - Etiqueta Ink/Láser Autoadhesiva Adetec 30 Por Hoja 66X25 mm 25 Unidades', 3320, 2822.0, 6, 40, NULL, cat_id, true, true, 'PRI10436', 'PRISA', 'CAJA', '66X25', '', 2794, 526)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BANDERAS 5 COLORES125 UNDS. 25010208(96-1152)', 'banderas-5-colores125-unds-2501020896-1152-jmibandhol001', 'BEIFA - BANDERAS 5 COLORES125 UNDS. 25010208(96-1152)', 1421, 1207.85, 6, 328, '/products/JMIBANDHOL001.jpg', cat_id, true, true, 'JMIBANDHOL001', 'BEIFA', 'UN', '', '', 293, 1128)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('DURACELL AAA4 RECARGABLE 1,2V', 'duracell-aaa4-recargable-12v-pri18721', 'PRISA - DURACELL AAA4 RECARGABLE 1,2V', 4860, 4131.0, 6, 20, NULL, cat_id, true, true, 'PRI18721', 'PRISA', 'UN', '', '', 4284.5, 575.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Lavalozas Quix Concentrado Profesional Limón 5 Litros', 'lavalozas-quix-concentrado-profesional-limon-5-litros-pri21681', 'PRISA - Lavalozas Quix Concentrado Profesional Limón 5 Litros', 12601, 10710.85, 6, 8, '/products/PRI21681.jpg', cat_id, true, true, 'PRI21681', 'PRISA', 'UN', '', '', 10711, 1890)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BANDERITAS ADHESIVAS 5 UN.100 HJS. COL/SURTIDO LAVORO', 'banderitas-adhesivas-5-un100-hjs-colsurtido-lavoro-pnb393408', 'FULTONS - BANDERITAS ADHESIVAS 5 UN.100 HJS. COL/SURTIDO LAVORO', 3794, 3224.9, 6, 108, '/products/PNB393408.jpg', cat_id, true, true, 'PNB393408', 'FULTONS', 'CAJA', '', '', 789, 3005)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BOLSA CAMISETA BLANCA 28X35 (10X100)', 'bolsa-camiseta-blanca-28x35-10x100-dpsbocan030', 'DPS - BOLSA CAMISETA BLANCA 28X35 (10X100)', 7, 5.95, 6, 4000, '/products/DPSBOCAN030.jpg', cat_id, true, true, 'DPSBOCAN030', 'DPS', 'BOLSA', '10X100', '', 21.2, -14.2)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TAPA Trans/Respira (1x1000)', 'tapa-transrespira-1x1000-fopd-4jl', 'FOODPACK - TAPA Trans/Respira (1x1000)', 22, 18.7, 6, 8000, '/products/FOPD-4JL.jpg', cat_id, true, true, 'FOPD-4JL', 'FOODPACK', 'UN', '1X1000', '', 10.5, 11.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Sacos Blanco 050 de 8 x 23 x 4.7 cms.', 'sacos-blanco-050-de-8-x-23-x-47-cms-akisac050', 'SIN MARCA - Sacos Blanco 050 de 8 x 23 x 4.7 cms.', 10, 8.5, 6, 9000, '/products/AKISAC050.jpg', cat_id, true, true, 'AKISAC050', 'SIN MARCA', 'UN', '8X23', '', 8, 2)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CJA POUCHE BARRILITO OFI4 (100mic) 229X368MM 100U', 'cja-pouche-barrilito-ofi4-100mic-229x368mm-100u-acb34136', 'ACCO BRANDS - CJA POUCHE BARRILITO OFI4 (100mic) 229X368MM 100U', 9984, 8486.4, 6, 11, NULL, cat_id, true, true, 'ACB34136', 'ACCO BRANDS', 'UN', '229X368', '', 6118, 3866)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cloro Gel Clorox Original 900 ml', 'cloro-gel-clorox-original-900-ml-pri26300', 'PRISA - Cloro Gel Clorox Original 900 ml', 1571, 1335.35, 6, 50, '/products/PRI26300.jpg', cat_id, false, true, 'PRI26300', 'PRISA', 'UN', '', '900ML', 1335, 236)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Alargador Eléctrico Macrotel 3 m 6 Posiciones Switch Negro', 'alargador-electrico-macrotel-3-m-6-posiciones-switch-negro-pri29745', 'PRISA - Alargador Eléctrico Macrotel 3 m 6 Posiciones Switch Negro', 5135, 4364.75, 6, 18, '/products/PRI29745.jpg', cat_id, true, true, 'PRI29745', 'PRISA', 'UN', '', '', 3646, 1489)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Plastificadora Fusion 1100L, A4.', 'plastificadora-fusion-1100l-a4-acb34085', 'ACCO BRANDS - Plastificadora Fusion 1100L, A4.', 35282, 29989.7, 6, 3, NULL, cat_id, true, true, 'ACB34085', 'ACCO BRANDS', 'UN', '', '1100L', 21035, 14247)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Lámina Termolaminada Barrilito Carta 5 125 Mic 229x292 mm 100 Unidades', 'lamina-termolaminada-barrilito-carta-5-125-mic-229x292-mm-100-unidades-pri83406', 'PRISA - Lámina Termolaminada Barrilito Carta 5 125 Mic 229x292 mm 100 Unidades', 10244, 8707.4, 6, 9, '/products/PRI83406.jpg', cat_id, true, true, 'PRI83406', 'PRISA', 'CAJA', '229X292', '', 6829, 3415)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bolsas Al Vacio Transparentes 30*40', 'bolsas-al-vacio-transparentes-3040-blesellvac30x40', 'SIN MARCA - Bolsas Al Vacio Transparentes 30*40', 308, 261.8, 6, 500, NULL, cat_id, false, true, 'BLESELLVAC30X40', 'SIN MARCA', 'BOLSA', '', '', 121.8, 186.2)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('POUCHES 229X368MM 125MIC 100U', 'pouches-229x368mm-125mic-100u-dvo1308263', 'SIN MARCA - POUCHES 229X368MM 125MIC 100U', 9390, 7981.5, 6, 7, NULL, cat_id, true, true, 'DVO1308263', 'SIN MARCA', 'UN', '229X368', '', 8451, 939)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('SAL LOBOS 1KG', 'sal-lobos-1kg-pri82766', 'PRISA - SAL LOBOS 1KG', 629, 534.65, 6, 120, NULL, cat_id, false, true, 'PRI82766', 'PRISA', 'UN', '', '1KG', 481, 148)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('COLA FRIA 1KG FULTONS', 'cola-fria-1kg-fultons-jam7202002', 'FULTONS - COLA FRIA 1KG FULTONS', 2781, 2363.85, 6, 26, '/products/JAM7202002.jpg', cat_id, true, true, 'JAM7202002', 'FULTONS', 'UN', '', '1KG', 2190, 591)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tóner Brother TN-1060 Negro', 'toner-brother-tn-1060-negro-pri28835', 'PRISA - Tóner Brother TN-1060 Negro', 34020, 28917.0, 6, 2, NULL, cat_id, true, true, 'PRI28835', 'PRISA', 'UN', '', '', 27000, 7020)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Caja De Archivo Memphis Standard', 'caja-de-archivo-memphis-standard-pri11074', 'PRISA - Caja De Archivo Memphis Standard', 340, 289.0, 6, 50, '/products/PRI11074.jpg', cat_id, false, true, 'PRI11074', 'PRISA', 'UN', '', '', 1057, -717)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cloro Tradicional Clorinda 1Lt.', 'cloro-tradicional-clorinda-1lt-pri16145', 'PRISA - Cloro Tradicional Clorinda 1Lt.', 1326, 1127.1, 6, 50, '/products/PRI16145.jpg', cat_id, false, true, 'PRI16145', 'PRISA', 'UN', '', '', 1053, 273)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bombilla blanca 8mm x 25,4 - 3capas Envuelta  (8x500)', 'bombilla-blanca-8mm-x-254-3capas-envuelta-8x500-fopiy-wst8254w', 'FOODPACK - Bombilla blanca 8mm x 25,4 - 3capas Envuelta  (8x500)', 8, 6.8, 6, 4000, '/products/FOPIY-WST8254W.jpg', cat_id, true, true, 'FOPIY-WST8254W', 'FOODPACK', 'UN', '8X500', '', 11.8, -3.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cuchillo Cartonero SK-2500, Grande, Profesional, Selloffice', 'cuchillo-cartonero-sk-2500-grande-profesional-selloffice-adiaccr124005', 'SELLOFFICE - Cuchillo Cartonero SK-2500, Grande, Profesional, Selloffice', 3219, 2736.15, 6, 24, '/products/ADIACCR124005.jpg', cat_id, true, true, 'ADIACCR124005', 'SELLOFFICE', 'UN', '', '', 1926, 1293)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CONT. ALUM C18 CTAPA BOPS 30X20', 'cont-alum-c18-ctapa-bops-30x20-dpsalumn019', 'DPS - CONT. ALUM C18 CTAPA BOPS 30X20', 81, 68.85, 6, 600, NULL, cat_id, true, true, 'DPSALUMN019', 'DPS', 'UN', '30X20', '', 75, 6)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Libreta de Correspondencia Orgarex Oficio 100 Hojas', 'libreta-de-correspondencia-orgarex-oficio-100-hojas-pri82870', 'PRISA - Libreta de Correspondencia Orgarex Oficio 100 Hojas', 6200, 5270.0, 6, 15, NULL, cat_id, true, true, 'PRI82870', 'PRISA', 'UN', '', '', 2980, 3220)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CUCHILLO MADERA (ASL)', 'cuchillo-madera-asl-dpscudema005', 'DPS - CUCHILLO MADERA (ASL)', 16, 13.6, 6, 4000, '/products/DPSCUDEMA005.jpg', cat_id, true, true, 'DPSCUDEMA005', 'DPS', 'UN', '', '', 10, 6)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Higienico Damax 500metros  X 4', 'higienico-damax-500metros-x-4-dipti-hi-dam-hs-0002', 'SIN MARCA - Higienico Damax 500metros  X 4', 2941, 2499.85, 6, 24, '/products/DIPTI-HI-DAM-HS-0002.jpg', cat_id, true, true, 'DIPTI-HI-DAM-HS-0002', 'SIN MARCA', 'UN', '', '', 1609, 1332)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bolsa en rollo prepicada 25X35', 'bolsa-en-rollo-prepicada-25x35-fopjs-prep25x35', 'FOODPACK - Bolsa en rollo prepicada 25X35', 3240, 2754.0, 6, 14, '/products/FOPJS-PREP25X35.jpg', cat_id, true, true, 'FOPJS-PREP25X35', 'FOODPACK', 'ROLLO', '25X35', '', 2592, 648)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARTON FORRADO 110X77 CM 235 GRS UND PLANCHA ENTERA', 'carton-forrado-110x77-cm-235-grs-und-plancha-entera-marz630', 'SIN MARCA - CARTON FORRADO 110X77 CM 235 GRS UND PLANCHA ENTERA', 515, 437.75, 6, 100, NULL, cat_id, false, true, 'MARZ630', 'SIN MARCA', 'UN', '110X77', '235GRS', 380, 135)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BOLÍGRAFO GEL QUICK DRY 0.5MM AZUL TORRE', 'boligrafo-gel-quick-dry-05mm-azul-torre-tor30635', 'TORRE - BOLÍGRAFO GEL QUICK DRY 0.5MM AZUL TORRE', 464, 394.4, 6, 84, '/products/TOR30635.jpg', cat_id, false, true, 'TOR30635', 'TORRE', 'UN', '', '', 445, 19)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BASTIDOR PARA OLEO 30X40CM', 'bastidor-para-oleo-30x40cm-jmibastdan001', 'BEIFA - BASTIDOR PARA OLEO 30X40CM', 4285, 3642.25, 6, 15, NULL, cat_id, true, true, 'JMIBASTDAN001', 'BEIFA', 'UN', '30X40', '30X40CM', 2438, 1847)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Agua Saborizada Cachantun Más Cítrica 600 ml', 'agua-saborizada-cachantun-mas-citrica-600-ml-pri16181', 'PRISA - Agua Saborizada Cachantun Más Cítrica 600 ml', 3342, 2840.7, 6, 10, '/products/PRI16181.jpg', cat_id, false, true, 'PRI16181', 'PRISA', 'UN', '', '600ML', 3358, -16)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Chinches Cabeza Plástica Colores (Caja 100u)', 'chinches-cabeza-plastica-colores-caja-100u-jmichinhol002', 'BEIFA - Chinches Cabeza Plástica Colores (Caja 100u)', 851, 723.35, 6, 51, NULL, cat_id, false, true, 'JMICHINHOL002', 'BEIFA', 'UN', '', '', 635, 216)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('SOBRE AMERICANO BLANCO 10 X 23 80 GR', 'sobre-americano-blanco-10-x-23-80-gr-pri85376', 'PRISA - SOBRE AMERICANO BLANCO 10 X 23 80 GR', 31, 26.35, 6, 1000, NULL, cat_id, true, true, 'PRI85376', 'PRISA', 'UN', '10X23', '80GR', 31.5, -0.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('OVILLO SISAL 50 GRS TORRE', 'ovillo-sisal-50-grs-torre-tor32116', 'TORRE - OVILLO SISAL 50 GRS TORRE', 1006, 855.1, 6, 33, '/products/TOR32116.jpg', cat_id, false, true, 'TOR32116', 'TORRE', 'UN', '', '50GRS', 923, 83)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('LAMINA TERMICA CARTA 100 UN 125 MIC.(225X285) (10)', 'lamina-termica-carta-100-un-125-mic225x285-10-jmilamifuy002', 'BEIFA - LAMINA TERMICA CARTA 100 UN 125 MIC.(225X285) (10)', 9984, 8486.4, 6, 4, NULL, cat_id, true, true, 'JMILAMIFUY002', 'BEIFA', 'CAJA', '225X285', '', 7463, 2521)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PLATO DE CARTON 18 CM', 'plato-de-carton-18-cm-fopgt-p011', 'FOODPACK - PLATO DE CARTON 18 CM', 42, 35.7, 6, 1000, '/products/FOPGT-P011.jpg', cat_id, true, true, 'FOPGT-P011', 'FOODPACK', 'UN', '', '', 29.2, 12.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BARRA ADHESIVA 40G TORRE', 'barra-adhesiva-40g-torre-tor30547', 'TORRE - BARRA ADHESIVA 40G TORRE', 704, 598.4, 6, 45, '/products/TOR30547.jpg', cat_id, false, true, 'TOR30547', 'TORRE', 'UN', '', '40G', 645, 59)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BL. BANDERITAS ANGOSTAS 160 UNIDS', 'bl-banderitas-angostas-160-unids-tor28090', 'TORRE - BL. BANDERITAS ANGOSTAS 160 UNIDS', 6200, 5270.0, 6, 16, '/products/TOR28090.jpg', cat_id, true, true, 'TOR28090', 'TORRE', 'UN', '', '', 1755, 4445)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CUAD. UNIV. LITO 7MM 100 HJ COLON BASIC', 'cuad-univ-lito-7mm-100-hj-colon-basic-tor32554', 'TORRE - CUAD. UNIV. LITO 7MM 100 HJ COLON BASIC', 1162, 987.7, 6, 46, '/products/TOR32554.jpg', cat_id, true, true, 'TOR32554', 'TORRE', 'UN', '', '', 600, 562)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BARRA SILIC. DELGADA 7MM 12 UNID. 15 cm', 'barra-silic-delgada-7mm-12-unid-15-cm-jmiadheshi017', 'BEIFA - BARRA SILIC. DELGADA 7MM 12 UNID. 15 cm', 961, 816.85, 6, 52, '/products/JMIADHESHI017.jpg', cat_id, false, true, 'JMIADHESHI017', 'BEIFA', 'UN', '', '', 510, 451)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('NOTA ADHESIVA 653 51X38 MM. 100 HJS. 2 UN. AMARILLO FULTONS', 'nota-adhesiva-653-51x38-mm-100-hjs-2-un-amarillo-fultons-pnb102646', 'FULTONS - NOTA ADHESIVA 653 51X38 MM. 100 HJS. 2 UN. AMARILLO FULTONS', 255, 216.75, 6, 108, '/products/PNB102646.jpg', cat_id, false, true, 'PNB102646', 'FULTONS', 'CAJA', '51X38', '', 239, 16)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Chinches Metálicos Plateados (Caja 100u)', 'chinches-metalicos-plateados-caja-100u-jmichinbei002', 'BEIFA - Chinches Metálicos Plateados (Caja 100u)', 384, 326.4, 6, 80, '/products/JMICHINBEI002.jpg', cat_id, false, true, 'JMICHINBEI002', 'BEIFA', 'UN', '', '', 315, 69)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Agua Frutal Cachantun Mas Granada 600 ml Sin Gas', 'agua-frutal-cachantun-mas-granada-600-ml-sin-gas-pri16185gr', 'PRISA - Agua Frutal Cachantun Mas Granada 600 ml Sin Gas', 4500, 3825.0, 6, 8, '/products/PRI16185GR.jpg', cat_id, true, true, 'PRI16185GR', 'PRISA', 'UN', '', '600ML', 3138, 1362)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Push-Pins Torini Colores Surtidos 100 Unidades', 'push-pins-torini-colores-surtidos-100-unidades-pri29257', 'PRISA - Push-Pins Torini Colores Surtidos 100 Unidades', 851, 723.35, 6, 50, '/products/PRI29257.jpg', cat_id, false, true, 'PRI29257', 'PRISA', 'CAJA', '', '', 502, 349)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bombilla blanca 6mm x 19,7  3capas Envuelta (10500)', 'bombilla-blanca-6mm-x-197-3capas-envuelta-10500-fopiy-wst6197w', 'FOODPACK - Bombilla blanca 6mm x 19,7  3capas Envuelta (10500)', 12, 10.2, 6, 4000, '/products/FOPIY-WST6197W.jpg', cat_id, true, true, 'FOPIY-WST6197W', 'FOODPACK', 'UN', '', '', 6.2, 5.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('GUILLOTINA PALANCA DIAZOL 305 MM 10 HOJAS', 'guillotina-palanca-diazol-305-mm-10-hojas-pri87583', 'DIAZOL - GUILLOTINA PALANCA DIAZOL 305 MM 10 HOJAS', 30935, 26294.75, 6, 1, NULL, cat_id, true, true, 'PRI87583', 'DIAZOL', 'UN', '', '', 23415, 7520)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Sobre Saco Teknofas Oficio 25x36 B-24 Blanco 50 Unidades', 'sobre-saco-teknofas-oficio-25x36-b-24-blanco-50-unidades-pri11465', 'PRISA - Sobre Saco Teknofas Oficio 25x36 B-24 Blanco 50 Unidades', 119, 101.15, 6, 200, '/products/PRI11465.jpg', cat_id, false, true, 'PRI11465', 'PRISA', 'CAJA', '25X36', '', 117, 2)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('COLA FRIA ESCOLAR 500ML.', 'cola-fria-escolar-500ml-jmiadhebei009', 'BEIFA - COLA FRIA ESCOLAR 500ML.', 3896, 3311.6, 6, 24, NULL, cat_id, true, true, 'JMIADHEBEI009', 'BEIFA', 'UN', '', '500ML', 968, 2928)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Máquina Plastificadora Offiline LM2001A4', 'maquina-plastificadora-offiline-lm2001a4-pri64604', 'PRISA - Máquina Plastificadora Offiline LM2001A4', 23518, 19990.3, 6, 1, NULL, cat_id, true, true, 'PRI64604', 'PRISA', 'UN', '', '', 22963, 555)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CUCHILLO CARTONERO CHICO CK170328 (A)', 'cuchillo-cartonero-chico-ck170328-a-adiaccr124007', 'SELLOFFICE - CUCHILLO CARTONERO CHICO CK170328 (A)', 930, 790.5, 6, 105, '/products/ADIACCR124007.jpg', cat_id, true, true, 'ADIACCR124007', 'SELLOFFICE', 'UN', '', '', 204, 726)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tapa PLA cristal pBowl 500-1000cc (6x50)', 'tapa-pla-cristal-pbowl-500-1000cc-6x50-fophl-lclsb500', 'FOODPACK - Tapa PLA cristal pBowl 500-1000cc (6x50)', 110, 93.5, 6, 200, '/products/FOPHL-LCLSB500.jpg', cat_id, false, true, 'FOPHL-LCLSB500', 'FOODPACK', 'UN', '6X50', '1000CC', 102, 8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BL. CUCHILLO CARTONERO GRANDE 18 MM COLÓN', 'bl-cuchillo-cartonero-grande-18-mm-colon-tor31884', 'TORRE - BL. CUCHILLO CARTONERO GRANDE 18 MM COLÓN', 562, 477.7, 6, 60, '/products/TOR31884.jpg', cat_id, false, true, 'TOR31884', 'TORRE', 'UN', '', '', 335, 227)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('ARPILLERA 10 ONZAS CRUDO 40X25CMS', 'arpillera-10-onzas-crudo-40x25cms-marz084', 'SIN MARCA - ARPILLERA 10 ONZAS CRUDO 40X25CMS', 5003, 4252.55, 6, 43, NULL, cat_id, true, true, 'MARZ084', 'SIN MARCA', 'UN', '40X25', '40X25CM', 465.5, 4537.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CALCULADORA ISOFIT 12 DÍGITOS ISOFIT', 'calculadora-isofit-12-digitos-isofit-lib36641-2', 'ISOFIT - CALCULADORA ISOFIT 12 DÍGITOS ISOFIT', 5555, 4721.75, 6, 8, '/products/LIB36641-2.jpg', cat_id, true, true, 'LIB36641-2', 'ISOFIT', 'UN', '', '', 2451, 3104)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('LIBRETA CORRESPONDENCIA 100 HJS TAPA DURA', 'libreta-correspondencia-100-hjs-tapa-dura-pri84458', 'PRISA - LIBRETA CORRESPONDENCIA 100 HJS TAPA DURA', 1918, 1630.3, 6, 10, '/products/PRI84458.jpg', cat_id, false, true, 'PRI84458', 'PRISA', 'UN', '', '', 1772, 146)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('LIBRETA CORRESPONDENCIA 100 HOJAS TORRE', 'libreta-correspondencia-100-hojas-torre-tor35312', 'TORRE - LIBRETA CORRESPONDENCIA 100 HOJAS TORRE', 2372, 2016.2, 6, 8, '/products/TOR35312.jpg', cat_id, false, true, 'TOR35312', 'TORRE', 'UN', '', '', 2200, 172)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Guía Autoestima para el Corazón', 'guia-autoestima-para-el-corazon-piu6789', 'SIN MARCA - Guía Autoestima para el Corazón', 22000, 18700.0, 6, 1, NULL, cat_id, true, true, 'PIU6789', 'SIN MARCA', 'UN', '', '', 17058.8, 4941.2)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bombilla blanca 6mm x 19,7  3capas (10500)', 'bombilla-blanca-6mm-x-197-3capas-10500-fopiy-st6197w', 'FOODPACK - Bombilla blanca 6mm x 19,7  3capas (10500)', 10, 8.5, 6, 3000, '/products/FOPIY-ST6197W.jpg', cat_id, true, true, 'FOPIY-ST6197W', 'FOODPACK', 'UN', '', '', 5.5, 4.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Sobre Americano Teknofas 10x23 80 g Blanco', 'sobre-americano-teknofas-10x23-80-g-blanco-pri11461', 'PRISA - Sobre Americano Teknofas 10x23 80 g Blanco', 25, 21.25, 6, 500, '/products/PRI11461.jpg', cat_id, false, true, 'PRI11461', 'PRISA', 'UN', '10X23', '80G', 32.4, -7.4)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BALDE MAXI TIZAS PEKES 20 UNI TORRE', 'balde-maxi-tizas-pekes-20-uni-torre-tor32724', 'TORRE - BALDE MAXI TIZAS PEKES 20 UNI TORRE', 2506, 2130.1, 6, 7, '/products/TOR32724.jpg', cat_id, false, true, 'TOR32724', 'TORRE', 'UN', '', '', 2230, 276)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('MEMOTIP55AMAR 76X127.144UN100H', 'memotip55amar-76x127144un100h-dvo1302147', 'SIN MARCA - MEMOTIP55AMAR 76X127.144UN100H', 2558, 2174.3, 6, 37, NULL, cat_id, true, true, 'DVO1302147', 'SIN MARCA', 'UN', '76X127', '', 400, 2158)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Arena Mágica Adetec 6 Colores 100 gr', 'arena-magica-adetec-6-colores-100-gr-pri77689', 'PRISA - Arena Mágica Adetec 6 Colores 100 gr', 8276, 7034.6, 6, 2, NULL, cat_id, true, true, 'PRI77689', 'PRISA', 'UN', '', '100GR', 7366, 910)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('FECHADOR AUTOMATICO NEGRO (12-240)', 'fechador-automatico-negro-12-240-jmifechbei006', 'BEIFA - FECHADOR AUTOMATICO NEGRO (12-240)', 1684, 1431.4, 6, 10, '/products/JMIFECHBEI006.jpg', cat_id, false, true, 'JMIFECHBEI006', 'BEIFA', 'UN', '', '', 1376, 308)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TORRE MONDO PU COLORES 13X21 A5', 'torre-mondo-pu-colores-13x21-a5-tor30320', 'TORRE - TORRE MONDO PU COLORES 13X21 A5', 2734, 2323.9, 6, 4, '/products/TOR30320.jpg', cat_id, false, true, 'TOR30320', 'TORRE', 'UN', '13X21', '', 3365, -631)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('APRETADOR 19MM CAJA 12 UNI NEGRO 11020016 (12-300', 'apretador-19mm-caja-12-uni-negro-11020016-12-300-jmiaprehol003', 'BEIFA - APRETADOR 19MM CAJA 12 UNI NEGRO 11020016 (12-300', 430, 365.5, 6, 55, NULL, cat_id, false, true, 'JMIAPREHOL003', 'BEIFA', 'UN', '', '', 227, 203)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TAMPON NEGRO 118X81MM 14010039 (12-144)', 'tampon-negro-118x81mm-14010039-12-144-jmitamphol001', 'BEIFA - TAMPON NEGRO 118X81MM 14010039 (12-144)', 2398, 2038.3, 6, 17, NULL, cat_id, true, true, 'JMITAMPHOL001', 'BEIFA', 'UN', '118X81', '', 722, 1676)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('USATAPE, 48MM X 30M, TRANSPARENTE', 'usatape-48mm-x-30m-transparente-aditee1500137', 'SELLOFFICE - USATAPE, 48MM X 30M, TRANSPARENTE', 289, 245.65, 6, 44, '/products/ADITEE1500137.jpg', cat_id, false, true, 'ADITEE1500137', 'SELLOFFICE', 'UN', '', '', 276, 13)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Calculadora Básica Casio GX-14B 14 Dígitos', 'calculadora-basica-casio-gx-14b-14-digitos-pri86221', 'PRISA - Calculadora Básica Casio GX-14B 14 Dígitos', 14046, 11939.1, 6, 1, '/products/PRI86221.jpg', cat_id, true, true, 'PRI86221', 'PRISA', 'UN', '', '', 11939, 2107)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cloro Detter Concentrado 5 Bidón 5 L', 'cloro-detter-concentrado-5-bidon-5-l-pri83102', 'PRISA - Cloro Detter Concentrado 5 Bidón 5 L', 3117, 2649.45, 6, 4, '/products/PRI83102.jpg', cat_id, false, true, 'PRI83102', 'PRISA', 'UN', '', '5L', 2805, 312)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('GUILLOTINA A3 12HJ BASE MADERA. LAVORO', 'guillotina-a3-12hj-base-madera-lavoro-pnb525275', 'FULTONS - GUILLOTINA A3 12HJ BASE MADERA. LAVORO', 24178, 20551.3, 6, 1, NULL, cat_id, true, true, 'PNB525275', 'FULTONS', 'UN', '', '', 10990, 13188)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CAJA ARCHIVO EURO-BOX 21 REVIST 26 5X14', 'caja-archivo-euro-box-21-revist-26-5x14-pri81081', 'PRISA - CAJA ARCHIVO EURO-BOX 21 REVIST 26 5X14', 2416, 2053.6, 6, 5, '/products/PRI81081.jpg', cat_id, false, true, 'PRI81081', 'PRISA', 'UN', '5X14', '', 2054, 362)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TAMPON DACTILAR CIRCULAR NEGRO CTAPA (12-288)', 'tampon-dactilar-circular-negro-ctapa-12-288-jmitampbei004', 'BEIFA - TAMPON DACTILAR CIRCULAR NEGRO CTAPA (12-288)', 1518, 1290.3, 6, 29, '/products/JMITAMPBEI004.jpg', cat_id, true, true, 'JMITAMPBEI004', 'BEIFA', 'UN', '', '', 350, 1168)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cuchillo madera desechables', 'cuchillo-madera-desechables-akicumd165', 'SIN MARCA - Cuchillo madera desechables', 16, 13.6, 6, 1000, '/products/AKICUMD165.jpg', cat_id, true, true, 'AKICUMD165', 'SIN MARCA', 'UN', '', '', 10, 6)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('GRAPAS 53 12 1000 UN', 'grapas-53-12-1000-un-dim507701', 'DIMERC - GRAPAS 53 12 1000 UN', 1870, 1589.5, 6, 6, NULL, cat_id, false, true, 'DIM507701', 'DIMERC', 'CAJA', '', '', 1500, 370)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PORTA SCOTCH GRANDE', 'porta-scotch-grande-jmiportbei003', 'BEIFA - PORTA SCOTCH GRANDE', 3304, 2808.4, 6, 4, '/products/JMIPORTBEI003.jpg', cat_id, true, true, 'JMIPORTBEI003', 'BEIFA', 'UN', '', '', 2235, 1069)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('LAMINA EMOCIONES Y PROFESIONES 50X70CM', 'lamina-emociones-y-profesiones-50x70cm-jmilamijmi015', 'BEIFA - LAMINA EMOCIONES Y PROFESIONES 50X70CM', 4000, 3400.0, 6, 6, NULL, cat_id, true, true, 'JMILAMIJMI015', 'BEIFA', 'UN', '50X70', '50X70CM', 1463, 2537)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('POTES TRANSPARENTES BISAGRA 200-250CC', 'potes-transparentes-bisagra-200-250cc-akipobi408td', 'SIN MARCA - POTES TRANSPARENTES BISAGRA 200-250CC', 51, 43.35, 6, 200, '/products/AKIPOBI408TD.jpg', cat_id, false, true, 'AKIPOBI408TD', 'SIN MARCA', 'UN', '', '250CC', 43, 8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CUCHILLO DE MADERA DESECHABLE', 'cuchillo-de-madera-desechable-fopys-k160b', 'FOODPACK - CUCHILLO DE MADERA DESECHABLE', 16, 13.6, 6, 1000, '/products/FOPYS-K160B.jpg', cat_id, true, true, 'FOPYS-K160B', 'FOODPACK', 'UN', '', '', 8.2, 7.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bowl Kraft con Capa de PLA Biodegradable y Compostable con Tapa de PLA Transparente', 'bowl-kraft-con-capa-de-pla-biodegradable-y-compostable-con-tapa-de-pla-transpare-dpsbioensal005', 'DPS - Bowl Kraft con Capa de PLA Biodegradable y Compostable con Tapa de PLA Transparente', 133, 113.05, 6, 100, '/products/DPSBIOENSAL005.jpg', cat_id, false, true, 'DPSBIOENSAL005', 'DPS', 'UN', '', '', 77.9, 55.1)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cloro Gel Igenix Tradicional 900 ml', 'cloro-gel-igenix-tradicional-900-ml-pri91016t', 'PRISA - Cloro Gel Igenix Tradicional 900 ml', 1228, 1043.8, 6, 7, '/products/PRI91016T.jpg', cat_id, false, true, 'PRI91016T', 'PRISA', 'UN', '', '900ML', 1071, 157)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Palos Coctail Brocheta 25 cm Bolsa 100 Unidades', 'palos-coctail-brocheta-25-cm-bolsa-100-unidades-pri85119', 'PRISA - Palos Coctail Brocheta 25 cm Bolsa 100 Unidades', 478, 406.3, 6, 20, NULL, cat_id, false, true, 'PRI85119', 'PRISA', 'BOLSA', '', '', 370, 108)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Revolvedor madera 14 cms.', 'revolvedor-madera-14-cms-akirev14', 'SIN MARCA - Revolvedor madera 14 cms.', 8, 6.8, 6, 3000, '/products/AKIREV14.jpg', cat_id, true, true, 'AKIREV14', 'SIN MARCA', 'UN', '', '', 2.2, 5.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('ARPILLERAS COLORES 40X25 CMS', 'arpilleras-colores-40x25-cms-marz463', 'SIN MARCA - ARPILLERAS COLORES 40X25 CMS', 815, 692.75, 6, 10, '/products/MARZ463.jpg', cat_id, false, true, 'MARZ463', 'SIN MARCA', 'UN', '40X25', '40X25CM', 627, 188)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('NOTA ADHESIVA 654 76X76 MM. 100 UNIDADES 5 COL. NEON LAVORO', 'nota-adhesiva-654-76x76-mm-100-unidades-5-col-neon-lavoro-pnb393405', 'FULTONS - NOTA ADHESIVA 654 76X76 MM. 100 UNIDADES 5 COL. NEON LAVORO', 2341, 1989.85, 6, 3, '/products/PNB393405.jpg', cat_id, false, true, 'PNB393405', 'FULTONS', 'CAJA', '76X76', '', 1990, 351)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Portataco Calendario Trupan Chico Amarillo', 'portataco-calendario-trupan-chico-amarillo-pri11008', 'PRISA - Portataco Calendario Trupan Chico Amarillo', 1335, 1134.75, 6, 5, '/products/PRI11008.jpg', cat_id, false, true, 'PRI11008', 'PRISA', 'UN', '', '', 1100, 235)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('MEZCLADOR ACRÍLICO 6 DIV  CHICO FULTONS', 'mezclador-acrilico-6-div-chico-fultons-pnb105992', 'FULTONS - MEZCLADOR ACRÍLICO 6 DIV  CHICO FULTONS', 250, 212.5, 6, 36, '/products/PNB105992.jpg', cat_id, false, true, 'PNB105992', 'FULTONS', 'UN', '', '', 149, 101)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cubrecalzado Desechable Cranberry Tela Gruesa 50 Pares', 'cubrecalzado-desechable-cranberry-tela-gruesa-50-pares-pri70253', 'PRISA - Cubrecalzado Desechable Cranberry Tela Gruesa 50 Pares', 3305, 2809.25, 6, 2, NULL, cat_id, true, true, 'PRI70253', 'PRISA', 'UN', '', '', 2610, 695)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('ARCHIV. PLASTIFICADO AZUL C/GUSANO AUCA', 'archiv-plastificado-azul-cgusano-auca-tor27908', 'TORRE - ARCHIV. PLASTIFICADO AZUL C/GUSANO AUCA', 904, 768.4, 6, 12, '/products/TOR27908.jpg', cat_id, false, true, 'TOR27908', 'TORRE', 'UN', '', '', 435, 469)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('REPUESTO CUCHILLO CARTONERO ISOFIT GRANDE 10 UNIDADES', 'repuesto-cuchillo-cartonero-isofit-grande-10-unidades-pri89100', 'ISOFIT - REPUESTO CUCHILLO CARTONERO ISOFIT GRANDE 10 UNIDADES', 2199, 1869.15, 6, 7, '/products/PRI89100.jpg', cat_id, true, true, 'PRI89100', 'ISOFIT', 'CAJA', '', '', 690, 1509)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PELOTA SOFT SMILE', 'pelota-soft-smile-jmijuegbas252', 'BEIFA - PELOTA SOFT SMILE', 1097, 932.45, 6, 1, NULL, cat_id, false, true, 'JMIJUEGBAS252', 'BEIFA', 'UN', '', '', 4825, -3728)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tapa p/plato oval Tugou (2150)', 'tapa-pplato-oval-tugou-2150-foptg-8000', 'FOODPACK - Tapa p/plato oval Tugou (2150)', 50, 42.5, 6, 100, '/products/FOPTG-8000.jpg', cat_id, false, true, 'FOPTG-8000', 'FOODPACK', 'UN', '', '', 38.1, 11.9)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Frutos Secos Hortensia Mix Frutos del Bosque 30 g', 'frutos-secos-hortensia-mix-frutos-del-bosque-30-g-pri75813', 'PRISA - Frutos Secos Hortensia Mix Frutos del Bosque 30 g', 896, 761.6, 6, 8, NULL, cat_id, false, true, 'PRI75813', 'PRISA', 'UN', '', '30G', 451.2, 444.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Frutos Secos Hortensia Mix Tropicalísimo 30 g 10 unidades', 'frutos-secos-hortensia-mix-tropicalisimo-30-g-10-unidades-pri75814', 'PRISA - Frutos Secos Hortensia Mix Tropicalísimo 30 g 10 unidades', 896, 761.6, 6, 8, NULL, cat_id, false, true, 'PRI75814', 'PRISA', 'CAJA', '', '30G', 451.2, 444.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Frutos Secos Hortensia Almendras 20 g', 'frutos-secos-hortensia-almendras-20-g-pri75816', 'PRISA - Frutos Secos Hortensia Almendras 20 g', 896, 761.6, 6, 8, NULL, cat_id, false, true, 'PRI75816', 'PRISA', 'UN', '', '20G', 451.2, 444.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('ANOTADOR CAPRETADOR MADERA OF. FULTONS', 'anotador-capretador-madera-of-fultons-adiactp124101', 'FULTONS - ANOTADOR CAPRETADOR MADERA OF. FULTONS', 1635, 1389.75, 6, 3, NULL, cat_id, true, true, 'ADIACTP124101', 'FULTONS', 'UN', '', '', 1078, 557)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('ESTUCHE GRANDE LISO MIX COL TORRE', 'estuche-grande-liso-mix-col-torre-tor33173', 'TORRE - ESTUCHE GRANDE LISO MIX COL TORRE', 6253, 5315.05, 6, 1, '/products/TOR33173.jpg', cat_id, true, true, 'TOR33173', 'TORRE', 'UN', '', '', 3100, 3153)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('MEZCLADOR PLASTICO 4 CAVIDADES HAND', 'mezclador-plastico-4-cavidades-hand-hnd3549032', 'SIN MARCA - MEZCLADOR PLASTICO 4 CAVIDADES HAND', 183, 155.55, 6, 30, '/products/HND3549032.jpg', cat_id, false, true, 'HND3549032', 'SIN MARCA', 'UN', '', '', 101, 82)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('LÁPICES DE COLORES HEXAGONALES LARGOS, 12 COLORES, SELLOSCHOOL', 'lapices-de-colores-hexagonales-largos-12-colores-selloschool-adialc0125002', 'SELLOFFICE - LÁPICES DE COLORES HEXAGONALES LARGOS, 12 COLORES, SELLOSCHOOL', 619, 526.15, 6, 5, '/products/ADIALC0125002.jpg', cat_id, false, true, 'ADIALC0125002', 'SELLOFFICE', 'UN', '', '', 580, 39)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cuchillo Blanco PP', 'cuchillo-blanco-pp-fopie-70041', 'FOODPACK - Cuchillo Blanco PP', 9, 7.65, 6, 400, '/products/FOPIE-70041.jpg', cat_id, false, true, 'FOPIE-70041', 'FOODPACK', 'UN', '', '', 6, 3)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('ARCHIV. PLASTIFICADO CGUSANO AUCA', 'archiv-plastificado-cgusano-auca-tor28827', 'TORRE - ARCHIV. PLASTIFICADO CGUSANO AUCA', 292, 248.2, 6, 6, '/products/TOR28827.jpg', cat_id, false, true, 'TOR28827', 'TORRE', 'UN', '', '', 400, -108)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PORTA LAPICES ISOFIT 8098 MM NEGRO', 'porta-lapices-isofit-8098-mm-negro-lib29369-5', 'ISOFIT - PORTA LAPICES ISOFIT 8098 MM NEGRO', 1513, 1286.05, 6, 4, '/products/LIB29369-5.jpg', cat_id, true, true, 'LIB29369-5', 'ISOFIT', 'UN', '', '', 545, 968)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PELOTAS SENSORIALES SQUISHY 8 PZAS. 6.5 CM. (20)', 'pelotas-sensoriales-squishy-8-pzas-65-cm-20-jmijuegcai052', 'BEIFA - PELOTAS SENSORIALES SQUISHY 8 PZAS. 6.5 CM. (20)', 1236, 1050.6, 6, 1, NULL, cat_id, false, true, 'JMIJUEGCAI052', 'BEIFA', 'UN', '', '', 1861.3, -625.3)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('SACAPUNTA METÁLICO DOBLE (BOX) TORRE', 'sacapunta-metalico-doble-box-torre-jmisacabei001', 'TORRE - SACAPUNTA METÁLICO DOBLE (BOX) TORRE', 254, 215.9, 6, 8, '/products/JMISACABEI001.jpg', cat_id, false, true, 'JMISACABEI001', 'TORRE', 'UN', '', '', 200, 54)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('SACAPUNTA METÁLICO DOBLE (BOX) TORRE', 'sacapunta-metalico-doble-box-torre-tor31237', 'TORRE - SACAPUNTA METÁLICO DOBLE (BOX) TORRE', 218, 185.3, 6, 10, '/products/TOR31237.jpg', cat_id, false, true, 'TOR31237', 'TORRE', 'UN', '', '', 135, 83)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('ADHESIVO EN BARRA ESCOLAR 21GRS. 1003 (10-360)', 'adhesivo-en-barra-escolar-21grs-1003-10-360-jmiadhebei002', 'BEIFA - ADHESIVO EN BARRA ESCOLAR 21GRS. 1003 (10-360)', 330, 280.5, 6, 6, '/products/JMIADHEBEI002.jpg', cat_id, false, true, 'JMIADHEBEI002', 'BEIFA', 'UN', '', '21GRS', 210, 120)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('APRETADOR 51MM', 'apretador-51mm-jmiaprehai001', 'BEIFA - APRETADOR 51MM', 214, 181.9, 6, 10, NULL, cat_id, false, true, 'JMIAPREHAI001', 'BEIFA', 'UN', '', '', 105.6, 108.4)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('SACAPUNTA METALICO SIMPLE ACHAFLANADO 1 ORIFICIO', 'sacapunta-metalico-simple-achaflanado-1-orificio-dim534280', 'DIMERC - SACAPUNTA METALICO SIMPLE ACHAFLANADO 1 ORIFICIO', 163, 138.55, 6, 5, '/products/DIM534280.jpg', cat_id, false, true, 'DIM534280', 'DIMERC', 'UN', '', '', 181, -18)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('LAMINA TERM7hOL OF 125MIC UND', 'lamina-term7hol-of-125mic-und-pnb415610', 'FULTONS - LAMINA TERM7hOL OF 125MIC UND', 177, 150.45, 6, 8, '/products/PNB415610.jpg', cat_id, false, true, 'PNB415610', 'FULTONS', 'UN', '', '', 99.9, 77.1)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PECHERA C MANGA Y OJAL 102X115 CM ADICARE 10 UD AZUL', 'pechera-c-manga-y-ojal-102x115-cm-adicare-10-ud-azul-pri44160', 'PRISA - PECHERA C MANGA Y OJAL 102X115 CM ADICARE 10 UD AZUL', 367, 311.95, 6, 2, '/products/PRI44160.jpg', cat_id, false, true, 'PRI44160', 'PRISA', 'CAJA', '102X115', '102X115CM', 291.5, 75.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Lámina Termolaminada Dahle Carta 5', 'lamina-termolaminada-dahle-carta-5-pri28045', 'PRISA - Lámina Termolaminada Dahle Carta 5', 82, 69.7, 6, 7, '/products/PRI28045.jpg', cat_id, false, true, 'PRI28045', 'PRISA', 'UN', '', '', 65.9, 16.1)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Guantes de Nitrilo Tresor Examinación Sin Polvos Talla M Azul 100 Unidades', 'guantes-de-nitrilo-tresor-examinacion-sin-polvos-talla-m-azul-100-unidades-pri34352m', 'PRISA - Guantes de Nitrilo Tresor Examinación Sin Polvos Talla M Azul 100 Unidades', 25, 21.25, 6, 3, '/products/PRI34352M.jpg', cat_id, false, true, 'PRI34352M', 'PRISA', 'CAJA', '', '', 28.1, -3.1)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Sobre Teknofas 1/2 Oficio 20x26 80 G Blanco', 'sobre-teknofas-12-oficio-20x26-80-g-blanco-pri85365', 'PRISA - Sobre Teknofas 1/2 Oficio 20x26 80 G Blanco', 107, 90.95, 6, 1, '/products/PRI85365.jpg', cat_id, false, true, 'PRI85365', 'PRISA', 'UN', '20X26', '80G', 83.1, 23.9)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CJA POUCHE BARRILITO CTA4 (100mic) 229X292MM 100U', 'cja-pouche-barrilito-cta4-100mic-229x292mm-100u-acb34137', 'ACCO BRANDS - CJA POUCHE BARRILITO CTA4 (100mic) 229X292MM 100U', 100, 85.0, 6, 1, NULL, cat_id, false, true, 'ACB34137', 'ACCO BRANDS', 'UN', '229X292', '', 75.6, 24.4)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PUNCH PIN 50 UN. COLSURTIDO FULTONS', 'punch-pin-50-un-colsurtido-fultons-pnb107137', 'FULTONS - PUNCH PIN 50 UN. COLSURTIDO FULTONS', 3, 2.55, 6, 5, NULL, cat_id, false, true, 'PNB107137', 'FULTONS', 'CAJA', '', '', 5.8, -2.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'varios' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BARRA ADHESIVA 115GR. TORRE', 'barra-adhesiva-115gr-torre-tor30244', 'TORRE - BARRA ADHESIVA 115GR. TORRE', 1163, 988.55, 6, 54, '/products/TOR30244.jpg', cat_id, false, true, 'TOR30244', 'TORRE', 'UN', '', '115GR', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CROQUERA  21X32 DOBLE FAZ TORRE IMAGIA', 'croquera-21x32-doble-faz-torre-imagia-tor24341', 'TORRE - CROQUERA  21X32 DOBLE FAZ TORRE IMAGIA', 2803, 2382.55, 6, 1450, '/products/TOR24341.jpg', cat_id, true, true, 'TOR24341', 'TORRE', 'UN', '21X32', '', 2510, 293)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Archivador Artel Oficio Ancho Burdeo', 'archivador-artel-oficio-ancho-burdeo-pri70901', 'ARTEL - Archivador Artel Oficio Ancho Burdeo', 1736, 1475.6, 6, 1830, '/products/PRI70901.jpg', cat_id, true, true, 'PRI70901', 'ARTEL', 'UN', '', '', 1389, 347)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PAPEL OPALINA LISA CARTA DE 225 GR 100 UNIDADES', 'papel-opalina-lisa-carta-de-225-gr-100-unidades-pri85231', 'PRISA - PAPEL OPALINA LISA CARTA DE 225 GR 100 UNIDADES', 11661, 9911.85, 6, 120, '/products/PRI85231.jpg', cat_id, true, true, 'PRI85231', 'PRISA', 'CAJA', '', '225GR', 9329, 2332)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Block Anillado Colón Escolar M7 80 Hojas', 'block-anillado-colon-escolar-m7-80-hojas-pri99412m7', 'PRISA - Block Anillado Colón Escolar M7 80 Hojas', 983, 835.55, 6, 975, '/products/PRI99412M7.jpg', cat_id, true, true, 'PRI99412M7', 'PRISA', 'UN', '', '', 994, -11)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Resma Papel Fotocopia Report Oficio 500 Hojas Resma Papel Fotocopia Report Oficio 500 Hojas', 'resma-papel-fotocopia-report-oficio-500-hojas-resma-papel-fotocopia-report-ofici-pri11381', 'PRISA - Resma Papel Fotocopia Report Oficio 500 Hojas Resma Papel Fotocopia Report Oficio 500 Hojas', 2586, 2198.1, 6, 265, '/products/PRI11381.jpg', cat_id, false, true, 'PRI11381', 'PRISA', 'RESMA', '', '', 3011, -425)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Carpeta Plastificada Torre Azul', 'carpeta-plastificada-torre-azul-pri18283', 'TORRE - Carpeta Plastificada Torre Azul', 619, 526.15, 6, 1000, '/products/PRI18283.jpg', cat_id, true, true, 'PRI18283', 'TORRE', 'UN', '', '', 555, 64)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Pote Polipapel 6oz Blanco (20x50)', 'pote-polipapel-6oz-blanco-20x50-foptg-fc06', 'FOODPACK - Pote Polipapel 6oz Blanco (20x50)', 37, 31.45, 6, 20000, '/products/FOPTG-FC06.jpg', cat_id, true, true, 'FOPTG-FC06', 'FOODPACK', 'UN', '20X50', '6OZ', 27.5, 9.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Pote 8oz Kraft polipapel (2050)', 'pote-8oz-kraft-polipapel-2050-fopiy-fc08k', 'FOODPACK - Pote 8oz Kraft polipapel (2050)', 48, 40.8, 6, 16000, '/products/FOPIY-FC08K.jpg', cat_id, true, true, 'FOPIY-FC08K', 'FOODPACK', 'UN', '', '8OZ', 33.2, 14.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Papel Fotocopia Paperline Green Carta 70 g 500 Hojas', 'papel-fotocopia-paperline-green-carta-70-g-500-hojas-pri92501', 'PRISA - Papel Fotocopia Paperline Green Carta 70 g 500 Hojas', 2875, 2443.75, 6, 220, '/products/PRI92501.jpg', cat_id, true, true, 'PRI92501', 'PRISA', 'UN', '', '70G', 2317, 558)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BLOCK DIBUJO M-99 DOBLE FAZ TORRE IMAGIA', 'block-dibujo-m-99-doble-faz-torre-imagia-tor23213', 'TORRE - BLOCK DIBUJO M-99 DOBLE FAZ TORRE IMAGIA', 1408, 1196.8, 6, 370, '/products/TOR23213.jpg', cat_id, false, true, 'TOR23213', 'TORRE', 'UN', '', '', 1200, 208)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('FUNDA OFICIO TRANSPARENTE 100 UNIDADES TORRE', 'funda-oficio-transparente-100-unidades-torre-tor35283', 'TORRE - FUNDA OFICIO TRANSPARENTE 100 UNIDADES TORRE', 2232, 1897.2, 6, 167, '/products/TOR35283.jpg', cat_id, false, true, 'TOR35283', 'TORRE', 'CAJA', '', '', 2640, -408)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Resma Papel Fotocopia Reprograf Carta 500 Hojas Resma Papel Fotocopia Reprograf Carta 500 Hojas', 'resma-papel-fotocopia-reprograf-carta-500-hojas-resma-papel-fotocopia-reprograf-pri28050', 'PRISA - Resma Papel Fotocopia Reprograf Carta 500 Hojas Resma Papel Fotocopia Reprograf Carta 500 Hojas', 2868, 2437.8, 6, 140, '/products/PRI28050.jpg', cat_id, false, true, 'PRI28050', 'PRISA', 'RESMA', '', '', 2671, 197)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Carpeta Colgante Orgarex 21800 Plástica', 'carpeta-colgante-orgarex-21800-plastica-pri87284', 'PRISA - Carpeta Colgante Orgarex 21800 Plástica', 322, 273.7, 6, 1470, '/products/PRI87284.jpg', cat_id, true, true, 'PRI87284', 'PRISA', 'UN', '', '', 246, 76)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PAPEL FOTOC. OFICIO 75 GR EXECUTIVE', 'papel-fotoc-oficio-75-gr-executive-pri11912', 'PRISA - PAPEL FOTOC. OFICIO 75 GR EXECUTIVE', 3409, 2897.65, 6, 105, '/products/PRI11912.jpg', cat_id, false, true, 'PRI11912', 'PRISA', 'UN', '', '75GR', 3332, 77)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Resma Papel Fotocopia Prisa Carta 75 g 500 Hojas', 'resma-papel-fotocopia-prisa-carta-75-g-500-hojas-pri18790', 'PRISA - Resma Papel Fotocopia Prisa Carta 75 g 500 Hojas', 2424, 2060.4, 6, 102, '/products/PRI18790.jpg', cat_id, false, true, 'PRI18790', 'PRISA', 'RESMA', '', '75G', 2927, -503)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('FUNDA P/ARCHIVO PP OF BLANCO 1UN', 'funda-parchivo-pp-of-blanco-1un-pnb101719', 'FULTONS - FUNDA P/ARCHIVO PP OF BLANCO 1UN', 2538, 2157.3, 6, 125, '/products/PNB101719.jpg', cat_id, false, true, 'PNB101719', 'FULTONS', 'CAJA', '', '', 2100, 438)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PAPEL OPALINA LISA OFICIO DE 225 GR 100 UNIDADES', 'papel-opalina-lisa-oficio-de-225-gr-100-unidades-pri85232', 'PRISA - PAPEL OPALINA LISA OFICIO DE 225 GR 100 UNIDADES', 12485, 10612.25, 6, 25, '/products/PRI85232.jpg', cat_id, true, true, 'PRI85232', 'PRISA', 'CAJA', '', '225GR', 9988, 2497)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Archivador Oficio Torre Ancho 518-H Burdeo', 'archivador-oficio-torre-ancho-518-h-burdeo-pri12159', 'TORRE - Archivador Oficio Torre Ancho 518-H Burdeo', 2311, 1964.35, 6, 100, '/products/PRI12159.jpg', cat_id, false, true, 'PRI12159', 'TORRE', 'UN', '', '', 2227, 84)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Carpeta Oficio Data Zone con', 'carpeta-oficio-data-zone-con-pri81631ng', 'PRISA - Carpeta Oficio Data Zone con', 2414, 2051.9, 6, 100, '/products/PRI81631NG.jpg', cat_id, false, true, 'PRI81631NG', 'PRISA', 'UN', '', '', 2052, 362)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cuaderno 1/2 Oficio Torre Escoces M7 Tapa Dura 150 Hojas', 'cuaderno-12-oficio-torre-escoces-m7-tapa-dura-150-hojas-pri25087', 'TORRE - Cuaderno 1/2 Oficio Torre Escoces M7 Tapa Dura 150 Hojas', 2206, 1875.1, 6, 88, '/products/PRI25087.jpg', cat_id, false, true, 'PRI25087', 'TORRE', 'UN', '', '', 2146, 60)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARPETA C/ACCOCLIP BOLS.TRIANGULAR OF. VINIL NEGRO FULTONS', 'carpeta-caccoclip-bolstriangular-of-vinil-negro-fultons-pnb394418', 'FULTONS - CARPETA C/ACCOCLIP BOLS.TRIANGULAR OF. VINIL NEGRO FULTONS', 457, 388.45, 6, 468, '/products/PNB394418.jpg', cat_id, false, true, 'PNB394418', 'FULTONS', 'UN', '', '', 390, 67)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Libro De Actas Rem Max Cuadriculado 100 Hojas', 'libro-de-actas-rem-max-cuadriculado-100-hojas-pri98088', 'PRISA - Libro De Actas Rem Max Cuadriculado 100 Hojas', 3129, 2659.65, 6, 60, NULL, cat_id, false, true, 'PRI98088', 'PRISA', 'UN', '', '', 2860, 269)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('FUNDA CARTA TRANSP. UND', 'funda-carta-transp-und-jmifundhol002', 'BEIFA - FUNDA CARTA TRANSP. UND', 4950, 4207.5, 6, 99, '/products/JMIFUNDHOL002.jpg', cat_id, true, true, 'JMIFUNDHOL002', 'BEIFA', 'UN', '', '', 1650, 3300)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Libro de Actas Aron Lineal con Folio 200 Hojas', 'libro-de-actas-aron-lineal-con-folio-200-hojas-pri80772', 'PRISA - Libro de Actas Aron Lineal con Folio 200 Hojas', 4961, 4216.85, 6, 33, '/products/PRI80772.jpg', cat_id, true, true, 'PRI80772', 'PRISA', 'UN', '', '', 4246, 715)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Papel Foto Adetec Brillant Inkjet A-4 150 g 20 Hojas Papel Foto Adetec Brillant Inkjet A-4 150 g', 'papel-foto-adetec-brillant-inkjet-a-4-150-g-20-hojas-papel-foto-adetec-brillant-pri14193', 'PRISA - Papel Foto Adetec Brillant Inkjet A-4 150 g 20 Hojas Papel Foto Adetec Brillant Inkjet A-4 150 g', 8069, 6858.65, 6, 20, NULL, cat_id, true, true, 'PRI14193', 'PRISA', 'UN', '', '150G', 6445, 1624)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BLOCK MILIMETRADO 50H 21X30,5 COLON', 'block-milimetrado-50h-21x305-colon-tor34344', 'TORRE - BLOCK MILIMETRADO 50H 21X30,5 COLON', 1918, 1630.3, 6, 70, '/products/TOR34344.jpg', cat_id, false, true, 'TOR34344', 'TORRE', 'UN', '21X30', '', 1710, 208)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('RESMAS CARTA PIX', 'resmas-carta-pix-dippix75carta', 'SIN MARCA - RESMAS CARTA PIX', 3571, 3035.35, 6, 44, NULL, cat_id, true, true, 'DIPPIX75CARTA', 'SIN MARCA', 'RESMA', '', '', 2590, 981)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Lomo Archivador Adetec Adhesivo Ancho Rojo 10 Unidades', 'lomo-archivador-adetec-adhesivo-ancho-rojo-10-unidades-pri12819rj', 'PRISA - Lomo Archivador Adetec Adhesivo Ancho Rojo 10 Unidades', 896, 761.6, 6, 150, '/products/PRI12819RJ.jpg', cat_id, false, true, 'PRI12819RJ', 'PRISA', 'CAJA', '', '', 715, 181)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Lomo Archivador Adetec Adhesivo Ancho Verde Claro 10 Unidades', 'lomo-archivador-adetec-adhesivo-ancho-verde-claro-10-unidades-pri12819vc', 'PRISA - Lomo Archivador Adetec Adhesivo Ancho Verde Claro 10 Unidades', 896, 761.6, 6, 143, '/products/PRI12819VC.jpg', cat_id, false, true, 'PRI12819VC', 'PRISA', 'CAJA', '', '', 715, 181)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BLOCK DIBUJO G-99 IMAGIA 9914', 'block-dibujo-g-99-imagia-9914-tor17875', 'TORRE - BLOCK DIBUJO G-99 IMAGIA 9914', 3313, 2816.05, 6, 35, '/products/TOR17875.jpg', cat_id, false, true, 'TOR17875', 'TORRE', 'UN', '', '', 2905, 408)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('RESMA OFICIO EYE CARE 75 GR OFICIO', 'resma-oficio-eye-care-75-gr-oficio-dipeyecare75oficio', 'SIN MARCA - RESMA OFICIO EYE CARE 75 GR OFICIO', 4165, 3540.25, 6, 34, NULL, cat_id, true, true, 'DIPEYECARE75OFICIO', 'SIN MARCA', 'RESMA', '', '75GR', 2990, 1175)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('"NOTAS ADHESIVAS 51 MM. x 38 MM. DE 100 HOJAS, COLORAMARILLO. MARCA REFERENCIA SIMILAR O EQUIVALENT', 'notas-adhesivas-51-mm-x-38-mm-de-100-hojas-coloramarillo-marca-referencia-simila-adiastn125019', 'SELLOFFICE - "NOTAS ADHESIVAS 51 MM. x 38 MM. DE 100 HOJAS, COLORAMARILLO. MARCA REFERENCIA SIMILAR O EQUIVALENT', 1274, 1082.9, 6, 185, '/products/ADIASTN125019.jpg', cat_id, true, true, 'ADIASTN125019', 'SELLOFFICE', 'UN', '', '', 542, 732)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARPETA PIGMENTADA AZUL TORRE', 'carpeta-pigmentada-azul-torre-tor11594', 'TORRE - CARPETA PIGMENTADA AZUL TORRE', 279, 237.15, 6, 460, '/products/TOR11594.jpg', cat_id, false, true, 'TOR11594', 'TORRE', 'UN', '', '', 216, 63)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Papel Fotocopia Office Depot Carta 500 Hojas', 'papel-fotocopia-office-depot-carta-500-hojas-pri15050', 'PRISA - Papel Fotocopia Office Depot Carta 500 Hojas', 3178, 2701.3, 6, 35, '/products/PRI15050.jpg', cat_id, true, true, 'PRI15050', 'PRISA', 'UN', '', '', 2634, 544)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Archivador Rápido Plastificado Azul', 'archivador-rapido-plastificado-azul-pri12262az', 'PRISA - Archivador Rápido Plastificado Azul', 289, 245.65, 6, 300, '/products/PRI12262AZ.jpg', cat_id, false, true, 'PRI12262AZ', 'PRISA', 'UN', '', '', 299, -10)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Taco Halley 9X9 cm Papel Blanco Corriente 500 Hojas', 'taco-halley-9x9-cm-papel-blanco-corriente-500-hojas-pri11001', 'PRISA - Taco Halley 9X9 cm Papel Blanco Corriente 500 Hojas', 1001, 850.85, 6, 108, NULL, cat_id, false, true, 'PRI11001', 'PRISA', 'UN', '9X9', '9X9CM', 801, 200)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Carpeta Colgante Torre Metal Estándar', 'carpeta-colgante-torre-metal-estandar-pri12312', 'TORRE - Carpeta Colgante Torre Metal Estándar', 287, 243.95, 6, 300, '/products/PRI12312.jpg', cat_id, false, true, 'PRI12312', 'TORRE', 'UN', '', '', 269, 18)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Archivador de Palanca tamaño carta Lomo Ancho Premium Wilson Jones', 'archivador-de-palanca-tamano-carta-lomo-ancho-premium-wilson-jones-acb27324', 'ACCO BRANDS - Archivador de Palanca tamaño carta Lomo Ancho Premium Wilson Jones', 1380, 1173.0, 6, 60, '/products/ACB27324.jpg', cat_id, false, true, 'ACB27324', 'ACCO BRANDS', 'UN', '', '', 1325, 55)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Papelero Macasi Metálico con Pedal 12 L', 'papelero-macasi-metalico-con-pedal-12-l-pri89707', 'PRISA - Papelero Macasi Metálico con Pedal 12 L', 28614, 24321.9, 6, 3, '/products/PRI89707.jpg', cat_id, true, true, 'PRI89707', 'PRISA', 'UN', '', '12L', 24322, 4292)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BLOCK PREPICADO MATEMATICAS 80 HJS', 'block-prepicado-matematicas-80-hjs-tor11653', 'TORRE - BLOCK PREPICADO MATEMATICAS 80 HJS', 2000, 1700.0, 6, 60, '/products/TOR11653.jpg', cat_id, true, true, 'TOR11653', 'TORRE', 'UN', '', '', 1130, 870)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('SEPARADOR OFICIO CARTULINA AZ TORRE', 'separador-oficio-cartulina-az-torre-tor31183', 'TORRE - SEPARADOR OFICIO CARTULINA AZ TORRE', 1758, 1494.3, 6, 47, '/products/TOR31183.jpg', cat_id, false, true, 'TOR31183', 'TORRE', 'UN', '', '', 1435, 323)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Separador Carta Buho 6 Divisiones', 'separador-carta-buho-6-divisiones-pri12203', 'PRISA - Separador Carta Buho 6 Divisiones', 182, 154.7, 6, 300, '/products/PRI12203.jpg', cat_id, false, true, 'PRI12203', 'PRISA', 'UN', '', '', 203, -21)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('RESMA OFICIO PIX 75 GRAMOS', 'resma-oficio-pix-75-gramos-dippixoficio75grs', 'SIN MARCA - RESMA OFICIO PIX 75 GRAMOS', 3518, 2990.3, 6, 20, '/products/DIPPIXOFICIO75GRS.jpg', cat_id, true, true, 'DIPPIXOFICIO75GRS', 'SIN MARCA', 'RESMA', '', '', 2990, 528)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARPETA CACCOCLIP CTA. VINIL TRANSP AZUL LAVORO', 'carpeta-caccoclip-cta-vinil-transp-azul-lavoro-pnb468987', 'FULTONS - CARPETA CACCOCLIP CTA. VINIL TRANSP AZUL LAVORO', 448, 380.8, 6, 146, '/products/PNB468987.jpg', cat_id, false, true, 'PNB468987', 'FULTONS', 'UN', '', '', 403.2, 44.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARPETA CARTULINA  PIGMENTADA COLOR AZUL', 'carpeta-cartulina-pigmentada-color-azul-pri10579az', 'PRISA - CARPETA CARTULINA  PIGMENTADA COLOR AZUL', 225, 191.25, 6, 350, '/products/PRI10579AZ.jpg', cat_id, false, true, 'PRI10579AZ', 'PRISA', 'UN', '', '', 166, 59)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cuaderno Empastado Foliado Liso 100 Hojas Cuaderno Empastado Foliado Liso 100 Hojas', 'cuaderno-empastado-foliado-liso-100-hojas-cuaderno-empastado-foliado-liso-100-ho-pri85352', 'PRISA - Cuaderno Empastado Foliado Liso 100 Hojas Cuaderno Empastado Foliado Liso 100 Hojas', 2449, 2081.65, 6, 26, '/products/PRI85352.jpg', cat_id, false, true, 'PRI85352', 'PRISA', 'UN', '', '', 2117, 332)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Carpeta Plastificada Azul', 'carpeta-plastificada-azul-pri12294az', 'PRISA - Carpeta Plastificada Azul', 346, 294.1, 6, 195, '/products/PRI12294AZ.jpg', cat_id, false, true, 'PRI12294AZ', 'PRISA', 'UN', '', '', 277, 69)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Papel mantequilla de 100m X 30cm', 'papel-mantequilla-de-100m-x-30cm-fbrmant100x30', 'SIN MARCA - Papel mantequilla de 100m X 30cm', 15726, 13367.1, 6, 4, '/products/FBRMANT100X30.jpg', cat_id, true, true, 'FBRMANT100X30', 'SIN MARCA', 'UN', '', '', 13184.9, 2541.1)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PACK 5 NOTAS 76X76 100H POP UP 5COL NEON', 'pack-5-notas-76x76-100h-pop-up-5col-neon-pnb542707', 'FULTONS - PACK 5 NOTAS 76X76 100H POP UP 5COL NEON', 579, 492.15, 6, 30, NULL, cat_id, false, true, 'PNB542707', 'FULTONS', 'PACK', '76X76', '', 1666, -1087)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BLOCK COLON UNIVERSIT. MAT 7MM BU-32/80', 'block-colon-universit-mat-7mm-bu-3280-tor11649', 'TORRE - BLOCK COLON UNIVERSIT. MAT 7MM BU-32/80', 909, 772.65, 6, 40, '/products/TOR11649.jpg', cat_id, false, true, 'TOR11649', 'TORRE', 'UN', '', '', 1220, -311)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Libro Actas Rem Max Cuadriculado 200 Hojas', 'libro-actas-rem-max-cuadriculado-200-hojas-pri84459cu', 'PRISA - Libro Actas Rem Max Cuadriculado 200 Hojas', 5838, 4962.3, 6, 10, NULL, cat_id, true, true, 'PRI84459CU', 'PRISA', 'UN', '', '', 4670, 1168)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bombilla Polipapel Negra Envasada 8 mm', 'bombilla-polipapel-negra-envasada-8-mm-akibompolbl3', 'SIN MARCA - Bombilla Polipapel Negra Envasada 8 mm', 35, 29.75, 6, 4800, NULL, cat_id, true, true, 'AKIBOMPOLBL3', 'SIN MARCA', 'UN', '', '', 9.5, 25.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Libro de Actas Auca N 532 - F100 200 Hojas', 'libro-de-actas-auca-n-532-f100-200-hojas-pri30162', 'PRISA - Libro de Actas Auca N 532 - F100 200 Hojas', 4961, 4216.85, 6, 10, NULL, cat_id, false, true, 'PRI30162', 'PRISA', 'UN', '', '', 4488, 473)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('FUNDA CARTA TRANSPARENTE 100 UNIDADES TORRE', 'funda-carta-transparente-100-unidades-torre-tor35285', 'TORRE - FUNDA CARTA TRANSPARENTE 100 UNIDADES TORRE', 2588, 2199.8, 6, 20, '/products/TOR35285.jpg', cat_id, false, true, 'TOR35285', 'TORRE', 'CAJA', '', '', 2200, 388)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cuaderno Universitario Torre Oficio Triple Paisaje Espiral Doble M7 150 Hojas', 'cuaderno-universitario-torre-oficio-triple-paisaje-espiral-doble-m7-150-hojas-pri25111', 'TORRE - Cuaderno Universitario Torre Oficio Triple Paisaje Espiral Doble M7 150 Hojas', 3224, 2740.4, 6, 17, '/products/PRI25111.jpg', cat_id, true, true, 'PRI25111', 'TORRE', 'UN', '', '', 2582, 642)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Carpeta Fuelle Selloffice Oficio 12 Divisiones con Elástico Carpeta Fuelle Selloffice', 'carpeta-fuelle-selloffice-oficio-12-divisiones-con-elastico-carpeta-fuelle-sello-pri45863', 'SELLOFFICE - Carpeta Fuelle Selloffice Oficio 12 Divisiones con Elástico Carpeta Fuelle Selloffice', 3871, 3290.35, 6, 15, '/products/PRI45863.jpg', cat_id, true, true, 'PRI45863', 'SELLOFFICE', 'UN', '', '', 2501, 1370)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TARJETON  OPALINA 220 GR 9 X 21 CM BLANCO 100 UNIDADES', 'tarjeton-opalina-220-gr-9-x-21-cm-blanco-100-unidades-pri82702', 'PRISA - TARJETON  OPALINA 220 GR 9 X 21 CM BLANCO 100 UNIDADES', 3939, 3348.15, 6, 8, NULL, cat_id, false, true, 'PRI82702', 'PRISA', 'CAJA', '9X21', '220GR', 4333, -394)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PAPEL MAGNETICO A4 1 HOJA', 'papel-magnetico-a4-1-hoja-dim524657', 'DIMERC - PAPEL MAGNETICO A4 1 HOJA', 1293, 1099.05, 6, 40, '/products/DIM524657.jpg', cat_id, false, true, 'DIM524657', 'DIMERC', 'UN', '', '', 826, 467)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BLOCK PAPEL ENTRETENIDO 18 HJS TORRE', 'block-papel-entretenido-18-hjs-torre-tor27372', 'TORRE - BLOCK PAPEL ENTRETENIDO 18 HJS TORRE', 1013, 861.05, 6, 45, '/products/TOR27372.jpg', cat_id, false, true, 'TOR27372', 'TORRE', 'UN', '', '', 720, 293)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('FUNDA PLASTICA ADIX OFICIO LOMO BLANCO 100 UNIDADES', 'funda-plastica-adix-oficio-lomo-blanco-100-unidades-pri82806', 'PRISA - FUNDA PLASTICA ADIX OFICIO LOMO BLANCO 100 UNIDADES', 2525, 2146.25, 6, 15, '/products/PRI82806.jpg', cat_id, false, true, 'PRI82806', 'PRISA', 'CAJA', '', '', 2146, 379)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARPETA PLASTIFICADA AZUL AUCA', 'carpeta-plastificada-azul-auca-tor27911', 'TORRE - CARPETA PLASTIFICADA AZUL AUCA', 582, 494.7, 6, 93, '/products/TOR27911.jpg', cat_id, false, true, 'TOR27911', 'TORRE', 'UN', '', '', 345, 237)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Saco de Papel Kraft grueso de 1 kilo', 'saco-de-papel-kraft-grueso-de-1-kilo-akisac100', 'SIN MARCA - Saco de Papel Kraft grueso de 1 kilo', 10, 8.5, 6, 4000, NULL, cat_id, true, true, 'AKISAC100', 'SIN MARCA', 'UN', '', '', 8, 2)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BOLSON CARTULINA METALICA TORRE IMAGIA', 'bolson-cartulina-metalica-torre-imagia-tor22568', 'TORRE - BOLSON CARTULINA METALICA TORRE IMAGIA', 1370, 1164.5, 6, 32, '/products/TOR22568.jpg', cat_id, false, true, 'TOR22568', 'TORRE', 'BOLSA', '', '', 970, 400)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Archivador Oficio Colón Ancho Azul', 'archivador-oficio-colon-ancho-azul-pri25627az', 'PRISA - Archivador Oficio Colón Ancho Azul', 2222, 1888.7, 6, 15, '/products/PRI25627AZ.jpg', cat_id, false, true, 'PRI25627AZ', 'PRISA', 'UN', '', '', 2051, 171)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PAPEL AUTOADHESIVO OPACO 80G TAMAÑO OFICIO 100 UNID SINCORTE', 'papel-autoadhesivo-opaco-80g-tamano-oficio-100-unid-sincorte-melipapel80gr', 'SIN MARCA - PAPEL AUTOADHESIVO OPACO 80G TAMAÑO OFICIO 100 UNID SINCORTE', 9894, 8409.9, 6, 3, '/products/MELIPAPEL80GR.jpg', cat_id, true, true, 'MELIPAPEL80GR', 'SIN MARCA', 'UN', '', '80G', 8990, 904)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BLOCK MATEMÁTICAS OFICIO 7 MM PREPICADO, 80 HOJAS BLANCAS', 'block-matematicas-oficio-7-mm-prepicado-80-hojas-blancas-tor22464', 'TORRE - BLOCK MATEMÁTICAS OFICIO 7 MM PREPICADO, 80 HOJAS BLANCAS', 2164, 1839.4, 6, 25, '/products/TOR22464.jpg', cat_id, true, true, 'TOR22464', 'TORRE', 'UN', '', '', 930, 1234)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Croquera Proarte 22X27 cm 100', 'croquera-proarte-22x27-cm-100-pri17079', 'PRISA - Croquera Proarte 22X27 cm 100', 4885, 4152.25, 6, 8, '/products/PRI17079.jpg', cat_id, true, true, 'PRI17079', 'PRISA', 'UN', '22X27', '22X27CM', 2882, 2003)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Carpeta Plastificada Verde Oscuro', 'carpeta-plastificada-verde-oscuro-pri12294ve', 'PRISA - Carpeta Plastificada Verde Oscuro', 346, 294.1, 6, 82, '/products/PRI12294VE.jpg', cat_id, false, true, 'PRI12294VE', 'PRISA', 'UN', '', '', 277, 69)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BLOCK DIBUJO N99 18 ROSS 10 HOJAS', 'block-dibujo-n99-18-ross-10-hojas-prid558549', 'PRISA - BLOCK DIBUJO N99 18 ROSS 10 HOJAS', 892, 758.2, 6, 31, '/products/PRID558549.jpg', cat_id, false, true, 'PRID558549', 'PRISA', 'UN', '', '', 701, 191)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('SEPARADOR OFICIO CARTULINA 6 POS TORRE COLORES', 'separador-oficio-cartulina-6-pos-torre-colores-tor30662', 'TORRE - SEPARADOR OFICIO CARTULINA 6 POS TORRE COLORES', 1085, 922.25, 6, 39, '/products/TOR30662.jpg', cat_id, true, true, 'TOR30662', 'TORRE', 'UN', '', '', 545, 540)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Resma Papel Fotocopia Report Premium Carta 500 Hojas', 'resma-papel-fotocopia-report-premium-carta-500-hojas-pri11380', 'PRISA - Resma Papel Fotocopia Report Premium Carta 500 Hojas', 3831, 3256.35, 6, 8, '/products/PRI11380.jpg', cat_id, true, true, 'PRI11380', 'PRISA', 'RESMA', '', '', 2590, 1241)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Bowl 500cc Polipapel PLA Kraft Imp. Generico  (6x50)', 'bowl-500cc-polipapel-pla-kraft-imp-generico-6x50-fophl-sbplafk500', 'FOODPACK - Bowl 500cc Polipapel PLA Kraft Imp. Generico  (6x50)', 133, 113.05, 6, 200, '/products/FOPHL-SBPLAFK500.jpg', cat_id, false, true, 'FOPHL-SBPLAFK500', 'FOODPACK', 'UN', '6X50', '500CC', 97.2, 35.8)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Archivador de Palanca tamaño Oficio Lomo Ancho Premium', 'archivador-de-palanca-tamano-oficio-lomo-ancho-premium-acb27014', 'ACCO BRANDS - Archivador de Palanca tamaño Oficio Lomo Ancho Premium', 1511, 1284.35, 6, 14, '/products/ACB27014.jpg', cat_id, false, true, 'ACB27014', 'ACCO BRANDS', 'UN', '', '', 1325, 186)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CAJA DE PAPEL FOTOGRAFICO ADHESIVO, 20 HOJAS TAMAÑO A4, 120G', 'caja-de-papel-fotografico-adhesivo-20-hojas-tamano-a4-120g-dimu469563', 'DIMERC - CAJA DE PAPEL FOTOGRAFICO ADHESIVO, 20 HOJAS TAMAÑO A4, 120G', 12870, 10939.5, 6, 2, '/products/DIMU469563.jpg', cat_id, true, true, 'DIMU469563', 'DIMERC', 'UN', '', '120G', 8580, 4290)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARPETA CACCOCLIP CTA. VINIL TRANSP NEGRA LAVORO', 'carpeta-caccoclip-cta-vinil-transp-negra-lavoro-pnb463562', 'FULTONS - CARPETA CACCOCLIP CTA. VINIL TRANSP NEGRA LAVORO', 349, 296.65, 6, 47, '/products/PNB463562.jpg', cat_id, false, true, 'PNB463562', 'FULTONS', 'UN', '', '', 339, 10)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Archivador Rápido Plastificado Gris Archivador Rápido Plastificado Gris', 'archivador-rapido-plastificado-gris-archivador-rapido-plastificado-gris-pri12262gr', 'PRISA - Archivador Rápido Plastificado Gris Archivador Rápido Plastificado Gris', 374, 317.9, 6, 50, '/products/PRI12262GR.jpg', cat_id, false, true, 'PRI12262GR', 'PRISA', 'UN', '', '', 299, 75)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('SEPARADOR DE CARTULINA 6 DIV. CARTA (25-100)', 'separador-de-cartulina-6-div-carta-25-100-jmisepahol005', 'BEIFA - SEPARADOR DE CARTULINA 6 DIV. CARTA (25-100)', 667, 566.95, 6, 33, '/products/JMISEPAHOL005.jpg', cat_id, false, true, 'JMISEPAHOL005', 'BEIFA', 'UN', '', '', 445.5, 221.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PAPEL FOTOGRAFICO GLOSSY A4 180 GR 20 HOJAS', 'papel-fotografico-glossy-a4-180-gr-20-hojas-dim507709', 'DIMERC - PAPEL FOTOGRAFICO GLOSSY A4 180 GR 20 HOJAS', 2300, 1955.0, 6, 12, '/products/DIM507709.jpg', cat_id, true, true, 'DIM507709', 'DIMERC', 'UN', '', '180GR', 1195, 1105)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tabla Apretapapel Torre Oficio Diseños', 'tabla-apretapapel-torre-oficio-disenos-pri33026', 'TORRE - Tabla Apretapapel Torre Oficio Diseños', 3143, 2671.55, 6, 6, '/products/PRI33026.jpg', cat_id, true, true, 'PRI33026', 'TORRE', 'UN', '', '', 2262, 881)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Block Prepicado Colon M7 Carta Perforado', 'block-prepicado-colon-m7-carta-perforado-pri11418m7', 'PRISA - Block Prepicado Colon M7 Carta Perforado', 1666, 1416.1, 6, 10, '/products/PRI11418M7.jpg', cat_id, false, true, 'PRI11418M7', 'PRISA', 'UN', '', '', 1323, 343)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Saco de Papel Kraft grueso de 2 kilos', 'saco-de-papel-kraft-grueso-de-2-kilos-akisac200', 'SIN MARCA - Saco de Papel Kraft grueso de 2 kilos', 16, 13.6, 6, 1000, NULL, cat_id, true, true, 'AKISAC200', 'SIN MARCA', 'UN', '', '', 13, 3)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Block Artel Milimetrado A4 2129.7 cm 12 Hojas', 'block-artel-milimetrado-a4-21297-cm-12-hojas-pri45154', 'ARTEL - Block Artel Milimetrado A4 2129.7 cm 12 Hojas', 1109, 942.65, 6, 10, '/products/PRI45154.jpg', cat_id, false, true, 'PRI45154', 'ARTEL', 'UN', '', '', 1132, -23)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Archivador tamaño Carta, 2 Aros, Color Blanco, Ancho 1,5, Capacidad 370 Hojas', 'archivador-tamano-carta-2-aros-color-blanco-ancho-15-capacidad-370-hojas-acb15263', 'ACCO BRANDS - Archivador tamaño Carta, 2 Aros, Color Blanco, Ancho 1,5, Capacidad 370 Hojas', 2101, 1785.85, 6, 6, '/products/ACB15263.jpg', cat_id, false, true, 'ACB15263', 'ACCO BRANDS', 'UN', '', '', 1786, 315)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('LIBRO ACTAS AUCA CUADRICULADO 100 HJS', 'libro-actas-auca-cuadriculado-100-hjs-tor28968', 'TORRE - LIBRO ACTAS AUCA CUADRICULADO 100 HJS', 3868, 3287.8, 6, 4, '/products/TOR28968.jpg', cat_id, true, true, 'TOR28968', 'TORRE', 'UN', '', '', 2465, 1403)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PAPEL FOTOGRAFICO ADHESIVO A4 200GR LAVORO', 'papel-fotografico-adhesivo-a4-200gr-lavoro-pnb469563', 'FULTONS - PAPEL FOTOGRAFICO ADHESIVO A4 200GR LAVORO', 2224, 1890.4, 6, 5, '/products/PNB469563.jpg', cat_id, false, true, 'PNB469563', 'FULTONS', 'UN', '', '200GR', 1890, 334)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Carpeta Cartulina Halley Pigmentada Verde Claro', 'carpeta-cartulina-halley-pigmentada-verde-claro-pri10579ve', 'PRISA - Carpeta Cartulina Halley Pigmentada Verde Claro', 228, 193.8, 6, 50, '/products/PRI10579VE.jpg', cat_id, false, true, 'PRI10579VE', 'PRISA', 'UN', '', '', 166, 62)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARPETA CPAPEL ENTRETENIDO 24 X 32 CMS 9 HJS. 18 DISEÑOS FULTONS', 'carpeta-cpapel-entretenido-24-x-32-cms-9-hjs-18-disenos-fultons-pnb408593', 'FULTONS - CARPETA CPAPEL ENTRETENIDO 24 X 32 CMS 9 HJS. 18 DISEÑOS FULTONS', 1265, 1075.25, 6, 6, '/products/PNB408593.jpg', cat_id, false, true, 'PNB408593', 'FULTONS', 'UN', '24X32', '24X32CM', 990, 275)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PLIEGO DE PAPEL CRAFT 100CMX80CM PARA ENVOLVER', 'pliego-de-papel-craft-100cmx80cm-para-envolver-dipkr-kr-res-070-ird-0007', 'SIN MARCA - PLIEGO DE PAPEL CRAFT 100CMX80CM PARA ENVOLVER', 118, 100.3, 6, 50, NULL, cat_id, false, true, 'DIPKR-KR-RES-070-IRD-0007', 'SIN MARCA', 'UN', '', '', 98, 20)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Carpeta Cartulina Halley Pigmentada Naranjo', 'carpeta-cartulina-halley-pigmentada-naranjo-pri10579nj', 'PRISA - Carpeta Cartulina Halley Pigmentada Naranjo', 228, 193.8, 6, 29, '/products/PRI10579NJ.jpg', cat_id, false, true, 'PRI10579NJ', 'PRISA', 'UN', '', '', 166, 62)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('TACO POST IT NEON 75x75MM 4 COL 100HJS', 'taco-post-it-neon-75x75mm-4-col-100hjs-jmitacohol009', 'BEIFA - TACO POST IT NEON 75x75MM 4 COL 100HJS', 1259, 1070.15, 6, 12, NULL, cat_id, true, true, 'JMITACOHOL009', 'BEIFA', 'UN', '75X75', '', 398, 861)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Carpeta Cartulina Halley Pigmentada Rojo', 'carpeta-cartulina-halley-pigmentada-rojo-pri10579rj', 'PRISA - Carpeta Cartulina Halley Pigmentada Rojo', 228, 193.8, 6, 28, '/products/PRI10579RJ.jpg', cat_id, false, true, 'PRI10579RJ', 'PRISA', 'UN', '', '', 166, 62)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tabla Apretapapel Trupan de Madera Oficio', 'tabla-apretapapel-trupan-de-madera-oficio-pri44796', 'PRISA - Tabla Apretapapel Trupan de Madera Oficio', 1635, 1389.75, 6, 4, NULL, cat_id, true, true, 'PRI44796', 'PRISA', 'UN', '', '', 1078, 557)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARPETAS FAST TRANSPARENTE CON ACCOCLIP OFICIO', 'carpetas-fast-transparente-con-accoclip-oficio-pnb100661', 'FULTONS - CARPETAS FAST TRANSPARENTE CON ACCOCLIP OFICIO', 288, 244.8, 6, 14, '/products/PNB100661.jpg', cat_id, false, true, 'PNB100661', 'FULTONS', 'UN', '', '', 299, -11)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Carpeta Cartulina Halley Pigmentada Verde Oscuro', 'carpeta-cartulina-halley-pigmentada-verde-oscuro-pri10579vo', 'PRISA - Carpeta Cartulina Halley Pigmentada Verde Oscuro', 228, 193.8, 6, 25, '/products/PRI10579VO.jpg', cat_id, false, true, 'PRI10579VO', 'PRISA', 'UN', '', '', 166, 62)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PAPEL SEDA AZUL BANDERA 22 GRS 50X75', 'papel-seda-azul-bandera-22-grs-50x75-pnb505766', 'FULTONS - PAPEL SEDA AZUL BANDERA 22 GRS 50X75', 48, 40.8, 6, 100, '/products/PNB505766.jpg', cat_id, false, true, 'PNB505766', 'FULTONS', 'UN', '50X75', '22GRS', 39, 9)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PAPEL SEDA ROJO BANDERA 22 GRS 50X75', 'papel-seda-rojo-bandera-22-grs-50x75-pnb505768', 'FULTONS - PAPEL SEDA ROJO BANDERA 22 GRS 50X75', 48, 40.8, 6, 100, '/products/PNB505768.jpg', cat_id, false, true, 'PNB505768', 'FULTONS', 'UN', '50X75', '22GRS', 39, 9)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Archivador Rápido Plastificado Verde Oscuro Archivador Rápido Plastificado Verde Oscuro', 'archivador-rapido-plastificado-verde-oscuro-archivador-rapido-plastificado-verde-pri12262ve', 'PRISA - Archivador Rápido Plastificado Verde Oscuro Archivador Rápido Plastificado Verde Oscuro', 308, 261.8, 6, 12, '/products/PRI12262VE.jpg', cat_id, false, true, 'PRI12262VE', 'PRISA', 'UN', '', '', 299, 9)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Tabla Apretapapel DWilliams Oficio Madera', 'tabla-apretapapel-dwilliams-oficio-madera-pri75214', 'PRISA - Tabla Apretapapel DWilliams Oficio Madera', 2288, 1944.8, 6, 2, NULL, cat_id, true, true, 'PRI75214', 'PRISA', 'UN', '', '', 1784, 504)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARPETA PLASTIFICADA AUCA CELESTE AUCA', 'carpeta-plastificada-auca-celeste-auca-tor27912', 'TORRE - CARPETA PLASTIFICADA AUCA CELESTE AUCA', 326, 277.1, 6, 10, '/products/TOR27912.jpg', cat_id, false, true, 'TOR27912', 'TORRE', 'UN', '', '', 345, -19)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('ARCHIVADOR PLASTIFICADO TORRE AZUL CACCOCLIP', 'archivador-plastificado-torre-azul-caccoclip-tor11765', 'TORRE - ARCHIVADOR PLASTIFICADO TORRE AZUL CACCOCLIP', 326, 277.1, 6, 6, '/products/TOR11765.jpg', cat_id, false, true, 'TOR11765', 'TORRE', 'UN', '', '', 565, -239)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('SEPARADOR TORRE CARTA MULTICOLOR 6 POSICIONES DE 4 ANILLOS UD', 'separador-torre-carta-multicolor-6-posiciones-de-4-anillos-ud-pri83913', 'TORRE - SEPARADOR TORRE CARTA MULTICOLOR 6 POSICIONES DE 4 ANILLOS UD', 506, 430.1, 6, 7, '/products/PRI83913.jpg', cat_id, false, true, 'PRI83913', 'TORRE', 'UN', '', '', 480, 26)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARPETA C/ACCOCLIP OF. VINIL NEGRO FULTONS', 'carpeta-caccoclip-of-vinil-negro-fultons-pnb100641', 'FULTONS - CARPETA C/ACCOCLIP OF. VINIL NEGRO FULTONS', 904, 768.4, 6, 11, '/products/PNB100641.jpg', cat_id, true, true, 'PNB100641', 'FULTONS', 'UN', '', '', 299, 605)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Carpeta Cartulina Halley Pigmentada Amarilla', 'carpeta-cartulina-halley-pigmentada-amarilla-pri10579am', 'PRISA - Carpeta Cartulina Halley Pigmentada Amarilla', 228, 193.8, 6, 7, '/products/PRI10579AM.jpg', cat_id, false, true, 'PRI10579AM', 'PRISA', 'UN', '', '', 166, 62)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Archivador Plastificado Auca Azul', 'archivador-plastificado-auca-azul-pri36538az', 'PRISA - Archivador Plastificado Auca Azul', 308, 261.8, 6, 2, '/products/PRI36538AZ.jpg', cat_id, false, true, 'PRI36538AZ', 'PRISA', 'UN', '', '', 470, -162)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Cartulina Opalina Diazol Carta Gofrada Blanco 100 Hojas', 'cartulina-opalina-diazol-carta-gofrada-blanco-100-hojas-pri86921', 'DIAZOL - Cartulina Opalina Diazol Carta Gofrada Blanco 100 Hojas', 122, 103.7, 6, 7, '/products/PRI86921.jpg', cat_id, false, true, 'PRI86921', 'DIAZOL', 'UN', '', '', 99.9, 22.1)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Archivador Rápido Plastificado Amarillo', 'archivador-rapido-plastificado-amarillo-pri12262am', 'PRISA - Archivador Rápido Plastificado Amarillo', 290, 246.5, 6, 2, '/products/PRI12262AM.jpg', cat_id, false, true, 'PRI12262AM', 'PRISA', 'UN', '', '', 299, -9)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Carpeta Plastificada Amarilla', 'carpeta-plastificada-amarilla-pri12294am', 'PRISA - Carpeta Plastificada Amarilla', 308, 261.8, 6, 2, '/products/PRI12294AM.jpg', cat_id, false, true, 'PRI12294AM', 'PRISA', 'UN', '', '', 299, 9)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Carpeta Plastificada Celeste', 'carpeta-plastificada-celeste-pri12294ce', 'PRISA - Carpeta Plastificada Celeste', 346, 294.1, 6, 2, '/products/PRI12294CE.jpg', cat_id, false, true, 'PRI12294CE', 'PRISA', 'UN', '', '', 277, 69)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Carpeta Plastificada Rojo', 'carpeta-plastificada-rojo-pri12294rj', 'PRISA - Carpeta Plastificada Rojo', 346, 294.1, 6, 2, '/products/PRI12294RJ.jpg', cat_id, false, true, 'PRI12294RJ', 'PRISA', 'UN', '', '', 277, 69)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Carpeta Cartulina Halley Pigmentada Fucsia', 'carpeta-cartulina-halley-pigmentada-fucsia-pri10579fu', 'PRISA - Carpeta Cartulina Halley Pigmentada Fucsia', 225, 191.25, 6, 3, '/products/PRI10579FU.jpg', cat_id, false, true, 'PRI10579FU', 'PRISA', 'UN', '', '', 166, 59)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('REGLA METALICA 50 CM. C/FUNDA REF.SR92050 (12-300)', 'regla-metalica-50-cm-cfunda-refsr92050-12-300-jmireglhai002', 'BEIFA - REGLA METALICA 50 CM. C/FUNDA REF.SR92050 (12-300)', 1433, 1218.05, 6, 1, '/products/JMIREGLHAI002.jpg', cat_id, true, true, 'JMIREGLHAI002', 'BEIFA', 'UN', '', '', 488, 945)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Funda Transparente Carta 100 un, Selloffice', 'funda-transparente-carta-100-un-selloffice-adiafnd106002', 'SELLOFFICE - Funda Transparente Carta 100 un, Selloffice', 5044, 4287.4, 6, 20, '/products/ADIAFND106002.jpg', cat_id, false, true, 'ADIAFND106002', 'SELLOFFICE', 'CAJA', '', '', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('RESMA EPAPER CARTA 75GR X 500', 'resma-epaper-carta-75gr-x-500-epaper75carta', 'SIN MARCA - RESMA EPAPER CARTA 75GR X 500', 3517, 2989.45, 6, 36, '/products/EPAPER75CARTA.jpg', cat_id, false, true, 'EPAPER75CARTA', 'SIN MARCA', 'RESMA', '', '75GR', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'papeleria' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CARTULINA PINTADA AZUL 50X70CM 150GR', 'cartulina-pintada-azul-50x70cm-150gr-jmicartchi079', 'BEIFA - CARTULINA PINTADA AZUL 50X70CM 150GR', 14, 11.9, 6, 111, '/products/JMICARTCHI079.jpg', cat_id, false, true, 'JMICARTCHI079', 'BEIFA', 'UN', '50X70', '150GR', 0, 0)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'tecnologia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PILA DURACELL ALCALINA AAA 1 UNIDAD', 'pila-duracell-alcalina-aaa-1-unidad-pri92430x1', 'PRISA - PILA DURACELL ALCALINA AAA 1 UNIDAD', 1171, 995.35, 6, 84, '/products/PRI92430X1.jpg', cat_id, false, true, 'PRI92430X1', 'PRISA', 'UN', '', '', 1259, -88)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'tecnologia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Pendrive Maxell Flix 8 GB USB 2.0 Pendrive Maxell Flix 8 GB USB 2.0', 'pendrive-maxell-flix-8-gb-usb-20-pendrive-maxell-flix-8-gb-usb-20-pri76622', 'PRISA - Pendrive Maxell Flix 8 GB USB 2.0 Pendrive Maxell Flix 8 GB USB 2.0', 2805, 2384.25, 6, 30, NULL, cat_id, false, true, 'PRI76622', 'PRISA', 'UN', '', '', 3354, -549)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'tecnologia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Mouse For Life NEGRO inalámbrico', 'mouse-for-life-negro-inalambrico-acb27105', 'ACCO BRANDS - Mouse For Life NEGRO inalámbrico', 10966, 9321.1, 6, 8, '/products/ACB27105.jpg', cat_id, true, true, 'ACB27105', 'ACCO BRANDS', 'UN', '', '', 7884, 3082)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'tecnologia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('CALCULADORA CIENTIFICA 10 DIGITOS PILAS 136 FUNCIONES', 'calculadora-cientifica-10-digitos-pilas-136-funciones-acb70007', 'ACCO BRANDS - CALCULADORA CIENTIFICA 10 DIGITOS PILAS 136 FUNCIONES', 1815, 1542.75, 6, 24, '/products/ACB70007.jpg', cat_id, false, true, 'ACB70007', 'ACCO BRANDS', 'UN', '', '', 1543, 272)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'tecnologia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('BATERIA RECARGABLE  DE 9V', 'bateria-recargable-de-9v-spdna0000046839', 'SIN MARCA - BATERIA RECARGABLE  DE 9V', 6561, 5576.85, 6, 10, '/products/SPDNA0000046839.jpg', cat_id, true, true, 'SPDNA0000046839', 'SIN MARCA', 'UN', '', '', 2944, 3617)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'tecnologia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Pila Alcalina Maxell D Grande Blíster de 2 Unidades', 'pila-alcalina-maxell-d-grande-blister-de-2-unidades-pri24420', 'PRISA - Pila Alcalina Maxell D Grande Blíster de 2 Unidades', 1313, 1116.05, 6, 22, '/products/PRI24420.jpg', cat_id, false, true, 'PRI24420', 'PRISA', 'CAJA', '', '', 1128, 185)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'tecnologia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PILA GRANDE ALCAINA WESTINGHOUSE D', 'pila-grande-alcaina-westinghouse-d-dim499239', 'DIMERC - PILA GRANDE ALCAINA WESTINGHOUSE D', 1608, 1366.8, 6, 24, '/products/DIM499239.jpg', cat_id, true, true, 'DIM499239', 'DIMERC', 'UN', '', '', 976.5, 631.5)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'tecnologia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('GRAPADORA CLAVADORA 53/6, 53/8, 53/10, 53/12 LAVORO', 'grapadora-clavadora-536-538-5310-5312-lavoro-pnb507513', 'FULTONS - GRAPADORA CLAVADORA 53/6, 53/8, 53/10, 53/12 LAVORO', 15428, 13113.8, 6, 2, NULL, cat_id, true, true, 'PNB507513', 'FULTONS', 'UN', '', '', 9990, 5438)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'tecnologia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('PILA ALCALINA WESTINGHOUSE C-2', 'pila-alcalina-westinghouse-c-2-dislr14-bp2', 'SIN MARCA - PILA ALCALINA WESTINGHOUSE C-2', 1035, 879.75, 6, 23, '/products/DISLR14-BP2.jpg', cat_id, false, true, 'DISLR14-BP2', 'SIN MARCA', 'UN', '', '', 780, 255)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'tecnologia' LIMIT 1;
  INSERT INTO public.products (name, slug, description, price, wholesale_price, minimum_wholesale_qty, stock, image_url, category_id, featured, active, sku, brand, unit, format, content_info, cost_price, margin)
  VALUES ('Pila Alcalina Maxell Tipo C Blíster de 2 Unidades', 'pila-alcalina-maxell-tipo-c-blister-de-2-unidades-pri24419', 'PRISA - Pila Alcalina Maxell Tipo C Blíster de 2 Unidades', 1035, 879.75, 6, 6, '/products/PRI24419.jpg', cat_id, false, true, 'PRI24419', 'PRISA', 'CAJA', '', '', 976, 59)
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    wholesale_price = EXCLUDED.wholesale_price,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    cost_price = EXCLUDED.cost_price,
    margin = EXCLUDED.margin;

END $$;

-- ------------------------------------------------
-- PASO 4: Política de lectura para admin
-- ------------------------------------------------
-- Permitir lectura de todos los productos al admin (incluso inactivos)
CREATE POLICY IF NOT EXISTS "Admin full access products" ON public.products
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Admin full access categories" ON public.categories
  FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------
-- Verificación
-- ------------------------------------------------
SELECT 'Categorías:', count(*) FROM public.categories;
SELECT 'Productos:', count(*) FROM public.products;
SELECT 'Con imagen:', count(*) FROM public.products WHERE image_url IS NOT NULL;
