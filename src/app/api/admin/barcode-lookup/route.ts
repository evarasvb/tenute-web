import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { isValidGtinDigits, normalizeBarcodeDigits } from '@/lib/ean';

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated';
}

export interface BarcodeLookupResult {
  ean: string;
  found: boolean;
  source: 'tenute' | 'open_food_facts' | 'upcitemdb' | 'open_product_data'
        | 'go_upc' | 'ean_search' | 'barcode_lookup' | 'web_search' | 'not_found';
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

// ── Proveedor 1: Open Food Facts ───────────────────────────────────────────
async function lookupOFF(ean: string): Promise<Suggested | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${ean}?fields=product_name,brands,categories_tags,image_front_url,generic_name,quantity`,
      FETCH_OPTS
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const name = safe(p.product_name) || safe(p.generic_name);
    if (!name) return null;
    const rawCat = Array.isArray(p.categories_tags) ? (p.categories_tags[0] ?? '') : '';
    return {
      name,
      brand: safe(p.brands).split(',')[0].trim(),
      description: safe(p.generic_name) || safe(p.quantity),
      category: String(rawCat).replace(/^[a-z]{2}:/, ''),
      image_url: safe(p.image_front_url),
      price_ref: null,
    };
  } catch { return null; }
}

// ── Proveedor 2: Open Product Data (okfn) ─────────────────────────────────
async function lookupOpenProductData(ean: string): Promise<Suggested | null> {
  try {
    const res = await fetch(`https://product.okfn.org/api/v0/product/${ean}`, FETCH_OPTS);
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

// ── Proveedor 3: UPC Item DB ───────────────────────────────────────────────
async function lookupUpcItemDb(ean: string): Promise<Suggested | null> {
  try {
    const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${ean}`, FETCH_OPTS);
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

// ── Proveedor 4: EAN-Search.org (tier gratuito: 20/día) ───────────────────
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

// ── Proveedor 5: Go-UPC (mejor cobertura LATAM) ───────────────────────────
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

// ── Proveedor 6: Barcode Lookup ────────────────────────────────────────────
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
      description: Array.isArray(p.description) ? p.description.join(' ') : safe(p.description),
      category: safe(p.category),
      image_url: Array.isArray(p.images) ? safe(p.images[0]) : '',
      price_ref: null,
    };
  } catch { return null; }
}

// ── Proveedor 7: Google Custom Search API ─────────────────────────────────
// Gratis: 100 búsquedas/día. Requiere GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_CX
// Configurar en: https://programmablesearchengine.google.com/
async function lookupGoogleSearch(ean: string): Promise<Suggested | null> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  if (!apiKey || !cx) return null;
  try {
    const query = encodeURIComponent(ean + ' producto');
    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&num=3`,
      FETCH_OPTS
    );
    if (!res.ok) return null;
    const data = await res.json();
    const item = data?.items?.[0];
    if (!item?.title) return null;

    // Extract price from snippet if present (e.g. "$490")
    const priceMatch = (item.snippet || '').match(/\$([\d.,]+)/);
    const priceRef = priceMatch ? parseFloat(priceMatch[1].replace(/[.,]/g, '')) : null;

    // Try to get image from pagemap
    const image = item.pagemap?.cse_image?.[0]?.src
      || item.pagemap?.product?.[0]?.image
      || '';

    // Extract brand from metatags if available
    const brand = item.pagemap?.metatags?.[0]?.['og:site_name']
      || item.pagemap?.product?.[0]?.brand
      || '';

    const description = item.snippet
      ? item.snippet.replace(/\n/g, ' ').trim()
      : '';

    const name = cleanProductName(item.title);
    if (!name) return null;

    return {
      name,
      brand: safe(brand),
      description,
      category: '',
      image_url: safe(image),
      price_ref: priceRef,
    };
  } catch { return null; }
}

