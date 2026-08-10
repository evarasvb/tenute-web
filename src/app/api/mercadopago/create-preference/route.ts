import { NextRequest, NextResponse } from 'next/server';
import {
  createMercadoPagoPreference,
  isMercadoPagoEnabled,
  type MercadoPagoItem,
} from '@/lib/mercadopago';
import { createAdminClient } from '@/lib/supabase';

/**
 * Crea una preferencia de pago de MercadoPago Checkout Pro.
 *
 * La orden se identifica SIEMPRE por su `order_number` (TEN-xxxx), el mismo
 * identificador que usa el webhook y la pasarela Flow. El monto no se confía
 * al cliente: se carga la orden en el servidor y se valida que el total de los
 * items enviados coincida con `orders.total` antes de crear la preferencia.
 */
export async function POST(request: NextRequest) {
  if (!isMercadoPagoEnabled()) {
    return NextResponse.json(
      { error: 'MercadoPago no está configurado' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { items, orderNumber, email } = body as {
      items?: MercadoPagoItem[];
      orderNumber?: string;
      email?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Se requieren items para crear la preferencia' },
        { status: 400 }
      );
    }

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Falta el identificador de la orden (orderNumber)' },
        { status: 400 }
      );
    }

    // Cargar la orden en el servidor para fijar el monto (evita que el cliente
    // manipule los precios y pague menos de lo que vale la orden).
    const supabase = createAdminClient();
    const { data: order } = await supabase
      .from('orders')
      .select('order_number, total, status')
      .eq('order_number', orderNumber)
      .single();

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'La orden no está pendiente de pago' },
        { status: 409 }
      );
    }

    const itemsTotal = items.reduce(
      (sum, it) =>
        sum + Math.round(it.unit_price) * Math.max(1, Math.round(it.quantity)),
      0
    );

    if (itemsTotal !== Math.round(Number(order.total))) {
      return NextResponse.json(
        { error: 'El monto de los items no coincide con el total de la orden' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const returnUrl = `${baseUrl}/pedido/${orderNumber}`;

    const preference = await createMercadoPagoPreference({
      items,
      externalReference: orderNumber,
      backUrls: {
        success: returnUrl,
        failure: `${baseUrl}/checkout`,
        pending: returnUrl,
      },
      notificationUrl: `${baseUrl}/api/mercadopago/webhook`,
      payerEmail: email || undefined,
    });

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.initPoint,
      sandboxInitPoint: preference.sandboxInitPoint,
    });
  } catch (err) {
    console.error('MercadoPago create-preference error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
