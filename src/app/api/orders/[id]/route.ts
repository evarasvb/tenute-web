import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const headers = { 'Cache-Control': 'no-store' };
const orderFields = [
  'order_number', 'created_at', 'status', 'customer_name', 'customer_phone',
  'customer_email', 'customer_rut', 'shipping_method', 'shipping_cost',
  'shipping_address', 'shipping_commune', 'shipping_city', 'shipping_region',
  'tracking_number', 'subtotal', 'total',
] as const;
const itemFields = [
  'id', 'product_image_url', 'product_name', 'unit_price', 'quantity', 'subtotal',
] as const;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const notFound = () => NextResponse.json(
    { error: 'Pedido no encontrado' }, { status: 404, headers }
  );

  const identifier = params.id;
  const isOrderNumber = identifier.startsWith('TEN-');
  const token = isOrderNumber ? new URL(request.url).searchParams.get('t') : identifier;
  if (!token || !UUID.test(token)) return notFound();

  try {
    let query = createAdminClient().from('orders').select(
      `${orderFields.join(',')},items:order_items(${itemFields.join(',')})`
    ).eq('id', token);
    if (isOrderNumber) query = query.eq('order_number', identifier);

    const { data: order, error } = await query
      .returns<(Record<string, unknown> & { items: Record<string, unknown>[] })[]>()
      .single();
    if (error || !order) return notFound();

    // Project the response too, so internal fields can never escape this endpoint.
    const publicOrder = Object.fromEntries(orderFields.map((field) => [field, order[field]]));
    publicOrder.items = (order.items ?? []).map((item: Record<string, unknown>) =>
      Object.fromEntries(itemFields.map((field) => [field, item[field]]))
    );
    return NextResponse.json({ order: publicOrder }, { headers });
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener el pedido' }, { status: 500, headers }
    );
  }
}
