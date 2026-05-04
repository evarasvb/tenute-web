import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

function normalizePrizePayload(input: Record<string, unknown>) {
  const quantityRaw = Number(input.quantity ?? 1);
  const positionRaw = Number(input.position ?? 1);
  const declaredValueRaw = Number(input.declared_value ?? 0);
  const productIdValue = String(input.product_id || '').trim();

  return {
    title: String(input.title || '').trim(),
    description: String(input.description || '').trim() || null,
    product_id: productIdValue || null,
    position: Number.isFinite(positionRaw) ? Math.max(1, Math.floor(positionRaw)) : 1,
    quantity: Number.isFinite(quantityRaw) ? Math.max(1, Math.floor(quantityRaw)) : 1,
    reserve_stock: Boolean(input.reserve_stock),
    declared_value: Number.isFinite(declaredValueRaw) ? Math.max(0, declaredValueRaw) : 0,
  };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('raffle_prizes')
    .select(
      `
      id,
      raffle_id,
      product_id,
      position,
      title,
      description,
      declared_value,
      quantity,
      reserve_stock,
      created_at,
      product:products (
        id,
        name,
        sku,
        image_url
      )
    `
    )
    .eq('raffle_id', params.id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const payload = normalizePrizePayload(await request.json());
  if (!payload.title) {
    return NextResponse.json({ error: 'El título del premio es obligatorio' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('raffle_prizes')
    .insert({ ...payload, raffle_id: params.id })
    .select(
      `
      id,
      raffle_id,
      product_id,
      position,
      title,
      description,
      declared_value,
      quantity,
      reserve_stock,
      created_at,
      product:products (
        id,
        name,
        sku,
        image_url
      )
    `
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
