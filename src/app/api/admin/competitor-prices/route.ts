import { NextRequest, NextResponse } from 'next/server';
import { isAdminSession, unauthorizedAdminResponse } from '@/lib/admin-auth';
import { getCompetitorPriceSummary } from '@/lib/competitor-pricing';

export async function GET(request: NextRequest) {
  if (!isAdminSession(request)) {
    return unauthorizedAdminResponse();
  }

  const { searchParams } = new URL(request.url);
  const productIdParam = searchParams.get('productId');
  if (!productIdParam) {
    return NextResponse.json({ error: 'productId es requerido' }, { status: 400 });
  }

  const productId = /^\d+$/.test(productIdParam) ? Number(productIdParam) : productIdParam;

  try {
    const summary = await getCompetitorPriceSummary(productId);
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error obteniendo precios de competencia',
      },
      { status: 500 }
    );
  }
}
