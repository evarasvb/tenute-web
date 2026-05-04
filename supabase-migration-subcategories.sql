-- ==============================================
-- TENUTE — Migración: Subcategorías
-- Ejecutar en: Supabase → SQL Editor
-- ==============================================

-- 1. Agregar columna parent_id a categories (FK self-referencial)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id bigint REFERENCES public.categories(id) ON DELETE SET NULL;

-- 2. Agregar columna subcategory_id a products (FK a categories para subcategoría)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS subcategory_id bigint REFERENCES public.categories(id) ON DELETE SET NULL;

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS products_subcategory_id_idx ON public.products(subcategory_id);

-- 4. Verificar resultado
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('categories', 'products')
  AND column_name IN ('parent_id', 'subcategory_id')
ORDER BY table_name, column_name;
