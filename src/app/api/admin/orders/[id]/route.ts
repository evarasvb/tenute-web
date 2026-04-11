import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase';

function checkAuth() {
  const cookieStore = cookies();
  return cookieStore.get('admin_session')?.value === 'authenticated';
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', params.id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const allowedFields = [
      'status',
      'tracking_number',
      'admin_notes',
      'shipping_cost',
      'payment_method',
      'payment_id',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // If status is being updated, also update total if shipping_cost changes
    if (updates.shipping_cost !== undefined) {
      const supabase = createAdminClient();
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('subtotal')
        .eq('id', params.id)
        .single();
      if (currentOrder) {
        updates.total = (currentOrder.subtotal || 0) + (updates.shipping_cost as number);
      }
    }

    updates.updated_at = new Date().toISOString();

    const supabase = createAdminClient();
    const { data: order, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', params.id)
      .select('*, items:order_items(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar el pedido' },
      { status: 500 }
    );
  }
}
