import { NextRequest, NextResponse } from 'next/server';
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
      return NextResponse.redirect(new URL(`/pedido/${orderNumber}`, request.url));
    }

    return NextResponse.redirect(new URL('/catalogo', request.url));
  } catch {
    return NextResponse.redirect(new URL('/catalogo', request.url));
  }
}
