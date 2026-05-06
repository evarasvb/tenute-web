import { NextRequest, NextResponse } from 'next/server';
import { isAdminSession, unauthorizedAdminResponse } from '@/lib/admin-auth';
import {
  getActiveCompetitorLinksByProducts,
  getAllActiveCompetitorLinks,
  getCompetitorPriceSummary,
  parseRefreshPayload,
  refreshLinks,
} from '@/lib/competitor-pricing';

export async function POST(request: NextRequest) {
  if (!isAdminSession(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = await request.json().catch(() => ({}));
    const requestedProductIds = parseRefreshPayload(body);

    const links =
      requestedProductIds.length > 0
        ? await getActiveCompetitorLinksByProducts(requestedProductIds)
        : await getAllActiveCompetitorLinks();

    if (links.length === 0) {
      return NextResponse.json({
        ok: [],
        errors: [],
        results: [],
      });
    }

    const refreshed = await refreshLinks(links, {
      concurrency: 8,
      timeoutMs: 15_000,
      progressEvery: 100,
    });
    const touchedProductIds = Array.from(
      new Set(refreshed.ok.map((item) => item.productId).concat(refreshed.errors.map((item) => item.productId)))
    );

    const summaries = await Promise.all(
      touchedProductIds.map(async (productId) => {
        const summary = await getCompetitorPriceSummary(productId);
        return summary;
      })
    );

    return NextResponse.json({
      ok: refreshed.ok,
      errors: refreshed.errors,
      results: summaries,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error refrescando precios de competencia',
      },
      { status: 500 }
    );
  }
}
