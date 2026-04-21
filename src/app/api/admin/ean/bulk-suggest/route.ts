import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { validateEAN13, normaliseBarcode } from '@/app/api/admin/ean/suggest/route';

// Bulk-suggest: find EAN suggestions for multiple products at once
// POST body: { product_ids: string[] }
// Returns: { results: Array<{ product_id, name, sku, current_barcode, suggestions }>, meta: { queried, suggested, skipped } }

// ─────────────────────────────────────────────
// Rate limiter: max 5 bulk req/min per IP
// ─────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; ts: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;
const MAX_BATCH = 50;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.ts > RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, ts: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated';
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (rateLimit(ip)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes bulk. Espera un minuto.' }, { status: 429 });
  }

  const body = await request.json();
  const productIds: string[] = body?.product_ids ?? [];

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ error: 'product_ids es requerido y no debe estar vacío' }, { status: 400 });
  }
  if (productIds.length > MAX_BATCH) {
    return NextResponse.json({ error: `Máximo ${MAX_BATCH} productos por lote` }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku, barcode')
    .in('id', productIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const meta = { queried: 0, suggested: 0, skipped_has_barcode: 0, failed: 0 };
  const results = [];
  const DELAY_MS = 300; // throttle between external API calls

  for (const product of products ?? []) {
    meta.queried++;

    // Skip products that already have a valid EAN
    if (product.barcode) {
      const norm = normaliseBarcode(product.barcode);
      if (validateEAN13(norm)) {
        meta.skipped_has_barcode++;
        results.push({ product_id: product.id, name: product.name, sku: product.sku, current_barcode: product.barcode, suggestions: [], status: 'skipped_has_ean' });
        continue;
      }
    }

    try {
      const suggestions = await fetchEANSuggestionsThrottled(product.name);
      if (suggestions.length > 0) meta.suggested++;
      else meta.failed++;
      results.push({ product_id: product.id, name: product.name, sku: product.sku, current_barcode: product.barcode ?? null, suggestions, status: suggestions.length > 0 ? 'found' : 'not_found' });
    } catch (err: unknown) {
      meta.failed++;
      const msg = err instanceof Error ? err.message : 'Error';
      results.push({ product_id: product.id, name: product.name, sku: product.sku, current_barcode: product.barcode ?? null, suggestions: [], status: 'error', error: msg });
    }

    // Throttle between requests to avoid hammering the external API
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log(`[EAN/bulk-suggest] meta=${JSON.stringify(meta)}`);

  return NextResponse.json({ results, meta });
}

async function fetchEANSuggestionsThrottled(name: string): Promise<Array<{ ean: string; label: string; confidence: string }>> {
  const TIMEOUT_MS = 8_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(name)}&search_simple=1&action=process&json=1&page_size=5`;
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'TenuteWeb/1.0' } });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`OpenFoodFacts returned ${res.status}`);
    const json = await res.json();
    const products: Array<{ code?: string; product_name?: string }> = json?.products ?? [];
    const seen = new Set<string>();
    return products
      .filter(p => {
        const code = normaliseBarcode(p.code ?? '');
        if (!validateEAN13(code) || seen.has(code)) return false;
        seen.add(code);
        return true;
      })
      .map(p => ({
        ean: normaliseBarcode(p.code!),
        label: p.product_name ?? 'Sin nombre',
        confidence: (p.product_name?.toLowerCase().includes(name.toLowerCase().slice(0, 5)) ? 'high' : 'low'),
      }));
  } catch {
    clearTimeout(timer);
    return [];
  }
}
