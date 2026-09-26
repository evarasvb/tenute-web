-- ============================================================
-- Tenute: actualizar precios de venta incluyendo IVA (19%)
-- Los precios anteriores (sin IVA) quedan en compare_price
-- para mostrar como precio tachado en el sitio.
-- NO modifica stock ni ningún otro campo.
-- ============================================================

BEGIN;

UPDATE public.products
SET
  -- Guarda precio anterior como referencia (precio tachado / "antes")
  compare_price = CASE
    WHEN compare_price IS NULL OR compare_price = 0 THEN price
    ELSE compare_price
  END,
  -- Aplica IVA 19% y redondea al entero más cercano
  price = CASE
    WHEN price > 0 THEN ROUND(price * 1.19)
    ELSE price
  END
WHERE active = true
  AND price > 0;

-- Resumen de cambios
DO $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.products WHERE active = true AND price > 0;
  RAISE NOTICE 'Precios actualizados con IVA 19%%: % productos', v_count;
END;
$$;

COMMIT;
