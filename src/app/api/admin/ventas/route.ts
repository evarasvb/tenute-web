import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// WAREHOUSE FIELD MAP — canonical mapping: warehouse slug -> DB column
// 'ocoa'    => stock_ocoa   (Bodega Ocoa)
// 'local21' => stock_local21 (Bodega Local 21)
const WAREHOUSE_FIELD: Record<string, 'stock_ocoa' | 'stock_local21'> = {
    ocoa: 'stock_ocoa',
    local21: 'stock_local21',
    // Legacy alias kept for backwards compatibility
    local: 'stock_local21',
};

function checkAuth(req: NextRequest) {
    return req.cookies.get('admin_session')?.value === 'authenticated';
}

export async function GET(request: NextRequest) {
    if (!checkAuth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;
    const supabase = createAdminClient();
    let query = supabase
      .from('manual_sales')
      .select('*, items:manual_sale_items(*, product:products(id,name,sku,image_url))', { count: 'exact' })
      .order('sale_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (search) {
          query = query.or(`sale_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    }
    query = query.range(offset, offset + limit - 1);
    const { data, count, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ sales: data || [], total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) });
}

export async function POST(request: NextRequest) {
    if (!checkAuth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const body = await request.json();
    const { customer_name, customer_phone, customer_rut, sale_date, payment_method, discount, notes, items } = body;

  // --- Input validation ---
  if (!customer_name || typeof customer_name !== 'string' || customer_name.trim() === '') {
        return NextResponse.json({ error: 'Nombre de cliente requerido' }, { status: 400 });
  }
    if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: 'Al menos un item es requerido' }, { status: 400 });
    }
    for (const item of items) {
          const qty = Number(item.quantity);
          const price = Number(item.unit_price);
          if (!Number.isInteger(qty) || qty < 1) {
                  return NextResponse.json({ error: `Cantidad inválida para "${item.product_name || 'item'}"` }, { status: 400 });
          }
          if (!Number.isFinite(price) || price < 0) {
                  return NextResponse.json({ error: `Precio inválido para "${item.product_name || 'item'}"` }, { status: 400 });
          }
    }

  const supabase = createAdminClient();
    const { data: lastSale } = await supabase.from('manual_sales').select('sale_number').order('created_at', { ascending: false }).limit(1).maybeSingle();
    let nextNum = 1;
    if (lastSale?.sale_number) {
          const match = lastSale.sale_number.match(/VM-(\d+)/);
          if (match) nextNum = parseInt(match[1]) + 1;
    }
    const sale_number = `VM-${String(nextNum).padStart(4, '0')}`;
    const subtotal = items.reduce((sum: number, item: { quantity: number; unit_price: number }) => sum + Number(item.quantity) * Number(item.unit_price), 0);
    const cost_total = items.reduce((sum: number, item: { quantity: number; unit_cost: number }) => sum + Number(item.quantity) * (Number(item.unit_cost) || 0), 0);
    const discountAmount = parseFloat(discount) || 0;
    const total = subtotal - discountAmount;

  // --- Stock pre-check (read BEFORE insert to detect insufficient stock) ---
  for (const item of items) {
        if (!item.product_id) continue;
        const warehouseKey = (item.warehouse || 'ocoa') as string;
        const stockField = WAREHOUSE_FIELD[warehouseKey] ?? 'stock_ocoa';
        const { data: product } = await supabase
          .from('products')
          .select(`stock, stock_ocoa, stock_local21, name`)
          .eq('id', item.product_id)
          .single();
        if (!product) continue;
        const available = (product[stockField as keyof typeof product] as number) ?? 0;
        if (available < Number(item.quantity)) {
                return NextResponse.json({
                          error: `Stock insuficiente para "${product.name}" en bodega ${warehouseKey}. Disponible: ${available}`,
                }, { status: 400 });
        }
  }

  const { data: sale, error: saleError } = await supabase.from('manual_sales').insert({
        sale_number, customer_name: customer_name.trim(), customer_phone, customer_rut,
        sale_date: sale_date || new Date().toISOString().split('T')[0],
        payment_method: payment_method || 'transfer', subtotal, discount: discountAmount, total, cost_total, notes, status: 'completed',
  }).select().single();
    if (saleError) return NextResponse.json({ error: saleError.message }, { status: 500 });

  const saleItems = items.map((item: {
        product_id?: string; product_name: string; product_sku?: string; product_image_url?: string;
        quantity: number; unit_price: number; unit_cost?: number; warehouse: string;
  }) => ({
        sale_id: sale.id, product_id: item.product_id || null, product_name: item.product_name,
        product_sku: item.product_sku || null, product_image_url: item.product_image_url || null,
        quantity: Number(item.quantity), unit_price: Number(item.unit_price),
        unit_cost: Number(item.unit_cost) || 0,
        // Normalise: store canonical warehouse slug (ocoa | local21)
        warehouse: WAREHOUSE_FIELD[item.warehouse] ? item.warehouse : 'ocoa',
  }));

  const { error: itemsError } = await supabase.from('manual_sale_items').insert(saleItems);
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

  // --- Decrement stock per warehouse ---
  // NOTE: The DB trigger sync_warehouse_stock auto-updates `stock` when
  // stock_ocoa or stock_local21 changes, so we only update the warehouse column.
  for (const item of items) {
        if (!item.product_id) continue;
        const warehouseKey = (item.warehouse || 'ocoa') as string;
        const stockField = WAREHOUSE_FIELD[warehouseKey] ?? 'stock_ocoa';
        const { data: product } = await supabase
          .from('products')
          .select(`${stockField}`)
          .eq('id', item.product_id)
          .single();
        if (!product) continue;
        const current = (product[stockField as keyof typeof product] as number) ?? 0;
        await supabase.from('products').update({
                [stockField]: Math.max(0, current - Number(item.quantity)),
                updated_at: new Date().toISOString(),
        }).eq('id', item.product_id);
  }

  return NextResponse.json({ sale, success: true }, { status: 201 });
}
