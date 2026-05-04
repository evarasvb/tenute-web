import { NextRequest, NextResponse } from 'next/server';
import { isAdminSession, unauthorizedAdminResponse } from '@/lib/admin-auth';
import { fillMissingProductImages } from '@/lib/product-images/fill';

type FillRequestBody = {
  dryRun?: boolean;
  productIds?: string[];
  concurrency?: number;
  previewCandidates?: boolean;
};

export async function POST(request: NextRequest) {
  if (!isAdminSession(request)) return unauthorizedAdminResponse();

  try {
    const body = (await request.json().catch(() => ({}))) as FillRequestBody;
    const productIds = Array.isArray(body.productIds)
      ? body.productIds.map((value) => String(value).trim()).filter(Boolean)
      : undefined;

    const result = await fillMissingProductImages({
      dryRun: Boolean(body.dryRun),
      productIds,
      concurrency: typeof body.concurrency === 'number' && body.concurrency > 0
        ? body.concurrency
        : undefined,
      previewCandidates: Boolean(body.previewCandidates),
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
