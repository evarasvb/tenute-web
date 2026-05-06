import { NextRequest, NextResponse } from 'next/server';
import {
  getAllActiveCompetitorLinks,
  getCompetitorPriceSummary,
  refreshLinks,
} from '@/lib/competitor-pricing';

function isAuthorizedCron(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  if (!authHeader) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const links = await getAllActiveCompetitorLinks();
    const refreshed = await refreshLinks(links);
    const touchedProductIds = Array.from(
      new Set(refreshed.ok.map((item) => item.productId).concat(refreshed.errors.map((item) => item.productId)))
    );
    const summaries = await Promise.all(
      touchedProductIds.map((productId) => getCompetitorPriceSummary(productId))
    );

    return NextResponse.json({
      processedLinks: links.length,
      okCount: refreshed.ok.length,
      errorCount: refreshed.errors.length,
      ok: refreshed.ok,
      errors: refreshed.errors,
      results: summaries,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error ejecutando cron de precios',
      },
      { status: 500 }
    );
  }
}
