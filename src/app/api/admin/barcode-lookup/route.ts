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
          | 'go_upc' | 'ean_search' | 'barcode_lookup' | 'web_search' | 'chilean_store' | 'not_found';
    existing_product?: {
      id: string;
      name: string;
      slug: string;
      image_url: string | null;
    brand: string | null;
    description: string | null;
    price: number | null;
    category_name: string | null;
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

const FETCH_OPTS = { next: { revalidate: 0 }, signal: AbortSignal.timeout(8000) } as const;

function safe(str: unknown): string {
    return typeof str === 'string' ? str.trim() : '';
}

function cleanTitle(title: string): string {
    if (!title) return '';
    return title
      .replace(/\s*[|·\-—~]\s*.{0,60}$/, '') // Remove "| Brand" suffixes
    .replace(/\$[\d.,]+/, '')               // Remove prices
    .replace(/\s{2,}/g, ' ')
      .trim()
      .substring(0, 120);
}

function extractPrice(text: string): number | null {
    const m = text.match(/\$\s*([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/);
    if (!m) return null;
    return parseFloat(m[1].replace(/[.,]/g, ''));
}

// — Proveedor 1: Open Food Facts ————————————————————————
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

// — Proveedor 2: Open Product Data ————————————————————————
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

// — Proveedor 3: UPC Item DB ————————————————————————
async function lookupUpcItemDb(ean: string): Promise<Suggested | null> {
    try {
          const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${ean}`, FETCH_OPTS);
          if (!res.ok) return null;
          const data = await res.json();
          const p = Array.isArray(data) ? data[0] : data;
          if (!p?.name) return null;
          return {
                  name: safe(p.name),
                  brand: safe(p.brand) || '',
                  description: safe(p.description) || '',
                  category: safe(p.category) || '',
                  image_url: safe(p.image) || '',
                  price_ref: null,
          };
    } catch { return null; }
}

// — Proveedor 4: EAN-Search.org ————————————————————————
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

// — Proveedor 5: Go-UPC ————————————————————————————————
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
                  image_url: Array.isArray(p.images) ? safe(p.images[0]) : '',
                  price_ref: null,
          };
    } catch { return null; }
}

// — Proveedor 6: Barcode Lookup ————————————————————————
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

// — Proveedor 7: Google Custom Search API ————————————————————————
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
          const image = item.pagemap?.cse_image?.[0]?.src || item.pagemap?.product?.[0]?.image || '';
          const brand = item.pagemap?.metatags?.[0]?.['og:site_name'] || item.pagemap?.product?.[0]?.brand || '';
          const snippet = safe(item.snippet).replace(/\n/g, ' ');
          const name = cleanTitle(item.title);
          if (!name) return null;
          return {
                  name,
                  brand: safe(brand),
                  description: snippet,
                  category: '',
                  image_url: safe(image),
                  price_ref: extractPrice(snippet),
          };
    } catch { return null; }
}

// — Proveedor 8: Búsqueda web sin API key ————————————————————————
// Usa el sitemap/JSON de resultados de búsqueda de SerpApi (plan gratuito: 100/mes)
// O el endpoint JSON de búsqueda de Brave Search (gratuito: 2000/mes)
async function lookupBraveSearch(ean: string): Promise<Suggested | null> {
    const apiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!apiKey) return null;
    try {
          const query = encodeURIComponent(ean + ' producto descripcion marca');
          const res = await fetch(
                  `https://api.search.brave.com/res/v1/web/search?q=${query}&count=3`,
            {
                      ...FETCH_OPTS,
                      headers: {
                                  'Accept': 'application/json',
                                  'Accept-Encoding': 'gzip',
                                  'X-Subscription-Token': apiKey,
                      },
            }
                );
          if (!res.ok) return null;
          const data = await res.json();
          // Try shopping results first (best product data)
      const shopping = data?.shopping_results?.[0];
          if (shopping?.title) {
                  return {
                            name: cleanTitle(shopping.title),
                            brand: safe(shopping.source || ''),
                            description: safe(shopping.snippet || ''),
                            category: '',
                            image_url: safe(shopping.thumbnail || ''),
                            price_ref: typeof shopping.price === 'string'
                              ? parseFloat(shopping.price.replace(/[^0-9.]/g, '')) || null
                                        : null,
                  };
          }
          // Fallback to organic results
      const organic = data?.organic_results?.[0];
          if (!organic?.title) return null;
          const snippet = safe(organic.snippet);
          return {
                  name: cleanTitle(organic.title),
                  brand: '',
                  description: snippet,
                  category: '',
                  image_url: safe(organic.thumbnail || ''),
                  price_ref: extractPrice(snippet),
          };
    } catch { return null; }
}

// — Proveedor 9: SerpAPI ————————————————————————————————
async function lookupSerpApi(ean: string): Promise<Suggested | null> {
    const apiKey = process.env.SERP_API_KEY;
    if (!apiKey) return null;
    try {
          const query = encodeURIComponent(ean + ' producto');
          const res = await fetch(
                  `https://serpapi.com/search.json?engine=google_shopping&q=${query}&api_key=${apiKey}&gl=cl&hl=es&num=1`,
                  FETCH_OPTS
                );
          if (!res.ok) return null;
          const data = await res.json();
          const item = data?.shopping_results?.[0];
          if (!item?.title) return null;
          return {
                  name: cleanTitle(item.title),
                  brand: safe(item.source || ''),
                  description: safe(item.snippet || ''),
                  category: '',
                  image_url: safe(item.thumbnail || ''),
                  price_ref: typeof item.price === 'string'
                    ? parseFloat(item.price.replace(/[^0-9.]/g, '')) || null
                            : null,
          };
    } catch { return null; }
}

// — Proveedor 10: Tiendas chilenas (VTEX) ————————————————————————
// Busca en supermercados y retailers chilenos que exponen sus APIs VTEX públicamente
// Funciona server-side (sin CORS). Cubre EANs chilenos (780xxx) no indexados globalmente.
const VTEX_STORES: { name: string; host: string }[] = [
  { name: 'Jumbo', host: 'www.jumbo.cl' },
  { name: 'Santa Isabel', host: 'www.santaisabel.cl' },
  { name: 'Unimarc', host: 'www.unimarc.cl' },
  { name: 'Lider', host: 'www.lider.cl' },
  { name: 'Tottus', host: 'www.tottus.cl' },
  ];

async function lookupChileanStores(ean: string): Promise<Suggested | null> {
    const VTEX_FETCH_OPTS = { next: { revalidate: 0 }, signal: AbortSignal.timeout(6000) } as const;
    const results = await Promise.allSettled(
          VTEX_STORES.map(async ({ name: storeName, host }) => {
                  // Try Intelligent Search API first (newer VTEX IO)
                                const isUrl = `https://${host}/api/intelligent-search/product_search/trade-policy/1?query=${encodeURIComponent(ean)}&page=1&count=1&sort=score_desc&fuzzy=0&operator=and`;
                  const isRes = await fetch(isUrl, {
                            ...VTEX_FETCH_OPTS,
                            headers: {
                                        'Accept': 'application/json',
                                        'User-Agent': 'Mozilla/5.0 (compatible; TenuteBot/1.0)',
                            },
                  });
                  if (isRes.ok) {
                            const isData = await isRes.json();
                            const p = isData?.products?.[0];
                            if (p?.productName) {
                                        return {
                                                      name: safe(p.productName),
                                                      brand: safe(p.brand),
                                                      description: safe(p.description).replace(/<[^>]+>/g, '').substring(0, 200),
                                                      category: safe(p.categories?.[0] || '').split('/').filter(Boolean).pop() || '',
                                                      image_url: safe(p.items?.[0]?.images?.[0]?.imageUrl || ''),
                                                      price_ref: p.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || null,
                                                      _store: storeName,
                                        };
                            }
                  }
                  // Fallback: VTEX Legacy catalog search by EAN
                                const legacyUrl = `https://${host}/api/catalog_system/pub/products/search?fq=alternateIds_Ean:${ean}&_from=0&_to=1`;
                  const legacyRes = await fetch(legacyUrl, {
                            ...VTEX_FETCH_OPTS,
                            headers: {
                                        'Accept': 'application/json',
                                        'User-Agent': 'Mozilla/5.0 (compatible; TenuteBot/1.0)',
                            },
                  });
                  if (!legacyRes.ok) return null;
                  const legacyData = await legacyRes.json();
                  if (!Array.isArray(legacyData) || legacyData.length === 0) return null;
                  const p = legacyData[0];
                  if (!p?.productName) return null;
                  return {
                            name: safe(p.productName),
                            brand: safe(p.brand),
                            description: safe(p.description).replace(/<[^>]+>/g, '').substring(0, 200),
                            category: safe(p.categories?.[0] || '').split('/').filter(Boolean).pop() || '',
                            image_url: safe(p.items?.[0]?.images?.[0]?.imageUrl || ''),
                            price_ref: p.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || null,
                            _store: storeName,
                  };
          })
        );
    for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
                  const { _store: _unused, ...suggested } = result.value as Suggested & { _store?: string };
                  return suggested;
          }
    }
    return null;
}

