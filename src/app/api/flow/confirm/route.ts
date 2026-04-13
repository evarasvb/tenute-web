import { NextRequest, NextResponse } from 'next/server';
import { getFlowPaymentStatus, isFlowEnabled } from '@/lib/flow';
import { createAdminClient } from '@/lib/supabase';

/**
 * Flow.cl confirmation webhook (POST).
 * Flow sends token as form-urlencoded body parameter.
 * We query payment status and update the order accordingly.
 */
export async function POST(request: NextRequest) {
  if (!isFlowEnabled()) {
    return new Response('Flow not configured', { status: 503 });
  }

  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;

    if (!token) {
      return new Response('Missing token', { status: 400 });
    }

    const status = await getFlowPaymentStatus(token);

    // Status 2 = paid
    if (status.status === 2) {
      const supabase = createAdminClient();

      // Find order by order_number (commerceOrder)
      const { data: order } = await supabase
        .from('orders')
        .select('id, status')
        .eq('order_number', status.commerceOrder)
        .single();

      if (order && order.status === 'pending') {
        await supabase
          .from('orders')
          .update({
            status: 'paid',
            payment_method: 'flow',
            payment_id: status.flowOrder.toString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);
      }
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Flow confirm webhook error:', err);
    return new Response('Error', { status: 500 });
  }
}
