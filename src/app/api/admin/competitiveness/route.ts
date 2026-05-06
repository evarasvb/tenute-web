import { NextRequest, NextResponse } from 'next/server';
import { isAdminSession, unauthorizedAdminResponse } from '@/lib/admin-auth';
import { getCompetitivenessDataWithAdminClient } from '@/lib/competitiveness';

export async function GET(request: NextRequest) {
  if (!isAdminSession(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const payload = await getCompetitivenessDataWithAdminClient();
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'No se pudo obtener el reporte de competitividad',
      },
      { status: 500 }
    );
  }
}
