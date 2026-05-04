import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

function parseNullableNumber(value: unknown) {
  if (value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePrizePayload(input: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};

  if (typeof input.product_id === 'string') {
    payload.product_id = input.product_id.trim() || null;
  }
  if (typeof input.position === 'number') {
    payload.position = Math.max(1, Math.floor(input.position));
  }
  if (typeof input.title === 'string') {
    payload.title = input.title.trim();
  }
  if (typeof input.description === 'string') {
    payload.description = input.description.trim() || null;
  }
  if (input.declared_value !== undefined) {
    payload.declared_value = parseNullableNumber(input.declared_value);
  }
  if (typeof input.quantity === 'number') {
    payload.quantity = Math.max(1, Math.floor(input.quantity));
  }
  if (typeof input.reserve_stock === 'boolean') {
    payload.reserve_stock = input.reserve_stock;
  }

  return payload;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; prizeId: string } }
) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const payload = normalizePrizePayload(await request.json());
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'Sin cambios para actualizar' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('raffle_prizes')
    .update(payload)
    .eq('id', params.prizeId)
    .eq('raffle_id', params.id)
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
      product:products(id, name, sku, image_url)
    `
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; prizeId: string } }
) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('raffle_prizes')
    .delete()
    .eq('id', params.prizeId)
    .eq('raffle_id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
