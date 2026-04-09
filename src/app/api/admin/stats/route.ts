import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: products, error } = await supabase
    .from('products')
    .select('id, price, stock, image_url');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = products?.length || 0;
  const withImages = products?.filter(
    (p) => p.image_url && p.image_url.trim() !== ''
  ).length || 0;
  const withoutImages = total - withImages;
  const totalStockValue = products?.reduce(
    (sum, p) => sum + (p.price || 0) * (p.stock || 0),
    0
  ) || 0;

  return NextResponse.json({
    totalProducts: total,
    withImages,
    withoutImages,
    totalStockValue,
  });
}
