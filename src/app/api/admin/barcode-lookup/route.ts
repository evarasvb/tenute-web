import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { isValidGtinDigits, normalizeBarcodeDigits } from '@/lib/ean';

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated';
}

export interface BarcodeLookupResult {
  ean: string;
  found: boolean;
  source: 'tenute' | 'open_food_facts' | 'upcitemdb' | 'open_product_data' | 'go_upc' | 'ean_search' | 'not_found';
  existing_product?: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
  };
  suggested?: {
    name: string;
    brand: string;
    description: string;
    category: string;
    image_url: string;
    price_ref: number | null;
  };
}

type Suggested = BarcodeLookupResult['suggested'];

// ── Helpers ────────────────────────────────────────────────────────────────

const FETCH_OPTS = { next: { revalidate: 0 }, signal: AbortSignal.timeout(8000) } as const;

function safe(str: unknown): string {
  return typeof str === 'string' ? str.trim() : '';
}

// ── Proveedor 1: Open Food Facts v2 ───────────────────────────────────────
async function lookupOFF(ean: string): Promise<Suggested | null> {
  try {
    // Try global first, then country-specific subdomains most relevant to Chile
    const urls = [
      `https://world.openfoodfacts.org/api/v2/product/${ean}?fields=product_name,brands,categories_tags,image_front_url,generic_name,quantity`,
      `https://world.openfoodfacts.net/api/v2/product/${ean}?fields=product_name,brands,categories_tags,image_front_url,generic_name`,
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, FETCH_OPTS);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.status !== 1 || !data.product) continue;
        const p = data.product;
        const name = safe(p.product_name) || safe(p.generic_name);
        if (!name) continue;
        const rawCat = Array.isArray(p.categories_tags) ? (p.categories_tags[0] ?? '') : '';
        const category = String(rawCat).replace(/^[a-z]{2}:/, '');
        return {
          name,
          brand: safe(p.brands).split(',')[0].trim(),
          description: safe(p.generic_name) || safe(p.quantity),
          category,
          image_url: safe(p.image_front_url),
          price_ref: null,
        };
      } catch { continue; }
    }
    return null;
  } catch { return null; }
}

// ── Proveedor 2: Open Product Data (okfn) ────────────────────────────────
async function lookupOpenProductData(ean: string): Promise<Suggested | null> {
  try {
    const res = await fetch(
      `https://product.okfn.org/api/v0/product/${ean}`,
      FETCH_OPTS
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.product?.name) return null;
    const p = data.product;
    return {
      name: safe(p.name),
      brand: safe(p.brand),
      description: safe(p.description) || safe(p.summary),
      category: safe(p.category),
      image_url: safe(p.image) || safe(p.imageURL) || safe(p.image_url),
      price_ref: null,
    };
  } catch { return null; }
}

// ── Proveedor 3: UPC Item DB (100 req/day free) ───────────────────────────
async function lookupUpcItemDb(ean: string): Promise<Suggested | null> {
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${ean}`,
      FETCH_OPTS
    );
    if (!res.ok) return null;
    const data = await res.json();
    const item = data?.items?.[0];
    if (!item?.title) return null;
    return {
      name: safe(item.title),
      brand: safe(item.brand),
      description: safe(item.description),
      category: safe(item.category),
      image_url: Array.isArray(item.images) ? safe(item.images[0]) : '',
      price_ref: typeof item.lowest_recorded_price === 'number' ? item.lowest_recorded_price : null,
    };
  } catch { return null; }
}

// ── Proveedor 4: EAN-Search.org (gratis: 20 req/dia, con API key: mucho mas) ──
async function lookupEanSearch(ean: string): Promise<Suggested | null> {
  const apiKey = process.env.EAN_SEARCH_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://api.ean-search.org/api?token=${apiKey}&op=barcode-lookup&ean=${ean}&format=json`,
      FETCH_OPTS
    );
    if (!res.ok) return null;
    const data = await res.json();
    const p = Array.isArray(data) ? data[0] : data;
    if (!p?.name) return null;
    return {
      name: safe(p.name),
      brand: safe(p.brand) || '',
      description: safe(p.description) || '',
      category: safe(p.categoryName) || '',
      image_url: safe(p.image) || '',
      price_ref: null,
    };
  } catch { return null; }
}

