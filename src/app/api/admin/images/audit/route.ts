import { NextRequest, NextResponse } from 'next/server';
import { runProductImageAudit } from '@/lib/product-images/audit';
import { isAdminSession, unauthorizedAdminResponse } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  if (!isAdminSession(request)) {
    return unauthorizedAdminResponse();
  }

  const { searchParams } = new URL(request.url);
  const includeHttpChecks = searchParams.get('includeHttpChecks') !== 'false';
  const persist = searchParams.get('persist') !== 'false';
  const productIdsParam = searchParams.get('productIds') || '';
  const productIds = productIdsParam
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  try {
    const audit = await runProductImageAudit({
      includeHttpChecks,
      persistTable: persist,
      productIds: productIds.length > 0 ? productIds : undefined,
      exportJsonPath: 'tmp/audit-images.json',
    });
    return NextResponse.json(audit);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error generando auditoría';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
