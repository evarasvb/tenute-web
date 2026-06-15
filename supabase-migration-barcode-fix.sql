-- ================================================
-- TENUTE — Fix del escáner/carga de códigos de barra
-- Problema: el escaneo/carga arrojaba "producto ya existente"
--           ("Ese barcode ya está asignado a otro producto").
--
-- Causa raíz: el índice único de barcode es parcial (WHERE barcode IS NOT NULL).
--   Una cadena vacía '' NO es NULL, así que dos productos con barcode = ''
--   chocan en el índice y disparan el error de duplicado.
--
-- Ejecutar en: Supabase → SQL Editor
-- ================================================

-- 1) Normalizar los códigos vacíos / con solo espacios a NULL.
UPDATE public.products
SET barcode = NULL
WHERE barcode IS NOT NULL AND btrim(barcode) = '';

-- 2) Recrear el índice único para que ignore explícitamente los vacíos.
DROP INDEX IF EXISTS products_barcode_unique_idx;
CREATE UNIQUE INDEX IF NOT EXISTS products_barcode_unique_idx
  ON public.products (barcode)
  WHERE barcode IS NOT NULL AND barcode <> '';

-- 3) Verificación: no deben quedar barcodes vacíos ni duplicados.
SELECT
  count(*) FILTER (WHERE barcode = '')                                   AS vacios,
  (SELECT count(*) FROM (
     SELECT barcode FROM public.products
     WHERE barcode IS NOT NULL AND barcode <> ''
     GROUP BY barcode HAVING count(*) > 1
   ) d)                                                                  AS barcodes_duplicados
FROM public.products;
