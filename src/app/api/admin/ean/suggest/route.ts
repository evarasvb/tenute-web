import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// ─────────────────────────────────────────────
// Rate limiter: max 30 req/min per IP (in-memory, resets on cold start)
// ─────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; ts: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

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

// ─────────────────────────────────────────────
// EAN-13 checksum validator
// ─────────────────────────────────────────────
export function validateEAN13(code: string): boolean {
  if (!/^d{13}$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(code[12]);
}

// ─────────────────────────────────────────────
// Normalise barcode: strip leading zeros until 13 digits (EAN-13)
// or return as-is (UPC-A 12 → pad to 13)
// ─────────────────────────────────────────────
export function normaliseBarcode(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12) return '0' + digits; // UPC-A → EAN-13
  if (digits.length === 13) return digits;
  return digits; // return cleaned digits even if not std length
}

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated';
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (rateLimit(ip)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un minuto.' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('product_id');
  const productName = searchParams.get('name') ?? '';

  if (!productId && !productName) {
    return NextResponse.json({ error: 'Se requiere product_id o name' }, { status: 400 });
  }

  // If product_id given, fetch name from DB
  let nameToSearch = productName;
  if (productId) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, barcode')
      .eq('id', productId)
      .single();
    if (error || !data) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    if (data.barcode) {
      return NextResponse.json({
        product_id: productId,
        current_barcode: data.barcode,
        message: 'El producto ya tiene EAN asignado',
        suggested: null,
      });
    }
    nameToSearch = data.name;
  }

  // Query Open Food Facts by product name
  const suggestions = await fetchEANSuggestions(nameToSearch);

  return NextResponse.json({
    product_id: productId,
    name: nameToSearch,
    suggestions,
    queried_at: new Date().toISOString(),
  });
}

// ─────────────────────────────────────────────
// Fetch EAN suggestions from Open Food Facts
// ─────────────────────────────────────────────
async function fetchEANSuggestions(name: string): Promise<Array<{ ean: string; label: string; confidence: 'high' | 'low' }>> {
  const TIMEOUT_MS = 8_000;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(name)}&search_simple=1&action=process&json=1&page_size=5`;
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'TenuteWeb/1.0' } });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`OpenFoodFacts returned ${res.status}`);
    const json = await res.json();
    const products: Array<{ code?: string; product_name?: string }> = json?.products ?? [];
    const seen = new Set<string>();
    return products
      .filter(p => {
        const raw = p.code ?? '';
        const code = normaliseBarcode(raw);
        if (!validateEAN13(code) || seen.has(code)) return false;
        seen.add(code);
        return true;
      })
      .map(p => ({
        ean: normaliseBarcode(p.code!),
        label: p.product_name ?? 'Sin nombre',
        confidence: (p.product_name?.toLowerCase().includes(name.toLowerCase().slice(0, 5)) ? 'high' : 'low') as 'high' | 'low',
      }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[EAN/suggest] fetchEANSuggestions error:', msg);
    return [];
  }
}
