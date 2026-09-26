import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import pLimit from 'p-limit';

// Sincronización diaria de precios Vanni: reaplica la regla precio = costo × 2,5
// (margen 60% sobre venta, redondeado a la decena) a todos los productos con
// metadata.supplier = 'Vanni'. Evita que un precio se infle o quede desalineado.
// No baja precios "nuevos" de Vanni (no hay API); la lista se sube por el
// importador. Respeta metadata.price_locked = true para no pisar precios manuales.

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorizedCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // sin secreto configurado, abierto (igual que el otro cron)
  return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

const expectedPrice = (cost: number) => Math.max(Math.round((Number(cost) * 2.5) / 10) * 10, 10);

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const rows: Array<{ id: string; cost_price: number | null; price: number | null; metadata: any }> = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('products')
      .select('id, cost_price, price, metadata')
      .filter('metadata->>supplier', 'eq', 'Vanni')
      .gt('cost_price', 0)
      .range(from, from + 999);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    rows.push(...(data as any));
    if (data.length < 1000) break;
  }

  const mismatched = rows.filter((r) => {
    if (r.metadata && typeof r.metadata === 'object' && (r.metadata as any).price_locked) return false;
    const want = expectedPrice(Number(r.cost_price) || 0);
    return want !== Number(r.price);
  });

  const limit = pLimit(5);
  let fixed = 0;
  const errors: string[] = [];
  await Promise.all(
    mismatched.map((r) =>
      limit(async () => {
        const { error } = await supabase
          .from('products')
          .update({ price: expectedPrice(Number(r.cost_price) || 0), margin: 60, updated_at: new Date().toISOString() })
          .eq('id', r.id);
        if (error) errors.push(error.message);
        else fixed++;
      })
    )
  );

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    vanniProducts: rows.length,
    fixed,
    errorCount: errors.length,
    errors: errors.slice(0, 5),
  });
}
