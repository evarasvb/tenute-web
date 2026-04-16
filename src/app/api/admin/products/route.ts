import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

function isMissingBarcodeColumnError(message?: string) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    (normalized.includes('barcode') && normalized.includes('does not exist')) ||
    (normalized.includes('barcode') && normalized.includes('schema cache')) ||
    (normalized.includes('barcode') && normalized.includes('could not find'))
  );
}

function normalizeProductPayload(input: Record<string, unknown>) {
  const payload: Record<string, unknown> = { ...input };

  if (payload.stock_local21 == null && payload.stock_local != null) {
    payload.stock_local21 = Number(payload.stock_local) || 0;
  }
  delete payload.stock_local;

  if (typeof payload.barcode === 'string') {
    const barcode = payload.barcode.trim();
    payload.barcode = barcode.length > 0 ? barcode : null;
  }

  return payload;
}

function normalizeProductRow(row: Record<string, unknown>) {
  const stockLocal21 = Number(row.stock_local21 ?? row.stock_local ?? 0) || 0;
  const barcode = typeof row.barcode === 'string' ? row.barcode : null;

  return {
    ...row,
    stock_local21: stockLocal21,
    stock_local: stockLocal21,
    barcode,
  };
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
  const barcode = searchParams.get('barcode') || '';
  const minCost = searchParams.get('min_cost');
  const maxCost = searchParams.get('max_cost');
  const sortBy = searchParams.get('sort_by') || 'name';
  const sortDir = (searchParams.get('sort_dir') || 'asc') as 'asc' | 'desc';

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const executeQuery = async (opts: { includeBarcodeColumn: boolean; barcodeAsSkuFallback: boolean }) => {
    let query = supabase
      .from('products')
      .select('*, categories(name, slug)', { count: 'exact' });

    if (search) {
      const orTerms = [`name.ilike.%${search}%`, `sku.ilike.%${search}%`];
      if (opts.includeBarcodeColumn) orTerms.push(`barcode.ilike.%${search}%`);
      query = query.or(orTerms.join(','));
    }
    if (barcode) {
      query = opts.barcodeAsSkuFallback ? query.eq('sku', barcode) : query.eq('barcode', barcode);
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
    return query;
  };

  let { data, error, count } = await executeQuery({
    includeBarcodeColumn: true,
    barcodeAsSkuFallback: false,
  });

  if (isMissingBarcodeColumnError(error?.message)) {
    const retry = await executeQuery({
      includeBarcodeColumn: false,
      barcodeAsSkuFallback: true,
    });
    data = retry.data;
    error = retry.error;
    count = retry.count;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const normalizedProducts = (data || []).map((row) => normalizeProductRow(row as Record<string, unknown>));

  return NextResponse.json({
    data: normalizedProducts,
    products: normalizedProducts,
    count: count || 0,
    page,
    limit,
  });
}

export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const body = normalizeProductPayload(await request.json());

  let { data, error } = await supabase
    .from('products')
    .insert(body)
    .select()
    .single();

  if (isMissingBarcodeColumnError(error?.message)) {
    delete body.barcode;
    const retry = await supabase
      .from('products')
      .insert(body)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(normalizeProductRow(data as Record<string, unknown>));
}
