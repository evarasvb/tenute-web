import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { toCsv } from '@/lib/csv';

function checkAuth(request: NextRequest) {
  return request.cookies.get('admin_session')?.value === 'authenticated';
}

// Mismas columnas que documenta el importador, para que exportar -> importar
// sea un ciclo cerrado.
const COLUMNS = [
  'name', 'sku', 'barcode', 'price', 'cost_price',
  'stock_ocoa', 'stock_local21', 'brand', 'description', 'image_url', 'active',
] as const;

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const hasImage = searchParams.get('has_image');
  const activeParam = searchParams.get('active');
  const limit = Math.min(parseInt(searchParams.get('limit') || '9999', 10) || 9999, 10000);

  let query = supabase.from('products').select(COLUMNS.join(','));

  if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  if (category) query = query.eq('category_id', category);
  if (brand) query = query.eq('brand', brand);
  if (hasImage === 'true') query = query.not('image_url', 'is', null).neq('image_url', '');
  else if (hasImage === 'false') query = query.or('image_url.is.null,image_url.eq.');
  if (activeParam === 'true') query = query.eq('active', true);
  else if (activeParam === 'false') query = query.eq('active', false);

  query = query.order('name', { ascending: true }).limit(limit);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const records = (data ?? []) as unknown as Array<Record<string, unknown>>;
  const rows = records.map((p) =>
    COLUMNS.map((c) => {
      const v = p[c];
      if (v == null) return '';
      if (typeof v === 'boolean') return v ? 'true' : 'false';
      return v as string | number;
    })
  );

  const csv = toCsv([...COLUMNS], rows);
  const filename = `tenute-productos-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
