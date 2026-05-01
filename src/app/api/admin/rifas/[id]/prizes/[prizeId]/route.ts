import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated';
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; prizeId: string } }) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const supabase = createAdminClient();

  const { data: prize } = await supabase
    .from('rifa_prizes')
    .select('product_id')
    .eq('id', params.prizeId)
    .eq('rifa_id', params.id)
    .single();

  if (!prize) return NextResponse.json({ error: 'Premio no encontrado' }, { status: 404 });

  // Restore stock if this was an inventory product
  if (prize.product_id) {
    const { data: product } = await supabase
      .from('products')
      .select('stock_ocoa')
      .eq('id', prize.product_id)
      .single();
    if (product) {
      await supabase.from('products').update({ stock_ocoa: (product.stock_ocoa || 0) + 1 }).eq('id', prize.product_id);
    }
  }

  const { error } = await supabase.from('rifa_prizes').delete().eq('id', params.prizeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
