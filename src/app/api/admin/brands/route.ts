import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select('brand')
    .not('brand', 'is', null)
    .neq('brand', '');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const brands = Array.from(new Set(data?.map((d) => d.brand).filter(Boolean))).sort();
  return NextResponse.json(brands);
}
