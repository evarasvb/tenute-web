// src/app/api/ml/publish-batch/route.ts
// Publica un LOTE de productos del catálogo en Mercado Libre.
// POST { productIds: string[] }  (máximo 20 por llamada; el cliente itera).
// Solo admin. Salta los ya publicados y los que no cumplen (sin foto/precio).

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { isAdminSession, unauthorizedAdminResponse } from '@/lib/admin-auth';
import { getValidMlToken, publishProductToMl, type PublishResult } from '@/lib/ml/publish';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!isAdminSession(req)) return unauthorizedAdminResponse();
  try {
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body.productIds)
      ? body.productIds.map((v: unknown) => String(v).trim()).filter(Boolean).slice(0, 20)
      : [];
    if (ids.length === 0) return Response.json({ error: 'productIds requerido' }, { status: 400 });

    const supabase = createAdminClient();
    const { token, reason } = await getValidMlToken(supabase);
    if (!token) return Response.json({ error: reason }, { status: 401 });

    const results: PublishResult[] = [];
    // Secuencial: cada publicación pega a la API de ML; evitamos ráfagas.
    for (const id of ids) {
      try {
        results.push(await publishProductToMl(supabase, id, token.access_token));
      } catch (e) {
        results.push({ productId: id, ok: false, error: e instanceof Error ? e.message : 'error' });
      }
    }

    const published = results.filter((r) => r.ok && !r.skipped).length;
    const skipped = results.filter((r) => r.skipped).length;
    const failed = results.filter((r) => !r.ok).length;
    return Response.json({ published, skipped, failed, results });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
