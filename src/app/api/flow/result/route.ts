import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { getFlowPaymentStatus, isFlowEnabled } from '@/lib/flow';

/**
 * Flow.cl return URL (GET).
 * User is redirected here after completing/cancelling payment on Flow.
 * We check the status and redirect to the appropriate order page.
 */
export async function GET(request: NextRequest) {
  if (!isFlowEnabled()) {
    return NextResponse.redirect(new URL('/catalogo', request.url));
  }

  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/catalogo', request.url));
  }

  try {
    const status = await getFlowPaymentStatus(token);
    const orderNumber = status.commerceOrder;

    // Redirect to order detail page
    if (orderNumber) {
      const { data: order, error } = await createAdminClient()
        .from('orders')
        .select('id, order_number')
        .eq('order_number', orderNumber)
        .single();
      if (!error && order) {
        const returnUrl = new URL(`/pedido/${encodeURIComponent(order.order_number)}`, request.url);
        returnUrl.searchParams.set('t', order.id);
        return NextResponse.redirect(returnUrl);
      }
    }

    return NextResponse.redirect(new URL('/catalogo', request.url));
  } catch {
    return NextResponse.redirect(new URL('/catalogo', request.url));
  }
}
