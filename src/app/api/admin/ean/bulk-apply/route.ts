import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { validateEAN13 } from '@/lib/ean';
import { planEanAssignments, toEan13 } from '@/lib/barcode';

function normaliseBarcode(raw: string): string {
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 12) return `0${digits}`;
  return digits;
}

// Bulk-apply: assign EAN barcodes to multiple products
// POST body: { assignments: Array<{ product_id: string; ean: string }> }

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

  // Deduplicate assignments by product_id using a plain object (keep last)
  // Using Record instead of Map to avoid --downlevelIteration requirement
  const deduped: Record<string, string> = {};
  for (const a of assignments) {
    deduped[a.product_id] = normaliseBarcode(a.ean);
  }

  const supabase = createAdminClient();
  const productIds = Object.keys(deduped);

  // Fetch current barcodes to detect existing valid EANs
  const { data: existingProducts, error: fetchError } = await supabase
    .from('products')
    .select('id, name, sku, barcode')
    .in('id', productIds);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  type ProductRow = { id: string; name: string; sku: string | null; barcode: string | null };
  const existingMap: Record<string, ProductRow> = {};
  for (const p of (existingProducts ?? []) as ProductRow[]) {
    existingMap[p.id] = p;
  }

  const applied: Array<{ product_id: string; name: string; ean: string }> = [];
  const skipped: Array<{ product_id: string; name: string; reason: string }> = [];
  const failed: Array<{ product_id: string; error: string }> = [];
  const nameFor = (pid: string) => existingMap[pid]?.name ?? '';

  // Productos inexistentes -> fallan de inmediato y no entran al planificador.
  const assignableIds = productIds.filter((pid) => {
    if (existingMap[pid]) return true;
    failed.push({ product_id: pid, error: 'Producto no encontrado' });
    return false;
  });

  // Detectar EANs ya usados por OTRO producto en la base, para no chocar con el
  // índice único (origen del error "ya está asignado / producto ya existente").
  const targetEans = [...new Set(assignableIds.map((pid) => deduped[pid]))];
  const takenByOther = new Map<string, string>();
  if (targetEans.length > 0) {
    const { data: owners } = await supabase
      .from('products')
      .select('id, barcode')
      .in('barcode', targetEans);
    for (const o of (owners ?? []) as Array<{ id: string; barcode: string | null }>) {
      if (o.barcode) takenByOther.set(toEan13(o.barcode), o.id);
    }
  }

  const plan = planEanAssignments(
    assignableIds.map((pid) => ({ product_id: pid, ean: deduped[pid] })),
    { currentBarcode: (pid) => existingMap[pid]?.barcode ?? null, takenByOther }
  );

  for (const s of plan.skipped) {
    skipped.push({ product_id: s.product_id, name: nameFor(s.product_id), reason: s.reason });
  }

  for (const { product_id: productId, ean } of plan.apply) {
    const { error: updateError } = await supabase
      .from('products')
      .update({ barcode: ean, updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (updateError) {
      failed.push({ product_id: productId, error: updateError.message });
    } else {
      applied.push({ product_id: productId, name: nameFor(productId), ean });
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
