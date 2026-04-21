import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

type Confidence = 'alta' | 'media' | 'baja';

interface Candidate {
  ean: string;
  source: string;
  product_name: string;
  score: number;
  confidence: Confidence;
}

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

function normalizeText(v: string): string {
  return v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function confidenceFromScore(score: number): Confidence {
  if (score >= 85) return 'alta';
  if (score >= 60) return 'media';
  return 'baja';
}

function computeScore(productName: string, brand: string | null, hitName: string): number {
  const pName = normalizeText(productName);
  const hName = normalizeText(hitName);
  const pTokens = pName.split(' ').filter(Boolean);
  const hitTokens = hName.split(' ').filter(Boolean);
  const overlap = pTokens.filter((t) => hitTokens.includes(t)).length;
  const tokenScore = pTokens.length ? Math.round((overlap / pTokens.length) * 70) : 0;
  const brandScore = brand && hName.includes(normalizeText(brand)) ? 20 : 0;
  const containsScore = hName.includes(pName) ? 10 : 0;
  return Math.min(100, tokenScore + brandScore + containsScore);
}

async function searchCandidates(productName: string, brand?: string | null): Promise<Candidate[]> {
  const query = [brand, productName].filter(Boolean).join(' ').trim();
  if (!query) return [];

  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&json=1&page_size=15`;
  const resp = await fetch(url, { next: { revalidate: 0 } });
  if (!resp.ok) return [];

  const data = await resp.json();
  const products = Array.isArray(data.products) ? data.products : [];

  return products
    .map((p: Record<string, unknown>) => {
      const code = typeof p.code === 'string' ? p.code : '';
      if (!/^\d{8,14}$/.test(code)) return null;
      const name = typeof p.product_name === 'string' ? p.product_name : code;
      const score = computeScore(productName, brand || null, name);
      return {
        ean: code,
        product_name: name,
        score,
        confidence: confidenceFromScore(score),
        source: 'openfoodfacts',
      } as Candidate;
    })
    .filter((c: Candidate | null): c is Candidate => !!c)
    .sort((a: Candidate, b: Candidate) => b.score - a.score)
    .filter((c: Candidate, idx: number, arr: Candidate[]) => arr.findIndex((x) => x.ean === c.ean) === idx)
    .slice(0, 3);
}

export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
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
    const results = [];

    for (const p of products) {
      const candidates = await searchCandidates(p.name || '', p.brand || '');
      results.push({
        product_id: p.id,
        product_name: p.name,
        brand: p.brand,
        sku: p.sku,
        current_barcode: p.barcode,
        best: candidates[0] || null,
        candidates,
      });
    }

    return NextResponse.json({ total: results.length, results });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error sugiriendo EAN en lote' }, { status: 500 });
  }
}
