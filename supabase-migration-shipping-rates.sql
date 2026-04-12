-- Migration: Update shipping_zones with Starken national rates and new local delivery zones
-- Date: 2026-04-12
--
-- Approach: Instead of a separate shipping_rates table, we store national (Starken)
-- shipping rates in the existing shipping_zones table with zone_type='starken'.
-- This keeps all shipping configuration in one table.

-- ============================================
-- 1. Clear existing shipping zones
-- ============================================
DELETE FROM shipping_zones;

-- ============================================
-- 2. Insert updated local delivery zones
--    Only: La Calera, Hijuelas, La Cruz, Melón, Romeral, Ocoa
--    Removed: Quillota, Nogales, Limache
--    Free delivery for subtotal >= $50,000 CLP (handled in app code)
--    Hijuelas and Ocoa are always free (delivery_cost = 0)
-- ============================================
INSERT INTO shipping_zones (commune_name, zone_type, delivery_cost, estimated_days) VALUES
  ('La Calera', 'local', 3000, '1-2 días hábiles'),
  ('Hijuelas', 'local', 0, 'Mismo día o 1 día hábil'),
  ('La Cruz', 'local', 3000, '1-2 días hábiles'),
  ('Melón', 'local', 3000, '2-3 días hábiles'),
  ('Romeral', 'local', 3000, '2-3 días hábiles'),
  ('Ocoa', 'local', 0, 'Mismo día');

-- ============================================
-- 3. Insert Starken national shipping rates (16 regions of Chile)
--    Rates are referential for packages up to 5kg from Quillota/La Calera area
--    Stored as zone_type='starken' in shipping_zones table
-- ============================================
INSERT INTO shipping_zones (commune_name, zone_type, delivery_cost, estimated_days) VALUES
  ('Arica y Parinacota', 'starken', 9500, '5-7 días hábiles'),
  ('Tarapacá', 'starken', 9500, '5-7 días hábiles'),
  ('Antofagasta', 'starken', 8500, '4-6 días hábiles'),
  ('Atacama', 'starken', 7500, '3-5 días hábiles'),
  ('Coquimbo', 'starken', 6000, '2-4 días hábiles'),
  ('Valparaíso', 'starken', 4500, '1-3 días hábiles'),
  ('Metropolitana', 'starken', 4500, '1-3 días hábiles'),
  ('O''Higgins', 'starken', 5000, '2-3 días hábiles'),
  ('Maule', 'starken', 5500, '2-4 días hábiles'),
  ('Ñuble', 'starken', 6000, '3-4 días hábiles'),
  ('Biobío', 'starken', 6000, '3-4 días hábiles'),
  ('La Araucanía', 'starken', 6500, '3-5 días hábiles'),
  ('Los Ríos', 'starken', 7000, '3-5 días hábiles'),
  ('Los Lagos', 'starken', 7500, '4-6 días hábiles'),
  ('Aysén', 'starken', 12000, '7-10 días hábiles'),
  ('Magallanes', 'starken', 14000, '7-10 días hábiles');

-- ============================================
-- 4. Add notes column to orders if it doesn't exist
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'notes'
  ) THEN
    ALTER TABLE orders ADD COLUMN notes text;
  END IF;
END $$;