// ── Proveedor 8: DuckDuckGo scraping (sin API key, fallback final) ─────────
// Usa el endpoint de búsqueda HTML de DuckDuckGo y extrae el primer snippet.
// Sin límite de uso, pero más frágil ante cambios de HTML.
async function lookupDuckDuckGo(ean: string): Promise<Suggested | null> {
  try {
    const query = encodeURIComponent(ean + ' producto descripcion');
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${query}`,
      {
        ...FETCH_OPTS,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TenuteBot/1.0; +https://tenute.cl)',
          'Accept': 'text/html',
        },
      }
    );
    if (!res.ok) return null;
    const html = await res.text();

    // Extract first result title and snippet using regex (no DOM parser needed)
    const titleMatch = html.match(/class="result__title"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/);
    const snippetMatch = html.match(/class="result__snippet"[^>]*>([^<]+(?:<[^>]+>[^<]*<\/[^>]+>[^<]*)*)<\/a>/);

    // Simpler regex for DuckDuckGo HTML structure
    const results = html.match(/result__a[^>]*>([^<]{5,80})<\/a>/g);
    const snippets = html.match(/result__snippet[^>]*>([^<]{10,200})</g);

    if (!results || results.length === 0) return null;

    const firstTitle = (titleMatch?.[1] || (results[0] || '').replace(/result__a[^>]*>/, '').replace(/<\/a>/, '')).trim();
    const firstSnippet = snippetMatch?.[1]?.replace(/<[^>]+>/g, ' ').trim()
      || (snippets?.[0] || '').replace(/result__snippet[^>]*>/, '').trim();

    const name = cleanProductName(firstTitle);
    if (!name || name.length < 3) return null;

    // Try to extract price from snippet
    const priceMatch = firstSnippet.match(/\$([\d.,]+)/);
    const priceRef = priceMatch ? parseFloat(priceMatch[1].replace(/[.,]/g, '')) : null;

    return {
      name,
      brand: '',
      description: firstSnippet.substring(0, 300),
      category: '',
      image_url: '',
      price_ref: priceRef,
    };
  } catch { return null; }
}

// Limpia el titulo de un resultado de busqueda para obtener solo el nombre del producto
function cleanProductName(title: string): string {
  if (!title) return '';
  // Remove common suffixes: "| Brand", "- Brand", "· Brand", prices, etc.
  return title
    .replace(/\s*[|·—–-].*$/, '')
    .replace(/\$[\d.,]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .substring(0, 120);
}

// ── Handler principal ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const raw = req.nextUrl.searchParams.get('ean') ?? '';
  const ean = normalizeBarcodeDigits(raw);
  if (!ean || !isValidGtinDigits(ean)) {
    return NextResponse.json({ error: 'EAN invalido: ' + raw }, { status: 400 });
  }

  // 1. Buscar en el catálogo propio de Tenute (siempre primero)
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

  // 2. APIs con API key (en paralelo) — mejor cobertura
  const [goUpcResult, barcodeLookupResult, eanSearchResult] = await Promise.all([
    lookupGoUpc(ean),
    lookupBarcodeLookup(ean),
    lookupEanSearch(ean),
  ]);

  if (goUpcResult) {
    return NextResponse.json({ ean, found: true, source: 'go_upc', suggested: goUpcResult } satisfies BarcodeLookupResult);
  }
  if (barcodeLookupResult) {
    return NextResponse.json({ ean, found: true, source: 'barcode_lookup', suggested: barcodeLookupResult } satisfies BarcodeLookupResult);
  }
  if (eanSearchResult) {
    return NextResponse.json({ ean, found: true, source: 'ean_search', suggested: eanSearchResult } satisfies BarcodeLookupResult);
  }

  // 3. APIs gratuitas (en paralelo)
  const [offResult, opdResult, upcResult] = await Promise.all([
    lookupOFF(ean),
    lookupOpenProductData(ean),
    lookupUpcItemDb(ean),
  ]);

  const freeResult = offResult ?? opdResult ?? upcResult;
  if (freeResult) {
    const source = offResult ? 'open_food_facts' : opdResult ? 'open_product_data' : 'upcitemdb';
    return NextResponse.json({ ean, found: true, source, suggested: freeResult } satisfies BarcodeLookupResult);
  }

  // 4. Fallback final: búsqueda en la web
  // Primero Google Custom Search (si hay key), luego DuckDuckGo scraping
  const [googleResult, ddgResult] = await Promise.all([
    lookupGoogleSearch(ean),
    lookupDuckDuckGo(ean),
  ]);

  const webResult = googleResult ?? ddgResult;
  if (webResult) {
    return NextResponse.json({
      ean,
      found: true,
      source: 'web_search',
      suggested: webResult,
    } satisfies BarcodeLookupResult);
  }

  // Nada encontrado — igual devolver el EAN para que el usuario llene el formulario
  return NextResponse.json({
    ean,
    found: false,
    source: 'not_found',
  } satisfies BarcodeLookupResult);
}
