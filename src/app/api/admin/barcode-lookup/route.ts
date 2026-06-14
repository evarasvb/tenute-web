import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { isValidGtinDigits, normalizeBarcodeDigits } from '@/lib/ean';

function checkAuth(req: NextRequest) {
    return req.cookies.get('admin_session')?.value === 'authenticated';
  }

export interface BarcodeLookupResult {
    ean: string;
    found: boolean;
    source: 'tenute' | 'open_food_facts' | 'upcitemdb' | 'not_found';
    // Producto ya existente en Tenute
    existing_product?: {
          id: string;
          name: string;
          slug: string;
          image_url: string | null;
        };
    // Datos sugeridos desde API externa
    suggested?: {
          name: string;
          brand: string;
          description: string;
          category: string;
          image_url: string;
          price_ref: number | null;
        };
  }

// ── Proveedor 1: Open Food Facts (gratuito, sin key) ──────────────────
async function lookupOpenFoodFacts(ean: string): Promise<BarcodeLookupResult['suggested'] | null> {
    try {
          const res = await fetch(
                  `https://world.openfoodfacts.org/api/v2/product/${ean}?fields=product_name,brands,categories_tags,image_front_url,generic_name`,
                  { next: { revalidate: 0 } }
                );
          if (!res.ok) return null;
          const data = await res.json();
          if (data.status !== 1 || !data.product) return null;
          const p = data.product;
          const name = p.product_name || p.generic_name || '';
          if (!name) return null;
          const category = (p.categories_tags?.[0] || '').replace(/^[a-z]{2}:/, '');
          return {
                  name,
                  brand: p.brands || '',
                  description: p.generic_name || '',
                  category,
                  image_url: p.image_front_url || '',
                  price_ref: null,
                };
        } catch {
          return null;
        }
  }

// ── Proveedor 2: UPC Item DB (gratuito, 100 req/day sin key) ──────────
async function lookupUpcItemDb(ean: string): Promise<BarcodeLookupResult['suggested'] | null> {
    try {
          const res = await fetch(
                  `https://api.upcitemdb.com/prod/trial/lookup?upc=${ean}`,
                  { next: { revalidate: 0 } }
                );
          if (!res.ok) return null;
          const data = await res.json();
          const item = data.items?.[0];
          if (!item) return null;
          return {
                  name: item.title || '',
                  brand: item.brand || '',
                  description: item.description || '',
                  category: item.category || '',
                  image_url: item.images?.[0] || '',
                  price_ref: item.lowest_recorded_price || null,
                };
        } catch {
          return null;
        }
  }

// ── Proveedor 3: Go-UPC (requiere BARCODE_API_KEY) ────────────────────
async function lookupGoUpc(ean: string): Promise<BarcodeLookupResult['suggested'] | null> {
    const apiKey = process.env.BARCODE_API_KEY;
    if (!apiKey) return null;
    try {
          const res = await fetch(
                  `https://go-upc.com/api/v1/code/${ean}`,
                  { headers: { Authorization: `Bearer ${apiKey}` }, next: { revalidate: 0 } }
                );
          if (!res.ok) return null;
          const data = await res.json();
          const p = data.product;
          if (!p?.name) return null;
          return {
                  name: p.name,
                  brand: p.brand || '',
                  description: p.description || '',
                  category: p.category || '',
                  image_url: p.imageUrl || '',
                  price_ref: null,
                };
        } catch {
          return null;
        }
  }

export async function GET(req: NextRequest) {
    if (!checkAuth(req)) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

    const ean = normalizeBarcodeDigits(req.nextUrl.searchParams.get('ean') || '');
    if (!ean || !isValidGtinDigits(ean)) {
          return NextResponse.json({ error: 'EAN invalido' }, { status: 400 });
        }

    const supabase = createAdminClient();

    // 1. Buscar primero en el catálogo propio de Tenute
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

    // 2. Consulta en cascada: Go-UPC → Open Food Facts → UPC Item DB
    let suggested: BarcodeLookupResult['suggested'] | null = null;
    let source: BarcodeLookupResult['source'] = 'not_found';

    suggested = await lookupGoUpc(ean);
    if (suggested) {
          source = 'open_food_facts'; // go-upc fallback label
        }

    if (!suggested) {
          suggested = await lookupOpenFoodFacts(ean);
          if (suggested) source = 'open_food_facts';
        }

    if (!suggested) {
          suggested = await lookupUpcItemDb(ean);
          if (suggested) source = 'upcitemdb';
        }

    if (!suggested) {
          return NextResponse.json({
                  ean,
                  found: false,
                  source: 'not_found',
                } satisfies BarcodeLookupResult);
        }

    return NextResponse.json({
          ean,
          found: true,
          source,
          suggested,
        } satisfies BarcodeLookupResult);
  }
