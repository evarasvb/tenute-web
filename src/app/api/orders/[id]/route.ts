import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Try to find by order_number first (e.g. TEN-1001), then by UUID
    const identifier = params.id;
    let query = supabase.from('orders').select('*, items:order_items(*)');

    if (identifier.startsWith('TEN-')) {
      query = query.eq('order_number', identifier);
    } else {
      query = query.eq('id', identifier);
    }

    const { data: order, error } = await query.single();

    if (error || !order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener el pedido' },
      { status: 500 }
    );
  }
}
