// src/app/api/ml/publish-product/route.ts
// Publica un producto del catálogo real (tabla products) en Mercado Libre.
// POST { productId: string }. Solo admin.

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { isAdminSession, unauthorizedAdminResponse } from '@/lib/admin-auth';
import { getValidMlToken, publishProductToMl } from '@/lib/ml/publish';

export async function POST(req: NextRequest) {
  if (!isAdminSession(req)) return unauthorizedAdminResponse();
  try {
    const { productId } = await req.json();
    if (!productId) return Response.json({ error: 'productId requerido' }, { status: 400 });

    const supabase = createAdminClient();
    const { token, reason } = await getValidMlToken(supabase);
    if (!token) return Response.json({ error: reason }, { status: 401 });

    const r = await publishProductToMl(supabase, productId, token.access_token);
    if (!r.ok) return Response.json({ error: r.error }, { status: 400 });
    return Response.json({ ok: true, ml_item_id: r.ml_item_id, permalink: r.permalink, skipped: r.skipped || false });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
