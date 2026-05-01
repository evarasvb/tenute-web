import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated';
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const body = await request.json();
  const { title, description, image_url, product_id, position } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'El título del premio es requerido' }, { status: 400 });

  const supabase = createAdminClient();

  // Fix 2: track which stock field was decremented so we can restore it on failure
  let stockField: 'stock_ocoa' | 'stock_local21' | null = null;
  let originalStockValue = 0;

  if (product_id) {
    const { data: product } = await supabase
      .from('products')
      .select('name, image_url, stock_ocoa, stock_local21')
      .eq('id', product_id)
      .single();
    if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    const available = (product.stock_ocoa || 0) + (product.stock_local21 || 0);
    if (available < 1) return NextResponse.json({ error: 'Sin stock disponible para reservar' }, { status: 400 });

    if ((product.stock_ocoa || 0) >= 1) {
      stockField = 'stock_ocoa';
      originalStockValue = product.stock_ocoa;
      await supabase.from('products').update({ stock_ocoa: product.stock_ocoa - 1 }).eq('id', product_id);
    } else {
      stockField = 'stock_local21';
      originalStockValue = product.stock_local21;
      await supabase.from('products').update({ stock_local21: product.stock_local21 - 1 }).eq('id', product_id);
    }
  }

  const { data, error } = await supabase
    .from('rifa_prizes')
    .insert({
      rifa_id: params.id,
      title: title.trim(),
      description: description?.trim() || null,
      image_url: image_url?.trim() || null,
      product_id: product_id || null,
      position: parseInt(position) || 1,
    })
    .select('*, product:products(id,name,sku,image_url)')
    .single();

  if (error) {
    // Fix 2: restore stock if prize insert failed
    if (stockField && product_id) {
      await supabase.from('products').update({ [stockField]: originalStockValue }).eq('id', product_id);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prize: data }, { status: 201 });
}
