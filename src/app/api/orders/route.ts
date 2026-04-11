import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_email,
      customer_rut,
      shipping_method,
      shipping_address,
      shipping_commune,
      shipping_city,
      shipping_region,
      shipping_cost,
      payment_method,
      items,
      notes,
    } = body;

    if (!customer_name || !customer_phone) {
      return NextResponse.json(
        { error: 'Nombre y teléfono son obligatorios' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'El pedido debe tener al menos un producto' },
        { status: 400 }
      );
    }

    if (!shipping_method) {
      return NextResponse.json(
        { error: 'Debes seleccionar un método de envío' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Calculate subtotal from items
    const subtotal = items.reduce(
      (sum: number, item: { unit_price: number; quantity: number }) =>
        sum + item.unit_price * item.quantity,
      0
    );
    const finalShippingCost = shipping_cost || 0;
    const total = subtotal + finalShippingCost;

    // Generate order number
    let orderNumber: string;
    try {
      const { data: seqData, error: seqError } = await supabase.rpc('generate_order_number');
      if (seqError || !seqData) throw new Error('RPC failed');
      orderNumber = seqData;
    } catch {
      // Fallback: count existing orders and generate number
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      const nextNum = 1001 + (count || 0);
      orderNumber = `TEN-${nextNum}`;
    }

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        customer_rut: customer_rut || null,
        shipping_method,
        shipping_address: shipping_address || null,
        shipping_commune: shipping_commune || null,
        shipping_city: shipping_city || null,
        shipping_region: shipping_region || null,
        shipping_cost: finalShippingCost,
        subtotal,
        total,
        status: 'pending',
        payment_method: payment_method || 'whatsapp',
        notes: notes || null,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Error al crear el pedido: ' + orderError.message },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = items.map(
      (item: {
        product_id: string;
        product_name: string;
        product_sku?: string;
        product_image_url?: string;
        quantity: number;
        unit_price: number;
      }) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku || null,
        product_image_url: item.product_image_url || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.unit_price * item.quantity,
      })
    );

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
    }

    // Decrement stock for each product
    for (const item of items) {
      try {
        await supabase.rpc('decrement_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        });
      } catch {
        // Fallback: direct update
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();
        if (product) {
          await supabase
            .from('products')
            .update({ stock: Math.max((product.stock || 0) - item.quantity, 0) })
            .eq('id', item.product_id);
        }
      }
    }

    return NextResponse.json({ order: { ...order, items: orderItems } });
  } catch (error) {
    console.error('Unexpected error creating order:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
