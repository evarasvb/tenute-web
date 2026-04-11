-- ================================================
-- TENUTE — Migration: Checkout & Order Management
-- Run this in: Supabase → SQL Editor → New Query
-- ================================================

-- 1. Add missing columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_rut text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_commune text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_city text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_region text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_method text DEFAULT 'pickup';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost integer DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal integer DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'whatsapp';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mercadopago_preference_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_notes text;

-- Make customer_id optional (orders now store customer info directly)
ALTER TABLE public.orders ALTER COLUMN customer_id DROP NOT NULL;

-- Update status check constraint to include new statuses
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','paid','preparing','shipped','delivered','cancelled'));

-- Add unique index on order_number
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_idx ON public.orders(order_number);

-- 2. Add missing columns to order_items table
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_name text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_sku text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_image_url text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal integer DEFAULT 0;

-- 3. Create order number sequence
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1001 INCREMENT BY 1;

-- 4. Create function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text AS $$
BEGIN
  RETURN 'TEN-' || nextval('public.order_number_seq')::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to decrement stock
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id text, p_quantity integer)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(stock - p_quantity, 0)
  WHERE id::text = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS Policies for orders (allow public reads, service role writes)
DROP POLICY IF EXISTS "Public can read orders" ON public.orders;
CREATE POLICY "Public can read orders" ON public.orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role manages orders" ON public.orders;
CREATE POLICY "Service role manages orders" ON public.orders
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read order items" ON public.order_items;
CREATE POLICY "Public can read order items" ON public.order_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role manages order items" ON public.order_items;
CREATE POLICY "Service role manages order items" ON public.order_items
  FOR ALL USING (true) WITH CHECK (true);

-- 7. Ensure shipping_zones has public read policy
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Shipping zones readable" ON public.shipping_zones;
CREATE POLICY "Shipping zones readable" ON public.shipping_zones
  FOR SELECT USING (true);

-- 8. Grant execute on functions
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrement_stock(text, integer) TO service_role;
GRANT USAGE ON SEQUENCE public.order_number_seq TO anon, authenticated, service_role;
