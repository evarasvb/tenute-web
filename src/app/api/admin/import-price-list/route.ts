import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { csvToObjects } from '@/lib/csv';
import { computeSalePrice, makeSlug } from '@/lib/suppliers/pricing';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function checkAuth(request: NextRequest) {
  return request.cookies.get('admin_session')?.value === 'authenticated';
}

/** Precio de venta según el modo de margen. */
function priceFromNeto(neto: number, margin: number, mode: 'margen_venta' | 'recargo'): number {
  if (mode === 'margen_venta') {
    const m = Math.min(99, Math.max(0, margin)) / 100;
    return Math.round(neto / (1 - m) / 10) * 10 || neto; // margen sobre precio de venta
  }
  return computeSalePrice(neto, margin); // recargo sobre costo
}

const num = (v: unknown) => {
  if (v == null) return NaN;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : NaN;
};

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  let text: string;
  let margin = 60;
  let mode: 'margen_venta' | 'recargo' = 'margen_venta';
  let publish = true;
  let supplier = 'Vanni';
  let commit = false;
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo (campo 'file')." }, { status: 400 });
    text = await file.text();
    margin = num(form.get('margin')) || 60;
    if (form.get('mode') === 'recargo') mode = 'recargo';
    publish = form.get('publish') !== 'false';
    supplier = (form.get('supplier') as string)?.trim() || 'Vanni';
    commit = form.get('commit') === 'true';
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el archivo.' }, { status: 400 });
  }

  const raw = csvToObjects(text);
  // Normaliza filas: acepta columnas sku|codigo, name|descripcion, neto|precio|cost.
  const rows = raw
    .map((r) => {
      const sku = (r.sku || r.codigo || r['código'] || '').trim();
      const name = (r.name || r.descripcion || r['descripción'] || '').trim();
      const neto = num(r.neto ?? r.precio ?? r.precio_neto ?? r.cost ?? r.cost_price);
      return { sku, name, neto };
    })
    .filter((r) => r.sku && Number.isFinite(r.neto) && r.neto > 0 && /[a-z0-9]/i.test(r.name));

  if (rows.length === 0) return NextResponse.json({ error: 'El archivo no tiene filas válidas (sku, name, neto).' }, { status: 400 });

  const supabase = createAdminClient();

  // Existentes por SKU (en lotes para el IN).
  const existing = new Map<string, string>(); // sku -> id
  const skus = rows.map((r) => r.sku);
  for (let i = 0; i < skus.length; i += 400) {
    const chunk = skus.slice(i, i + 400);
    const { data } = await supabase.from('products').select('id, sku').in('sku', chunk);
    for (const p of data || []) if (p.sku) existing.set(String(p.sku), String(p.id));
  }

  const toUpdate = rows.filter((r) => existing.has(r.sku));
  const toInsert = rows.filter((r) => !existing.has(r.sku));

  if (!commit) {
    const sample = rows.slice(0, 8).map((r) => ({ ...r, price: priceFromNeto(r.neto, margin, mode), nuevo: !existing.has(r.sku) }));
    return NextResponse.json({
      preview: true, margin, mode,
      total: rows.length, actualizar: toUpdate.length, insertar: toInsert.length,
      sample,
    });
  }

  let updated = 0, inserted = 0;
  const errors: string[] = [];

  // Actualiza SOLO precio/costo/margen (nunca stock ni nombre).
  for (const r of toUpdate) {
    const id = existing.get(r.sku)!;
    const { error } = await supabase.from('products')
      .update({ cost_price: r.neto, price: priceFromNeto(r.neto, margin, mode), margin, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) errors.push(`${r.sku}: ${error.message}`); else updated++;
  }

  // Inserta nuevos como "bajo pedido".
  const now = new Date().toISOString();
  for (const r of toInsert) {
    const row = {
      name: r.name,
      slug: makeSlug(r.name, r.sku),
      sku: r.sku,
      cost_price: r.neto,
      price: priceFromNeto(r.neto, margin, mode),
      margin,
      stock: 0,
      active: publish,
      condition: 'new',
      metadata: {
        source: 'proveedor', supplier, availability: 'bajo_pedido',
        lead_days_min: 3, lead_days_max: 5, imported_at: now,
      },
    };
    const { error } = await supabase.from('products').insert(row);
    if (error) {
      if (/duplicate|unique/i.test(error.message)) {
        const { error: e2 } = await supabase.from('products').insert({ ...row, slug: `${row.slug}-${Date.now().toString(36).slice(-4)}` });
        if (e2) { errors.push(`${r.sku}: ${e2.message}`); continue; }
        inserted++;
      } else errors.push(`${r.sku}: ${error.message}`);
      continue;
    }
    inserted++;
  }

  return NextResponse.json({ committed: true, updated, inserted, errorCount: errors.length, errors: errors.slice(0, 15) });
}
