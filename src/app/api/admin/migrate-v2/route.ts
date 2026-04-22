import { NextRequest, NextResponse } from 'next/server';

function checkAuth(req: NextRequest) {
  const cookie = req.cookies.get('admin_session');
  return cookie?.value === 'authenticated';
}

const MIGRATION_V2_SQL = `
-- ==============================================================
-- MIGRACIÓN V2: Compras y Ventas Manuales
-- Ejecutar en Supabase SQL Editor
-- ==============================================================

-- Tabla de Compras a proveedores
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_number text UNIQUE NOT NULL,
  supplier_name text NOT NULL,
  supplier_rut text,
  invoice_number text,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('pending','received','cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Items de cada compra
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id uuid NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_sku text,
  quantity integer NOT NULL DEFAULT 1,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  warehouse text NOT NULL DEFAULT 'ocoa' CHECK (warehouse IN ('ocoa','local')),
  created_at timestamptz DEFAULT now()
);

-- Tabla de Ventas Manuales (WhatsApp, teléfono, caja)
CREATE TABLE IF NOT EXISTS public.manual_sales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  customer_rut text,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'transfer' CHECK (payment_method IN ('transfer','cash','flow','whatsapp')),
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  cost_total numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Items de cada venta manual
CREATE TABLE IF NOT EXISTS public.manual_sale_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id uuid NOT NULL REFERENCES public.manual_sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_sku text,
  product_image_url text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  unit_cost numeric(12,2) DEFAULT 0,
  warehouse text NOT NULL DEFAULT 'ocoa' CHECK (warehouse IN ('ocoa','local')),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS (service_role lo bypasea automáticamente)
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_sale_items ENABLE ROW LEVEL SECURITY;
`;

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  return NextResponse.json({
    sql: MIGRATION_V2_SQL,
    supabaseUrl: `https://supabase.com/dashboard/project/jynljiruhljfejnpjybbx/sql/new`,
    instructions: 'Copia el SQL y ejecútalo en el editor de Supabase para habilitar las tablas de Compras y Ventas',
  });
}