// — Handler principal ————————————————————————
export async function GET(req: NextRequest) {
    if (!checkAuth(req)) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

  const rawEan = req.nextUrl.searchParams.get('ean');
    if (!rawEan) return NextResponse.json({ error: 'EAN requerido' }, { status: 400 });

  const ean = normalizeBarcodeDigits(rawEan);
    if (!isValidGtinDigits(ean)) {
          return NextResponse.json({ error: 'EAN inválido' }, { status: 400 });
    }

  // 1. Buscar en Tenute primero
  const supabase = createAdminClient();
    const existing = await supabase
      .from('products')
              .select('id, name, slug, image_url, brand, description, price, categories(name)')
      .eq('ean', ean)
      .maybeSingle();

  if (existing) {
    return NextResponse.json({
          ean, found: true, source: 'tenute',
          existing_product: {
            id: existing.id,
            name: existing.name,
            slug: existing.slug,
            image_url: existing.image_url,
            brand: (existing as any).brand ?? null,
            description: (existing as any).description ?? null,
            price: (existing as any).price ?? null,
            category_name: (existing as any).categories?.name ?? null,
          },
        } satisfies BarcodeLookupResult);

  // 2. APIs con key dedicada (en paralelo)
  const [goUpcR, barcodeR, eanR] = await Promise.all([
        lookupGoUpc(ean),
        lookupBarcodeLookup(ean),
        lookupEanSearch(ean),
      ]);
    if (goUpcR) return NextResponse.json({ ean, found: true, source: 'go_upc', suggested: goUpcR } satisfies BarcodeLookupResult);
    if (barcodeR) return NextResponse.json({ ean, found: true, source: 'barcode_lookup', suggested: barcodeR } satisfies BarcodeLookupResult);
    if (eanR) return NextResponse.json({ ean, found: true, source: 'ean_search', suggested: eanR } satisfies BarcodeLookupResult);

  // 3. APIs gratuitas de productos (en paralelo)
  const [offR, opdR, upcR] = await Promise.all([
        lookupOFF(ean),
        lookupOpenProductData(ean),
        lookupUpcItemDb(ean),
      ]);
    const freeR = offR ?? opdR ?? upcR;
    if (freeR) {
          const src = offR ? 'open_food_facts' : opdR ? 'open_product_data' : 'upcitemdb';
          return NextResponse.json({ ean, found: true, source: src, suggested: freeR } satisfies BarcodeLookupResult);
    }

  // 4. Tiendas chilenas — fallback para EANs locales (en paralelo)
  const chileanR = await lookupChileanStores(ean);
    if (chileanR) {
          return NextResponse.json({ ean, found: true, source: 'chilean_store', suggested: chileanR } satisfies BarcodeLookupResult);
    }

  // 5. Búsqueda web — el fallback final (en paralelo, usa lo que esté disponible)
  const [googleR, braveR, serpR] = await Promise.all([
        lookupGoogleSearch(ean),
        lookupBraveSearch(ean),
        lookupSerpApi(ean),
      ]);
    const webR = googleR ?? braveR ?? serpR;
    if (webR) {
          return NextResponse.json({ ean, found: true, source: 'web_search', suggested: webR } satisfies BarcodeLookupResult);
    }

  // 6. Nada encontrado — devolver EAN para que el usuario complete manualmente
  return NextResponse.json({ ean, found: false, source: 'not_found' } satisfies BarcodeLookupResult);
}
