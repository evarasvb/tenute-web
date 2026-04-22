import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated';
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const offset = (page - 1) * limit;
  const supabase = createAdminClient();
  let query = supabase
    .from('purchases')
    .select('*, items:purchase_items(*, product:products(id,name,sku,image_url))', { count: 'exact' })
    .order('purchase_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (search) {
    query = query.or(
      `purchase_number.ilike.%${search}%,supplier_name.ilike.%${search}%,invoice_number.ilike.%${search}%`
    );
  }
  query = query.range(offset, offset + limit - 1);
  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ purchases: data || [], total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const body = await request.json();
  const { supplier_name, supplier_rut, invoice_number, purchase_date, notes, items } = body;
  if (!supplier_name || !items || items.length === 0) {
    return NextResponse.json({ error: 'Proveedor e items son requeridos' }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { data: lastPurchase } = await supabase
    .from('purchases').select('purchase_number').order('created_at', { ascending: false }).limit(1).maybeSingle();
  let nextNum = 1;
  if (lastPurchase?.purchase_number) {
    const match = lastPurchase.purchase_number.match(/OC-(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  const purchase_number = `OC-${String(nextNum).padStart(4, '0')}`;
  const total_amount = items.reduce((sum: number, item: { quantity: number; unit_cost: number }) => sum + item.quantity * item.unit_cost, 0);
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert({ purchase_number, supplier_name, supplier_rut, invoice_number, purchase_date: purchase_date || new Date().toISOString().split('T')[0], total_amount, notes, status: 'received' })
    .select().single();
  if (purchaseError) return NextResponse.json({ error: purchaseError.message }, { status: 500 });
  const purchaseItems = items.map((item: { product_id?: string; product_name: string; product_sku?: string; quantity: number; unit_cost: number; warehouse: string }) => ({
    purchase_id: purchase.id, product_id: item.product_id || null, product_name: item.product_name,
    product_sku: item.product_sku || null, quantity: item.quantity, unit_cost: item.unit_cost, warehouse: item.warehouse || 'ocoa',
  }));
  const { error: itemsError } = await supabase.from('purchase_items').insert(purchaseItems);
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
  for (const item of items) {
    if (!item.product_id) continue;
    const { data: product } = await supabase.from('products').select('stock, stock_ocoa, stock_local21, cost_price').eq('id', item.product_id).single();
    if (!product) continue;
    const stockField = item.warehouse === 'local' ? 'stock_local21' : 'stock_ocoa';
    const currentStock = (product[stockField as keyof typeof product] as number) || 0;
    await supabase.from('products').update({
      [stockField]: currentStock + item.quantity,
      stock: (product.stock || 0) + item.quantity,
      cost_price: item.unit_cost,
      updated_at: new Date().toISOString(),
    }).eq('id', item.product_id);
  }
  return NextResponse.json({ purchase, success: true }, { status: 201 });
}
