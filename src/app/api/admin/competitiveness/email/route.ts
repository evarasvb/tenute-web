import { NextRequest, NextResponse } from 'next/server';
import { isAdminSession, unauthorizedAdminResponse } from '@/lib/admin-auth';
import {
  getCompetitivenessDataWithAdminClient,
  sendCompetitivenessSummaryEmail,
} from '@/lib/competitiveness';

export async function POST(request: NextRequest) {
  if (!isAdminSession(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    const payload = await getCompetitivenessDataWithAdminClient();
    const email = body.email || payload.adminEmail;

    if (!email) {
      return NextResponse.json(
        { error: 'No se encontro email de administrador para enviar el resumen' },
        { status: 400 }
      );
    }

    const result = await sendCompetitivenessSummaryEmail({
      to: email,
      payload,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error enviando resumen de competitividad',
      },
      { status: 500 }
    );
  }
}
