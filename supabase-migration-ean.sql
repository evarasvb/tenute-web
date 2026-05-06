-- ================================================
-- TENUTE — Migración: Agregar campo EAN / código de barras
-- ================================================
-- El EAN (European Article Number) es el estándar internacional
-- de código de barras para productos de consumo.
-- Formatos soportados: EAN-13 (13 dígitos), EAN-8 (8 dígitos),
-- UPC-A (12 dígitos), UPC-E (8 dígitos).
-- Se almacena como texto para preservar ceros iniciales.
--
-- Uso:
--   Ejecutar en Supabase → SQL Editor
-- ================================================

-- 1. Agregar columna ean a la tabla products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS ean text DEFAULT NULL;

-- 2. Comentario descriptivo
COMMENT ON COLUMN public.products.ean IS
  'Código de barras EAN-13, EAN-8, UPC-A o UPC-E del producto. '
  'Se almacena como texto para preservar ceros a la izquierda. '
  'Ejemplos: EAN-13 = "7501234567890", UPC-A = "012345678905".';

-- 3. Índice para búsqueda rápida por EAN (ej. desde lector de código de barras)
CREATE INDEX IF NOT EXISTS products_ean_idx
  ON public.products(ean)
  WHERE ean IS NOT NULL;

-- 4. Índice único parcial: no puede haber dos productos con el mismo EAN
--    (solo aplica cuando ean no es NULL)
CREATE UNIQUE INDEX IF NOT EXISTS products_ean_unique_idx
  ON public.products(ean)
  WHERE ean IS NOT NULL;

-- 5. Verificar resultado
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'products'
  AND column_name  = 'ean';

-- ================================================
-- CÓMO ACTUALIZAR EL EAN DE UN PRODUCTO:
--
--   UPDATE public.products
--   SET ean = '7622210100184'
--   WHERE sku = 'PRI85550';   -- Adhesivo Barra Proarte 36g
--
-- BUSCAR PRODUCTO POR EAN (desde lector de barras):
--
--   SELECT * FROM public.products WHERE ean = '7622210100184';
--
-- ================================================

-- 6. EANs conocidos extraídos de imágenes del catálogo Tenute
--    (poblar los que ya tenemos identificados visualmente)
UPDATE public.products SET ean = '4100017163005'
  WHERE sku = 'PNB287542';   -- ADHESIVO SILICONA LIQUIDA 30 CC (Fultons) — visible en foto del producto
