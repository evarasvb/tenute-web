// src/app/api/ml/publish-product/route.ts
// Publica un producto del catálogo real (tabla products) en Mercado Libre.
// POST { productId: string }
// Requiere: app de ML configurada (ML_APP_ID/ML_CLIENT_SECRET) y token de
// vendedor autorizado vía /api/ml/auth. Solo admin.

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { isAdminSession, unauthorizedAdminResponse } from '@/lib/admin-auth';

const ML_API = 'https://api.mercadolibre.com';

/** Predice la categoría de ML a partir del título; fallback genérico. */
async function predictCategory(title: string): Promise<string> {
  try {
    const r = await fetch(
      `${ML_API}/sites/MLC/domain_discovery/search?limit=1&q=${encodeURIComponent(title)}`,
      { headers: { Accept: 'application/json' } }
    );
    if (r.ok) {
      const arr = await r.json();
      const cat = Array.isArray(arr) && arr[0]?.category_id;
      if (cat) return cat;
    }
  } catch { /* usa fallback */ }
  return 'MLC1648'; // Otros
}

export async function POST(req: NextRequest) {
  if (!isAdminSession(req)) return unauthorizedAdminResponse();

  try {
    const { productId } = await req.json();
    if (!productId) return Response.json({ error: 'productId requerido' }, { status: 400 });

    const supabase = createAdminClient();

    const { data: p, error: pErr } = await supabase
      .from('products')
      .select('id, name, description, price, stock, image_url, images, sku, condition, metadata')
      .eq('id', productId)
      .single();
    if (pErr || !p) return Response.json({ error: 'Producto no encontrado' }, { status: 404 });

    // Guardas: ML exige foto, precio y título.
    const title = String(p.name || '').trim().slice(0, 60);
    const price = Number(p.price) || 0;
    const meta = (p.metadata && typeof p.metadata === 'object' ? p.metadata : {}) as Record<string, any>;
    const extraImages: string[] = Array.isArray(meta.additional_images) ? meta.additional_images : [];
    const pictureUrls = [p.image_url, ...extraImages].filter((u): u is string => !!u && String(u).trim() !== '');
    if (!title) return Response.json({ error: 'El producto no tiene nombre.' }, { status: 400 });
    if (price <= 0) return Response.json({ error: 'El producto no tiene precio válido.' }, { status: 400 });
    if (pictureUrls.length === 0) return Response.json({ error: 'El producto no tiene foto. Rellena la foto antes de publicar.' }, { status: 400 });
    if (meta.ml_item_id) {
      return Response.json({ error: 'Ya está publicado en ML', ml_item_id: meta.ml_item_id, permalink: meta.ml_permalink }, { status: 409 });
    }

    // Token del vendedor.
    const { data: token, error: tErr } = await supabase
      .from('ds_ml_tokens')
      .select('access_token, expires_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    if (tErr || !token) {
      return Response.json({ error: 'No hay token de Mercado Libre. Autoriza en /api/ml/auth.' }, { status: 401 });
    }
    if (new Date(token.expires_at) < new Date()) {
      return Response.json({ error: 'Token de ML expirado. Vuelve a autorizar en /api/ml/auth.' }, { status: 401 });
    }

    const stock = Number(p.stock) || 0;
    const availableQty = stock > 0 ? Math.min(stock, 500) : 25; // bajo pedido => stock virtual
    const categoryId = await predictCategory(title);

    const mlBody = {
      title,
      category_id: categoryId,
      price,
      currency_id: 'CLP',
      available_quantity: availableQty,
      buying_mode: 'buy_it_now',
      condition: p.condition || 'new',
      listing_type_id: 'gold_special',
      pictures: pictureUrls.slice(0, 10).map((source) => ({ source })),
      description: { plain_text: String(p.description || title) },
      shipping: { mode: 'me2', free_shipping: false },
    };

    const mlRes = await fetch(`${ML_API}/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(mlBody),
    });
    const mlItem = await mlRes.json();
    if (!mlRes.ok) {
      return Response.json({ error: 'Mercado Libre rechazó la publicación', detail: mlItem }, { status: mlRes.status });
    }

    // Guardamos la referencia en el propio producto (metadata) para no duplicar.
    await supabase
      .from('products')
      .update({
        metadata: {
          ...meta,
          ml_item_id: mlItem.id,
          ml_permalink: mlItem.permalink,
          ml_status: mlItem.status,
          ml_category: categoryId,
          ml_published_at: new Date().toISOString(),
        },
      })
      .eq('id', productId);

    return Response.json({
      ok: true,
      ml_item_id: mlItem.id,
      status: mlItem.status,
      permalink: mlItem.permalink,
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
