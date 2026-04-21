import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { validateEAN13, normaliseBarcode } from '@/app/api/admin/ean/suggest/route';

// Bulk-apply: assign EAN barcodes to multiple products
// POST body: { assignments: Array<{ product_id: string; ean: string }> }
// - Validates EAN-13 checksum for each assignment
// - Deduplicates: skips if product already has a valid EAN
// - Returns detailed summary: applied, skipped, failed

const MAX_BATCH = 50;

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated';
}

interface Assignment {
  product_id: string;
  ean: string;
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await request.json();
  const assignments: Assignment[] = body?.assignments ?? [];

  if (!Array.isArray(assignments) || assignments.length === 0) {
    return NextResponse.json({ error: 'assignments es requerido y no debe estar vacío' }, { status: 400 });
  }
  if (assignments.length > MAX_BATCH) {
    return NextResponse.json({ error: `Máximo ${MAX_BATCH} asignaciones por lote` }, { status: 400 });
  }

  // Validate all EAN codes before doing anything
  const prevalidationErrors: string[] = [];
  for (const a of assignments) {
    if (!a.product_id || typeof a.product_id !== 'string') {
      prevalidationErrors.push(`product_id inválido en entrada: ${JSON.stringify(a)}`);
      continue;
    }
    if (!a.ean || typeof a.ean !== 'string') {
      prevalidationErrors.push(`ean inválido para product_id ${a.product_id}`);
      continue;
    }
    const norm = normaliseBarcode(a.ean);
    if (!validateEAN13(norm)) {
      prevalidationErrors.push(`EAN inválido (checksum falla): "${a.ean}" para product_id ${a.product_id}`);
    }
  }
  if (prevalidationErrors.length > 0) {
    return NextResponse.json({ error: 'Validación fallida', details: prevalidationErrors }, { status: 400 });
  }

  // Deduplicate assignments by product_id (keep last)
  const deduped = new Map<string, string>();
  for (const a of assignments) {
    deduped.set(a.product_id, normaliseBarcode(a.ean));
  }

  const supabase = createAdminClient();
  const productIds = Array.from(deduped.keys());

  // Fetch current barcodes to detect existing valid EANs
  const { data: existingProducts, error: fetchError } = await supabase
    .from('products')
    .select('id, name, sku, barcode')
    .in('id', productIds);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const existingMap = new Map((existingProducts ?? []).map(p => [p.id, p]));

  const applied: Array<{ product_id: string; name: string; ean: string }> = [];
  const skipped: Array<{ product_id: string; name: string; reason: string }> = [];
  const failed: Array<{ product_id: string; error: string }> = [];

  for (const [productId, ean] of deduped.entries()) {
    const existing = existingMap.get(productId);
    if (!existing) {
      failed.push({ product_id: productId, error: 'Producto no encontrado' });
      continue;
    }

    // Skip if already has a valid EAN (strict deduplication)
    if (existing.barcode) {
      const normExisting = normaliseBarcode(existing.barcode);
      if (validateEAN13(normExisting)) {
        skipped.push({ product_id: productId, name: existing.name, reason: `Ya tiene EAN válido: ${normExisting}` });
        continue;
      }
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ barcode: ean, updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (updateError) {
      failed.push({ product_id: productId, error: updateError.message });
    } else {
      applied.push({ product_id: productId, name: existing.name, ean });
    }
  }

  const meta = {
    total: assignments.length,
    applied: applied.length,
    skipped: skipped.length,
    failed: failed.length,
  };

  console.log(`[EAN/bulk-apply] meta=${JSON.stringify(meta)}`);

  return NextResponse.json({ applied, skipped, failed, meta }, { status: 200 });
}