// ── Proveedor 5: Go-UPC (con API key, mejor cobertura LATAM) ─────────────
async function lookupGoUpc(ean: string): Promise<Suggested | null> {
  const apiKey = process.env.BARCODE_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://go-upc.com/api/v1/code/${ean}`,
      { ...FETCH_OPTS, headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const p = data?.product;
    if (!p?.name) return null;
    return {
      name: safe(p.name),
      brand: safe(p.brand),
      description: safe(p.description),
      category: safe(p.category),
      image_url: safe(p.imageUrl),
      price_ref: null,
    };
  } catch { return null; }
}

// ── Proveedor 6: Barcode Lookup (con API key) ─────────────────────────────
async function lookupBarcodeLookup(ean: string): Promise<Suggested | null> {
  const apiKey = process.env.BARCODE_LOOKUP_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://api.barcodelookup.com/v3/products?barcode=${ean}&formatted=y&key=${apiKey}`,
      FETCH_OPTS
    );
    if (!res.ok) return null;
    const data = await res.json();
    const p = data?.products?.[0];
    if (!p?.title) return null;
    return {
      name: safe(p.title),
      brand: safe(p.brand),
      description: (Array.isArray(p.description) ? p.description.join(' ') : safe(p.description)),
      category: safe(p.category),
      image_url: Array.isArray(p.images) ? safe(p.images[0]) : '',
      price_ref: null,
    };
  } catch { return null; }
}

// ── Handler principal ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const raw = req.nextUrl.searchParams.get('ean') ?? '';
  const ean = normalizeBarcodeDigits(raw);
  if (!ean || !isValidGtinDigits(ean)) {
    return NextResponse.json({ error: 'EAN invalido: ' + raw }, { status: 400 });
  }

  // 1. Buscar en el catálogo propio de Tenute
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from('products')
    .select('id, name, slug, image_url')
    .eq('ean', ean)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ean,
      found: true,
      source: 'tenute',
      existing_product: existing,
    } satisfies BarcodeLookupResult);
  }

  // 2. Consulta en cascada de APIs externas (en paralelo para mayor velocidad)
  // Primero los que requieren API key (mejor cobertura), luego los gratuitos
  const [goUpcResult, barcodeLookupResult, eanSearchResult] = await Promise.all([
    lookupGoUpc(ean),
    lookupBarcodeLookup(ean),
    lookupEanSearch(ean),
  ]);

  if (goUpcResult) {
    return NextResponse.json({ ean, found: true, source: 'go_upc', suggested: goUpcResult } satisfies BarcodeLookupResult);
  }
  if (barcodeLookupResult) {
    return NextResponse.json({ ean, found: true, source: 'open_food_facts', suggested: barcodeLookupResult } satisfies BarcodeLookupResult);
  }
  if (eanSearchResult) {
    return NextResponse.json({ ean, found: true, source: 'ean_search', suggested: eanSearchResult } satisfies BarcodeLookupResult);
  }

  // 3. Fallback a APIs gratuitas (en paralelo)
  const [offResult, opdResult, upcResult] = await Promise.all([
    lookupOFF(ean),
    lookupOpenProductData(ean),
    lookupUpcItemDb(ean),
  ]);

  const suggested = offResult ?? opdResult ?? upcResult;
  const source: BarcodeLookupResult['source'] = offResult
    ? 'open_food_facts'
    : opdResult
    ? 'open_product_data'
    : upcResult
    ? 'upcitemdb'
    : 'not_found';

  // Siempre devolver found:true con el EAN para que el frontend abra el formulario
  // Si no hay datos sugeridos, el usuario llena el formulario manualmente
  return NextResponse.json({
    ean,
    found: !!suggested,
    source,
    suggested: suggested ?? undefined,
  } satisfies BarcodeLookupResult);
}
