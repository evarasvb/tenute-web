import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

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
  if (!customer_name || !items || items.length === 0) {
    return NextResponse.json({ error: 'Cliente e items son requeridos' }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { data: lastSale } = await supabase.from('manual_sales').select('sale_number').order('created_at', { ascending: false }).limit(1).maybeSingle();
  let nextNum = 1;
  if (lastSale?.sale_number) {
    const match = lastSale.sale_number.match(/VM-(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  const sale_number = `VM-${String(nextNum).padStart(4, '0')}`;
  const subtotal = items.reduce((sum: number, item: { quantity: number; unit_price: number }) => sum + item.quantity * item.unit_price, 0);
  const cost_total = items.reduce((sum: number, item: { quantity: number; unit_cost: number }) => sum + item.quantity * (item.unit_cost || 0), 0);
  const discountAmount = parseFloat(discount) || 0;
  const total = subtotal - discountAmount;
  for (const item of items) {
    if (!item.product_id) continue;
    const { data: product } = await supabase.from('products').select('stock, stock_ocoa, stock_local21, name').eq('id', item.product_id).single();
    if (!product) continue;
    const stockField = item.warehouse === 'local' ? 'stock_local21' : 'stock_ocoa';
    const available = (product[stockField as keyof typeof product] as number) || 0;
    if (available < item.quantity) {
      return NextResponse.json({ error: `Stock insuficiente para "${product.name}". Disponible: ${available}` }, { status: 400 });
    }
  }
  const { data: sale, error: saleError } = await supabase.from('manual_sales').insert({
    sale_number, customer_name, customer_phone, customer_rut,
    sale_date: sale_date || new Date().toISOString().split('T')[0],
    payment_method: payment_method || 'transfer', subtotal, discount: discountAmount, total, cost_total, notes, status: 'completed',
  }).select().single();
  if (saleError) return NextResponse.json({ error: saleError.message }, { status: 500 });
  const saleItems = items.map((item: { product_id?: string; product_name: string; product_sku?: string; product_image_url?: string; quantity: number; unit_price: number; unit_cost?: number; warehouse: string }) => ({
    sale_id: sale.id, product_id: item.product_id || null, product_name: item.product_name,
    product_sku: item.product_sku || null, product_image_url: item.product_image_url || null,
    quantity: item.quantity, unit_price: item.unit_price, unit_cost: item.unit_cost || 0, warehouse: item.warehouse || 'ocoa',
  }));
  const { error: itemsError } = await supabase.from('manual_sale_items').insert(saleItems);
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
  for (const item of items) {
    if (!item.product_id) continue;
    const { data: product } = await supabase.from('products').select('stock, stock_ocoa, stock_local21').eq('id', item.product_id).single();
    if (!product) continue;
    const stockField = item.warehouse === 'local' ? 'stock_local21' : 'stock_ocoa';
    const current = (product[stockField as keyof typeof product] as number) || 0;
    await supabase.from('products').update({
      [stockField]: Math.max(0, current - item.quantity),
      stock: Math.max(0, (product.stock || 0) - item.quantity),
      updated_at: new Date().toISOString(),
    }).eq('id', item.product_id);
  }
  return NextResponse.json({ sale, success: true }, { status: 201 });
}
