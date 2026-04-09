import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get product counts per category
  const { data: counts } = await supabase
    .from('products')
    .select('category_id');

  const countMap: Record<string, number> = {};
  if (counts) {
    counts.forEach((row) => {
      countMap[row.category_id] = (countMap[row.category_id] || 0) + 1;
    });
  }

  const result = categories?.map((cat) => ({
    ...cat,
    product_count: countMap[cat.id] || 0,
  }));

  return NextResponse.json(result);
}
