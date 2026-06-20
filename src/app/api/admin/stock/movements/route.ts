import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated';
}

interface MovementInput {
  product_id: string;
  warehouse?: string;
  delta?: number;
  stock_after?: number | null;
  reason?: string;
  note?: string | null;
}

// Lista de movimientos (más recientes primero). Tolera que la tabla no exista aún.
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('product_id');
  const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10) || 200, 1000);

  let query = supabase
    .from('stock_movements')
    .select('id, product_id, warehouse, delta, stock_after, reason, note, created_at, products(name, sku, barcode)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (productId) query = query.eq('product_id', productId);

  const { data, error } = await query;
  if (error) {
    // Tabla inexistente u otro problema: devolver vacío para no romper la UI.
    return NextResponse.json({ movements: [], available: false, error: error.message });
  }
  return NextResponse.json({ movements: data ?? [], available: true });
}

// Registra uno o varios movimientos. Best-effort: nunca rompe el flujo de stock.
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const raw: MovementInput[] = Array.isArray(body?.movements) ? body.movements : [];
  const rows = raw
    .filter((m) => m && typeof m.product_id === 'string' && m.product_id)
    .filter((m) => Number(m.delta) !== 0 || m.reason === 'inventario')
    .map((m) => ({
      product_id: m.product_id,
      warehouse: m.warehouse ?? null,
      delta: Math.trunc(Number(m.delta) || 0),
      stock_after: m.stock_after == null ? null : Math.trunc(Number(m.stock_after)),
      reason: m.reason ?? 'ajuste',
      note: m.note ?? null,
      created_by: 'admin',
    }));

  if (rows.length === 0) return NextResponse.json({ ok: true, inserted: 0 });

  const supabase = createAdminClient();
  const { error } = await supabase.from('stock_movements').insert(rows);
  if (error) {
    // Sin tabla todavía: no es fatal.
    return NextResponse.json({ ok: false, inserted: 0, available: false, error: error.message });
  }
  return NextResponse.json({ ok: true, inserted: rows.length });
}
