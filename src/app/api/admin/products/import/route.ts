import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { csvToObjects } from '@/lib/csv';
import { cleanBarcodeForWrite } from '@/lib/barcode';
import { isUniqueConstraintError } from '@/lib/validators';

function checkAuth(request: NextRequest) {
  return request.cookies.get('admin_session')?.value === 'authenticated';
}

function toNumber(v: string | undefined): number | null {
  if (v == null || v.trim() === '') return null;
  const n = Number(v.replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function toBool(v: string | undefined, def = true): boolean {
  if (v == null || v.trim() === '') return def;
  return /^(1|true|si|sí|yes|y|activo|active)$/i.test(v.trim());
}

function slugify(name: string, suffix: string): string {
  const base = name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
  return `${base || 'producto'}-${suffix}`;
}

const isBarcodeConflict = (msg?: string) =>
  isUniqueConstraintError(msg) && (msg || '').toLowerCase().includes('barcode');

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let text: string;
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ inserted: 0, errors: ["Falta el archivo (campo 'file')."] }, { status: 400 });
    }
    text = await file.text();
  } catch {
    return NextResponse.json({ inserted: 0, errors: ['No se pudo leer el archivo.'] }, { status: 400 });
  }

  const rows = csvToObjects(text);
  if (rows.length === 0) {
    return NextResponse.json({ inserted: 0, errors: ['El archivo no tiene filas de datos.'] });
  }

  const supabase = createAdminClient();
  const errors: string[] = [];
  let inserted = 0;

  // Deduplicar barcodes dentro del archivo: el primero conserva el código,
  // los repetidos se cargan SIN código (y se avisa). Evita el choque del índice único.
  const seenBarcode = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const line = i + 2; // +1 cabecera, +1 base-1
    const name = (r.name || '').trim();
    if (!name) { errors.push(`Fila ${line}: falta 'name', se omite.`); continue; }

    const price = toNumber(r.price);
    if (price == null || price < 0) { errors.push(`Fila ${line} (${name}): 'price' inválido, se omite.`); continue; }

    let barcode = cleanBarcodeForWrite(r.barcode);
    if (barcode) {
      const prev = seenBarcode.get(barcode);
      if (prev) {
        errors.push(`Fila ${line} (${name}): barcode ${barcode} repetido (ya en fila ${prev}); se cargó sin código.`);
        barcode = null;
      } else {
        seenBarcode.set(barcode, line);
      }
    }

    const sku = (r.sku || '').trim() || null;
    const payload: Record<string, unknown> = {
      name,
      sku,
      barcode,
      price,
      cost_price: toNumber(r.cost_price) ?? 0,
      stock_ocoa: toNumber(r.stock_ocoa) ?? 0,
      stock_local21: toNumber(r.stock_local21) ?? 0,
      brand: (r.brand || '').trim() || null,
      description: (r.description || '').trim() || null,
      image_url: (r.image_url || '').trim() || null,
      active: toBool(r.active, true),
    };

    // ¿Existe ya un producto con ese SKU? -> actualizar; si no -> insertar.
    let existingId: string | null = null;
    if (sku) {
      const { data: found } = await supabase.from('products').select('id').eq('sku', sku).limit(1);
      existingId = (found && found[0]?.id) || null;
    }

    const write = (p: Record<string, unknown>) =>
      existingId
        ? supabase.from('products').update(p).eq('id', existingId)
        : supabase.from('products').insert({ ...p, slug: slugify(name, sku || Math.random().toString(36).slice(2, 8)) });

    let { error } = await write(payload);

    // Si el código choca con OTRO producto, reintentar sin código (no romper la carga).
    if (error && isBarcodeConflict(error.message)) {
      errors.push(`Fila ${line} (${name}): el barcode ya está en otro producto; se cargó sin código.`);
      ({ error } = await write({ ...payload, barcode: null }));
    }

    if (error) { errors.push(`Fila ${line} (${name}): ${error.message}`); continue; }
    inserted++;
  }

  return NextResponse.json({ inserted, errors });
}
