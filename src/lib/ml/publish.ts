// src/lib/ml/publish.ts
// Lógica compartida para publicar productos del catálogo (tabla products) en
// Mercado Libre. La usan /api/ml/publish-product (uno) y /api/ml/publish-batch (lote).

import type { createAdminClient } from '@/lib/supabase';

type Supabase = ReturnType<typeof createAdminClient>;

const ML_API = 'https://api.mercadolibre.com';

export interface MlToken { access_token: string; expires_at: string }

/** Token de vendedor más reciente; null si no hay o está expirado. */
export async function getValidMlToken(supabase: Supabase): Promise<{ token: MlToken | null; reason?: string }> {
  const { data, error } = await supabase
    .from('ds_ml_tokens')
    .select('access_token, expires_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return { token: null, reason: 'No hay token de Mercado Libre. Autoriza en /api/ml/auth.' };
  if (new Date(data.expires_at) < new Date()) return { token: null, reason: 'Token de ML expirado. Vuelve a autorizar en /api/ml/auth.' };
  return { token: data as MlToken };
}

/** Predice la categoría de ML por título; fallback genérico. */
async function predictCategory(title: string): Promise<string> {
  try {
    const r = await fetch(`${ML_API}/sites/MLC/domain_discovery/search?limit=1&q=${encodeURIComponent(title)}`, {
      headers: { Accept: 'application/json' },
    });
    if (r.ok) {
      const arr = await r.json();
      const cat = Array.isArray(arr) && arr[0]?.category_id;
      if (cat) return cat;
    }
  } catch { /* fallback */ }
  return 'MLC1648';
}

export interface PublishResult {
  productId: string;
  ok: boolean;
  skipped?: boolean;
  ml_item_id?: string;
  permalink?: string;
  error?: string;
}

/** Publica un producto (por id) en ML usando un token ya validado. */
export async function publishProductToMl(supabase: Supabase, productId: string, accessToken: string): Promise<PublishResult> {
  const { data: p, error } = await supabase
    .from('products')
    .select('id, name, description, price, stock, image_url, condition, metadata')
    .eq('id', productId)
    .single();
  if (error || !p) return { productId, ok: false, error: 'Producto no encontrado' };

  const title = String(p.name || '').trim().slice(0, 60);
  const price = Number(p.price) || 0;
  const meta = (p.metadata && typeof p.metadata === 'object' ? p.metadata : {}) as Record<string, any>;
  const extraImages: string[] = Array.isArray(meta.additional_images) ? meta.additional_images : [];
  const pictureUrls = [p.image_url, ...extraImages].filter((u): u is string => !!u && String(u).trim() !== '');

  if (meta.ml_item_id) return { productId, ok: true, skipped: true, ml_item_id: meta.ml_item_id, permalink: meta.ml_permalink };
  if (!title) return { productId, ok: false, error: 'Sin nombre' };
  if (price <= 0) return { productId, ok: false, error: 'Sin precio' };
  if (pictureUrls.length === 0) return { productId, ok: false, error: 'Sin foto' };

  const stock = Number(p.stock) || 0;
  const availableQty = stock > 0 ? Math.min(stock, 500) : 25;
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
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(mlBody),
  });
  const mlItem = await mlRes.json();
  if (!mlRes.ok) {
    const msg = mlItem?.message || mlItem?.error || 'Rechazado por ML';
    return { productId, ok: false, error: String(msg) };
  }

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

  return { productId, ok: true, ml_item_id: mlItem.id, permalink: mlItem.permalink };
}
