import { NextRequest, NextResponse } from 'next/server';

// Compatibilidad con despliegues antiguos: esta ruta ya no muta precios. Todo
// cambio masivo debe pasar por previsualización y confirmación explícita.

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorizedCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  return Boolean(cronSecret) && request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  return NextResponse.json({
    error: 'Sincronización automática de precios pausada. Usa la importación con previsualización.',
  }, { status: 410 });
}
