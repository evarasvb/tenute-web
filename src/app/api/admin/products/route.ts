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
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const hasImage = searchParams.get('has_image');
  const activeParam = searchParams.get('active');
  const minCost = searchParams.get('min_cost');
  const maxCost = searchParams.get('max_cost');
  const sortBy = searchParams.get('sort_by') || 'name';
  const sortDir = (searchParams.get('sort_dir') || 'asc') as 'asc' | 'desc';

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Select all columns including new ones (gracefully handles missing columns)
  let query = supabase
    .from('products')
    .select('*, categories(name, slug)', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }
  if (category) {
    query = query.eq('category_id', category);
  }
  if (brand) {
    query = query.eq('brand', brand);
  }
  if (hasImage === 'true') {
    query = query.not('image_url', 'is', null).neq('image_url', '');
  } else if (hasImage === 'false') {
    query = query.or('image_url.is.null,image_url.eq.');
  }
  if (activeParam === 'true') {
    query = query.eq('active', true);
  } else if (activeParam === 'false') {
    query = query.eq('active', false);
  }
  if (minCost) {
    query = query.gte('cost_price', parseInt(minCost));
  }
  if (maxCost) {
    query = query.lte('cost_price', parseInt(maxCost));
  }

  query = query.order(sortBy, { ascending: sortDir === 'asc' });
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count, page, limit });
}

export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('products')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
