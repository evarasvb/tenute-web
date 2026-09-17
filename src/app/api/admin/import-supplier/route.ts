import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { fetchSupplierProducts, SUPPLIERS, type SupplierProduct } from '@/lib/suppliers/catalog';
import { computeSalePrice, makeSlug } from '@/lib/suppliers/pricing';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function unauthorized() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}

/** Marca los productos ya existentes (por EAN o SKU) para no duplicar. */
async function findExisting(
  supabase: ReturnType<typeof createAdminClient>,
  items: SupplierProduct[]
): Promise<{ eans: Set<string>; skus: Set<string> }> {
  const eans = items.map((i) => i.ean).filter((e): e is string => !!e);
  const skus = items.map((i) => `${i.supplierSku}`).filter(Boolean);
  const existingEans = new Set<string>();
  const existingSkus = new Set<string>();

  if (eans.length) {
    const { data } = await supabase.from('products').select('barcode').in('barcode', eans);
    for (const r of data || []) if (r.barcode) existingEans.add(String(r.barcode));
  }
  const prefixed = skus.map((s) => `PROV-${s}`);
  if (prefixed.length) {
    const { data } = await supabase.from('products').select('sku').in('sku', prefixed);
    for (const r of data || []) if (r.sku) existingSkus.add(String(r.sku));
  }
  return { eans: existingEans, skus: existingSkus };
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') return unauthorized();

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }

  const action = body?.action === 'commit' ? 'commit' : 'preview';
  const supplier = String(body?.supplier || '');
  const margin = Math.max(0, Math.min(500, Number(body?.margin) || 40));
  if (!SUPPLIERS[supplier]) {
    return NextResponse.json({ error: 'Proveedor no soportado' }, { status: 400 });
  }

  const supabase = createAdminClient();

  /* ---------------- PREVIEW ---------------- */
  if (action === 'preview') {
    const query = String(body?.query || '').trim();
    const limit = Math.max(1, Math.min(50, Number(body?.limit) || 20));
    if (!query) return NextResponse.json({ error: 'Escribe un término de búsqueda' }, { status: 400 });

    let items: SupplierProduct[];
    try {
      items = await fetchSupplierProducts(supplier, query, limit);
    } catch (e) {
      return NextResponse.json(
        { error: `No se pudo consultar ${SUPPLIERS[supplier].label}: ${e instanceof Error ? e.message : 'error de red'}` },
        { status: 502 }
      );
    }

    const existing = await findExisting(supabase, items);
    const rows = items.map((it) => {
      const price = computeSalePrice(it.cost, margin);
      const isDup = (it.ean && existing.eans.has(it.ean)) || existing.skus.has(`PROV-${it.supplierSku}`);
      return { ...it, price, margin, duplicate: !!isDup };
    });

    return NextResponse.json({
      supplier: SUPPLIERS[supplier].label,
      margin,
      count: rows.length,
      newCount: rows.filter((r) => !r.duplicate).length,
      dupCount: rows.filter((r) => r.duplicate).length,
      items: rows,
    });
  }

  /* ---------------- COMMIT ---------------- */
  const publish = body?.publish === true;
  const incoming: any[] = Array.isArray(body?.items) ? body.items : [];
  if (incoming.length === 0) return NextResponse.json({ error: 'No hay productos seleccionados' }, { status: 400 });

  // Normaliza y recalcula el precio en el server (no confiar en el precio del cliente).
  const normalized: SupplierProduct[] = incoming
    .map((i) => ({
      supplierSku: String(i.supplierSku || ''),
      name: String(i.name || '').trim(),
      brand: i.brand ? String(i.brand) : null,
      ean: i.ean ? String(i.ean).trim() : null,
      description: i.description ? String(i.description) : null,
      imageUrl: i.imageUrl ? String(i.imageUrl) : null,
      cost: Math.max(0, Math.round(Number(i.cost) || 0)),
      url: i.url ? String(i.url) : null,
      category: i.category ? String(i.category) : null,
    }))
    .filter((i) => i.name && i.cost > 0 && i.supplierSku);

  const existing = await findExisting(supabase, normalized);
  const now = new Date().toISOString();

  let inserted = 0, skipped = 0;
  const errors: string[] = [];

  for (const it of normalized) {
    const sku = `PROV-${it.supplierSku}`;
    const isDup = (it.ean && existing.eans.has(it.ean)) || existing.skus.has(sku);
    if (isDup) { skipped++; continue; }

    const price = computeSalePrice(it.cost, margin);
    const row: Record<string, any> = {
      name: it.name,
      slug: makeSlug(it.name, it.supplierSku),
      description: it.description,
      price,
      cost_price: it.cost,
      margin,
      stock: 0,
      image_url: it.imageUrl,
      brand: it.brand,
      sku,
      barcode: it.ean || null,
      condition: 'new',
      active: publish,
      metadata: {
        source: 'proveedor',
        supplier: SUPPLIERS[supplier].label,
        supplier_key: supplier,
        supplier_url: it.url,
        supplier_category: it.category,
        availability: 'bajo_pedido',
        lead_days_min: 3,
        lead_days_max: 5,
        imported_at: now,
      },
    };

    const { error } = await supabase.from('products').insert(row);
    if (error) {
      // Reintento evitando choques de índices únicos (EAN o slug ya usados).
      if (/duplicate|unique/i.test(error.message)) {
        const retry = { ...row, barcode: null, slug: `${row.slug}-${Date.now().toString(36).slice(-4)}` };
        const { error: e2 } = await supabase.from('products').insert(retry);
        if (e2) { errors.push(`${it.name}: ${e2.message}`); continue; }
        inserted++;
        existing.skus.add(sku);
      } else {
        errors.push(`${it.name}: ${error.message}`);
      }
      continue;
    }
    inserted++;
    if (it.ean) existing.eans.add(it.ean);
    existing.skus.add(sku);
  }

  return NextResponse.json({
    inserted,
    skipped,
    errors: errors.slice(0, 10),
    errorCount: errors.length,
    published: publish,
  });
}
