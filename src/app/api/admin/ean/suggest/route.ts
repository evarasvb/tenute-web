import { NextRequest, NextResponse } from 'next/server';
import { validateEAN13 } from '@/lib/ean';

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  return session?.value === 'authenticated';
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type Candidate = {
  ean: string;
  source: string;
  product_name: string;
  brands: string;
  confidence: 'alta' | 'media' | 'baja';
  score: number;
};

function scoreCandidate(query: string, brand: string, candidateName: string, candidateBrand: string): number {
  const nq = normalize(query);
  const nb = normalize(brand);
  const nn = normalize(candidateName);
  const ncb = normalize(candidateBrand);
  let score = 0;
  if (nn.includes(nq) || nq.includes(nn)) score += 50;
  const queryTokens = nq.split(' ').filter(t => t.length > 2);
  const nameHits = queryTokens.filter(t => nn.includes(t)).length;
  score += Math.min(30, nameHits * 8);
  if (nb && ncb && (ncb.includes(nb) || nb.includes(ncb))) score += 20;
  return Math.min(100, score);
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = String(body?.name || '').trim();
    const brand = String(body?.brand || '').trim();

    if (!name) {
      return NextResponse.json({ error: 'Nombre de producto requerido' }, { status: 400 });
    }

    const searchTerms = encodeURIComponent(`${name} ${brand}`.trim());
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${searchTerms}&search_simple=1&json=1&page_size=12`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      return NextResponse.json({ error: 'No se pudo consultar fuente EAN' }, { status: 502 });
    }

    const data = await response.json();
    const products = Array.isArray(data?.products) ? data.products : [];
    const mapped: Candidate[] = products
      .map((p: Record<string, unknown>) => {
        const ean = String(p.code || '').trim();
        const productName = String(p.product_name || p.generic_name || '').trim();
        const brands = String(p.brands || '').trim();
        if (!validateEAN13(ean) || !productName) return null;
        const score = scoreCandidate(name, brand, productName, brands);
        return {
          ean,
          source: 'OpenFoodFacts',
          product_name: productName,
          brands,
          score,
          confidence: score >= 75 ? 'alta' : score >= 50 ? 'media' : 'baja',
        } as Candidate;
      })
      .filter((c: Candidate | null): c is Candidate => !!c)
      .sort((a: Candidate, b: Candidate) => b.score - a.score);

    const unique = mapped.filter((c, idx, arr) => arr.findIndex(x => x.ean === c.ean) === idx).slice(0, 8);

    return NextResponse.json({
      query: { name, brand },
      candidates: unique,
      recommendation: unique.find(c => c.confidence === 'alta') || unique[0] || null,
    });
  } catch {
    return NextResponse.json({ error: 'Error buscando sugerencias EAN' }, { status: 500 });
  }
}
