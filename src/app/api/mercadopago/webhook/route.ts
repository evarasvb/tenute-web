import { NextRequest } from 'next/server';
import { getMercadoPagoPayment, isMercadoPagoEnabled } from '@/lib/mercadopago';
import { createAdminClient } from '@/lib/supabase';

/**
 * Webhook de notificaciones de MercadoPago (POST).
 * MercadoPago notifica los eventos de pago (topic/type = "payment").
 * Consultamos el pago y, si está aprobado, actualizamos la orden asociada
 * a través del external_reference (id de la orden).
 */
export async function POST(request: NextRequest) {
  if (!isMercadoPagoEnabled()) {
    return new Response('MercadoPago not configured', { status: 503 });
  }

  try {
    // MercadoPago envía el id del pago vía query (?type=payment&data.id=...)
    // o en el body ({ type, data: { id } }). Contemplamos ambos.
    const url = request.nextUrl;
    const queryType = url.searchParams.get('type') || url.searchParams.get('topic');
    const queryId = url.searchParams.get('data.id') || url.searchParams.get('id');

    let type = queryType;
    let paymentId = queryId;

    if (!paymentId) {
      const body = await request.json().catch(() => null);
      if (body) {
        type = type || body.type || body.topic;
        paymentId = body?.data?.id ? String(body.data.id) : paymentId;
      }
    }

    // Solo procesamos notificaciones de pago
    if (type && type !== 'payment') {
      return new Response('OK', { status: 200 });
    }

    if (!paymentId) {
      return new Response('OK', { status: 200 });
    }

    const payment = await getMercadoPagoPayment(paymentId);

    if (payment.status === 'approved' && payment.external_reference) {
      const supabase = createAdminClient();

      // external_reference es el order_number (TEN-xxxx), igual que en Flow.
      const { data: order } = await supabase
        .from('orders')
        .select('id, status, total')
        .eq('order_number', payment.external_reference)
        .single();

      if (order && order.status === 'pending') {
        // Validar que el monto aprobado cubra el total de la orden. Evita que
        // un comprador pague una preferencia manipulada más barata y aun así
        // deje la orden marcada como pagada.
        const paidAmount = Math.round(payment.transaction_amount ?? 0);
        const orderTotal = Math.round(Number(order.total));

        if (paidAmount >= orderTotal) {
          await supabase
            .from('orders')
            .update({
              status: 'paid',
              payment_method: 'mercadopago',
              payment_id: payment.id ? payment.id.toString() : paymentId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);
        } else {
          console.warn(
            `MercadoPago webhook: pago ${paymentId} insuficiente para la orden ` +
              `${payment.external_reference} (pagado ${paidAmount} < total ${orderTotal}); ` +
              'la orden se deja pendiente.'
          );
        }
      }
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('MercadoPago webhook error:', err);
    return new Response('Error', { status: 500 });
  }
}
