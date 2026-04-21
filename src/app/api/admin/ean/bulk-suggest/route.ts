import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { normalizeBarcodeDigits, validateEAN13 } from '@/lib/ean';

type Confidence = 'alta' | 'media' | 'baja';

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

function normalizeText(v: string): string {
  return v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function confidenceFromScore(score: number): Confidence {
  if (score >= 75) return 'alta';
  if (score >= 50) return 'media';
  return 'baja';
}

function scoreCandidate(queryName: string, queryBrand: string, hitName: string, hitBrand: string): number {
  const nq = normalizeText(queryName);
  const nb = normalizeText(queryBrand);
  const nn = normalizeText(hitName);
  const ncb = normalizeText(hitBrand);
  let score = 0;
  if (nn.includes(nq) || nq.includes(nn)) score += 50;
  const tokens = nq.split(' ').filter((t) => t.length > 2);
  const hits = tokens.filter((t) => nn.includes(t)).length;
  score += Math.min(30, hits * 8);
  if (nb && ncb && (ncb.includes(nb) || nb.includes(ncb))) score += 20;
  return Math.min(100, score);
}

async function searchBestEan(productName: string, brand?: string | null): Promise<{
  ean: string;
  product_name: string;
  brands: string;
  score: number;
  confidence: Confidence;
  source: string;
} | null> {
  const query = [brand, productName].filter(Boolean).join(' ').trim();
  if (!query) return null;

  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&json=1&page_size=15`;
  const resp = await fetch(url, { next: { revalidate: 0 } });
  if (!resp.ok) return null;

  const data = await resp.json();
  const products = Array.isArray(data.products) ? data.products : [];

  type Hit = { ean: string; product_name: string; brands: string; score: number; confidence: Confidence; source: string };
  const hits: Hit[] = products
    .map((p: Record<string, unknown>) => {
      const code = normalizeBarcodeDigits(String(p.code || ''));
      const name = String(p.product_name || p.generic_name || '').trim();
      const brands = String(p.brands || '').trim();
      if (!validateEAN13(code) || !name) return null;
      const score = scoreCandidate(productName, brand || '', name, brands);
      return {
        ean: code,
        product_name: name,
        brands,
        score,
        confidence: confidenceFromScore(score),
        source: 'OpenFoodFacts',
      };
    })
    .filter((h: Hit | null): h is Hit => !!h)
    .sort((a: Hit, b: Hit) => b.score - a.score);

  return hits[0] || null;
}

export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const limit = Math.min(100, Math.max(1, Number(body?.limit) || 30));
    const onlyWithoutBarcode = body?.only_without_barcode !== false;

    const supabase = createAdminClient();
    let query = supabase
      .from('products')
      .select('id,name,brand,sku,barcode')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (onlyWithoutBarcode) {
      query = query.or('barcode.is.null,barcode.eq.');
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const products = data || [];
    const suggestions: Array<{
      productId: string;
      productName: string;
      currentBarcode: string | null;
      suggestedEan: string;
      confidence: Confidence;
      score: number;
      source: string;
      referenceName?: string;
    }> = [];

    for (const p of products) {
      if (p.barcode && String(p.barcode).trim() !== '') continue;

      const best = await searchBestEan(p.name || '', p.brand || null);
      if (!best) continue;

      suggestions.push({
        productId: p.id,
        productName: p.name || '',
        currentBarcode: p.barcode,
        suggestedEan: best.ean,
        confidence: best.confidence,
        score: best.score,
        source: best.source,
        referenceName: best.product_name,
      });
    }

    return NextResponse.json({ suggestions, total: suggestions.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error sugiriendo EAN en lote' },
      { status: 500 }
    );
  }
}
