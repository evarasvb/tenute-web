-- ================================================
-- TENUTE — Migración: Metadata JSONB, Warehouse Stock, Video
-- Ejecutar en: Supabase → SQL Editor (cuando se recupere acceso)
-- ================================================

-- 1. Add metadata JSONB column to products
-- This stores: additional_images, video_url, warehouse_stock, is_active override
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 2. Add dedicated warehouse stock columns (optional, for performance)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_ocoa int NOT NULL DEFAULT 0 CHECK (stock_ocoa >= 0);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_local21 int NOT NULL DEFAULT 0 CHECK (stock_local21 >= 0);

-- 3. Add video_url column
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS video_url text;

-- 4. Add barcode column used by POS scanner
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS barcode text;

-- 5. Enforce uniqueness only when barcode is informed
CREATE UNIQUE INDEX IF NOT EXISTS products_barcode_unique_idx
  ON public.products (barcode)
  WHERE barcode IS NOT NULL;

-- 6. Create a function to keep total stock in sync with warehouse stocks
CREATE OR REPLACE FUNCTION sync_warehouse_stock()
RETURNS trigger AS $$
BEGIN
  NEW.stock := COALESCE(NEW.stock_ocoa, 0) + COALESCE(NEW.stock_local21, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for auto-sync
DROP TRIGGER IF EXISTS trg_sync_warehouse_stock ON public.products;
CREATE TRIGGER trg_sync_warehouse_stock
  BEFORE INSERT OR UPDATE OF stock_ocoa, stock_local21
  ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION sync_warehouse_stock();

-- 8. Create index on metadata for JSONB queries
CREATE INDEX IF NOT EXISTS products_metadata_idx ON public.products USING gin (metadata);

-- 9. Migrate existing stock to local21 (assuming all current stock is at Local 21)
UPDATE public.products
SET stock_local21 = stock, stock_ocoa = 0
WHERE stock > 0 AND stock_local21 = 0 AND stock_ocoa = 0;

-- 10. Update RLS policy to use 'active' column (already exists in schema)
-- The 'active' column already exists, just ensure the policy is correct
DROP POLICY IF EXISTS "Productos activos visibles" ON public.products;
CREATE POLICY "Productos activos visibles" ON public.products
  FOR SELECT USING (active = true);
