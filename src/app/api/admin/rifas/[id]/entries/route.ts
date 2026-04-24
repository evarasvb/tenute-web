import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();

  const { data: entries, error } = await supabase
    .from('raffle_entries')
    .select('id, raffle_id, order_id, customer_name, customer_email, customer_phone, created_at')
    .eq('raffle_id', params.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orderIds = (entries || [])
    .map((entry) => entry.order_id)
    .filter((orderId): orderId is string => typeof orderId === 'string' && orderId.length > 0);

  let ordersById: Record<string, { order_number: string | null; status: string | null; payment_status: string | null }> = {};
  if (orderIds.length > 0) {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_status')
      .in('id', orderIds);

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    ordersById = (orders || []).reduce<Record<string, { order_number: string | null; status: string | null; payment_status: string | null }>>(
      (acc, order) => {
        acc[order.id] = {
          order_number: order.order_number ?? null,
          status: order.status ?? null,
          payment_status: order.payment_status ?? null,
        };
        return acc;
      },
      {}
    );
  }

  const merged = (entries || []).map((entry) => ({
    ...entry,
    order: entry.order_id ? ordersById[entry.order_id] || null : null,
  }));

  return NextResponse.json({
    data: merged,
    summary: {
      total: merged.length,
      with_order: merged.filter((item) => item.order).length,
      without_order: merged.filter((item) => !item.order).length,
    },
  });
}
