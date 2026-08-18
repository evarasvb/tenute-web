import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Datos crudos (livianos) para el panel analítico "tipo Power BI".
 * Devuelve una fila por producto activo + un resumen de ventas.
 * El cálculo/filtrado por slicers se hace en el cliente para lograr
 * la interactividad de un tablero BI.
 */
export async function GET(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // --- Catálogo (fuente de datos rica: ~1.4k productos) ---
  const rows: any[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('products')
      .select('name, price, cost_price, stock, stock_ocoa, stock_local21, image_url, is_offer, categories(name)')
      .eq('active', true)
      .range(from, from + PAGE - 1);
    if (error) break;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
  }

  const products = rows.map((p) => {
    const price = Number(p.price) || 0;
    const cost = Number(p.cost_price) || 0;
    const stock = Number(p.stock) || 0;
    // Margen real calculado (la columna `margin` almacenada es poco confiable).
    const margin = price > 0 && cost > 0 ? Math.round(((price - cost) / price) * 1000) / 10 : null;
    return {
      n: p.name as string,
      c: (p.categories as any)?.name || 'Sin categoría',
      price,
      cost,
      stock,
      ocoa: Number(p.stock_ocoa) || 0,
      l21: Number(p.stock_local21) || 0,
      img: p.image_url && String(p.image_url).trim() !== '' ? 1 : 0,
      offer: p.is_offer ? 1 : 0,
      margin,
    };
  });

  // --- Ventas online (tabla orders puede ser pequeña / faltar) ---
  const now = new Date();
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  let sales = {
    revenue30d: 0, orders30d: 0, revenueTotal: 0, ordersTotal: 0,
    monthly: [] as Array<{ ym: string; revenue: number; orders: number }>,
    topSold: [] as Array<{ name: string; qty: number; revenue: number }>,
  };

  try {
    const { data: orders } = await supabase
      .from('orders')
      .select('total, subtotal, status, created_at')
      .neq('status', 'cancelled');
    const os = orders || [];
    const monthMap = new Map<string, { revenue: number; orders: number }>();
    // Semilla de los últimos 6 meses (para que el gráfico tenga eje aunque no haya ventas).
    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
      monthMap.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, { revenue: 0, orders: 0 });
    }
    for (const o of os) {
      const total = Number(o.total || o.subtotal || 0);
      sales.revenueTotal += total;
      sales.ordersTotal += 1;
      const created = o.created_at ? new Date(o.created_at) : null;
      if (created && created >= d30) { sales.revenue30d += total; sales.orders30d += 1; }
      if (created) {
        const ym = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
        if (monthMap.has(ym)) {
          const m = monthMap.get(ym)!;
          m.revenue += total; m.orders += 1;
        }
      }
    }
    sales.monthly = Array.from(monthMap.entries()).map(([ym, v]) => ({ ym, ...v }));
  } catch { /* orders puede no existir */ }

  try {
    const { data: items } = await supabase
      .from('order_items')
      .select('quantity, unit_price, subtotal, products(name)');
    const map = new Map<string, { qty: number; revenue: number }>();
    for (const it of items || []) {
      const name = (it.products as any)?.name || 'Producto';
      const qty = Number(it.quantity) || 0;
      const rev = Number(it.subtotal ?? (Number(it.unit_price) || 0) * qty) || 0;
      const cur = map.get(name) || { qty: 0, revenue: 0 };
      cur.qty += qty; cur.revenue += rev;
      map.set(name, cur);
    }
    sales.topSold = Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  } catch { /* order_items puede no existir */ }

  return NextResponse.json({
    generatedAt: now.toISOString(),
    products,
    sales,
  });
}
