import { NextRequest, NextResponse } from 'next/server';
import { createFlowPayment, isFlowEnabled } from '@/lib/flow';

export async function POST(request: NextRequest) {
  if (!isFlowEnabled()) {
    return NextResponse.json({ error: 'Flow.cl no está configurado' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { orderId, orderNumber, amount, email } = body;

    if (!orderId || !orderNumber || !amount) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;

    const result = await createFlowPayment({
      commerceOrder: orderNumber,
      subject: `Pedido Tenute ${orderNumber}`,
      amount: Math.round(amount),
      email: email || 'cliente@tenute.cl',
      urlConfirmation: `${baseUrl}/api/flow/confirm`,
      urlReturn: `${baseUrl}/api/flow/result`,
    });

    return NextResponse.json({
      paymentUrl: result.url,
      token: result.token,
      flowOrder: result.flowOrder,
    });
  } catch (err) {
    console.error('Flow create-payment error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error creando pago' },
      { status: 500 }
    );
  }
}
