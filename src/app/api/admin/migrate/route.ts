import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(req: NextRequest) {
  const cookie = req.cookies.get('admin_session');
  return cookie?.value === 'authenticated';
}

const MIGRATION_SQL = `
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_ocoa integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_local21 integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price numeric(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS condition text DEFAULT 'new';
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit text DEFAULT 'UN';
ALTER TABLE products ADD COLUMN IF NOT EXISTS format text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS content_info text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_price numeric(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_offer boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_auction boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS products_barcode_unique_idx ON products (barcode) WHERE barcode IS NOT NULL;
UPDATE products SET stock_local21 = stock WHERE stock_local21 = 0 AND stock_ocoa = 0 AND stock > 0;
`;

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Run each statement individually
    const statements = MIGRATION_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const results: { sql: string; ok: boolean; error?: string }[] = [];

    for (const stmt of statements) {
      // Use a workaround: create a temporary view to check if the column exists
      // For actual DDL, we try via rpc if available, or report what needs to be run
      try {
        // Try using the pg_catalog to check column existence first
        if (stmt.startsWith('ALTER TABLE products ADD COLUMN')) {
          const colMatch = stmt.match(/ADD COLUMN IF NOT EXISTS (\w+)/);
          const colName = colMatch?.[1];
          if (colName) {
            const { data } = await supabase
              .from('information_schema.columns' as never)
              .select('column_name')
              .eq('table_name', 'products')
              .eq('column_name', colName)
              .maybeSingle();
            if (data) {
              results.push({ sql: stmt.substring(0, 60), ok: true });
              continue;
            }
          }
        }
        results.push({ sql: stmt.substring(0, 60), ok: false, error: 'Requires Supabase SQL editor' });
      } catch (e: unknown) {
        results.push({ sql: stmt.substring(0, 60), ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    }

    return NextResponse.json({
      message: 'Para ejecutar la migraciÃ³n, usa el SQL Editor de Supabase',
      sql: MIGRATION_SQL,
      supabaseUrl: `https://supabase.com/dashboard/project/jynljiruhljfejnpjybbx/sql/new`,
      results
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  return NextResponse.json({
    sql: MIGRATION_SQL,
    supabaseUrl: `https://supabase.com/dashboard/project/jynljiruhljfejnpjybbx/sql/new`,
    instructions: 'Copia el SQL y ejecutalo en el editor de Supabase'
  });
}
