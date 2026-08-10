import { NextRequest, NextResponse } from 'next/server';
import {
  createMercadoPagoPreference,
  isMercadoPagoEnabled,
  type MercadoPagoItem,
} from '@/lib/mercadopago';

/**
 * Crea una preferencia de pago de MercadoPago Checkout Pro.
 * Recibe los items del carrito/orden y datos de la orden, y devuelve
 * el init_point al que redirigir al cliente junto con el preference_id.
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
    const { items, orderId, orderNumber, email } = body as {
      items?: MercadoPagoItem[];
      orderId?: string;
      orderNumber?: string;
      email?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Se requieren items para crear la preferencia' },
        { status: 400 }
      );
    }

    const externalReference = orderId || orderNumber;
    if (!externalReference) {
      return NextResponse.json(
        { error: 'Falta el identificador de la orden (orderId u orderNumber)' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const returnUrl = orderNumber
      ? `${baseUrl}/pedido/${orderNumber}`
      : `${baseUrl}/checkout`;

    const preference = await createMercadoPagoPreference({
      items,
      externalReference,
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
