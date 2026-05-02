import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { buildMetadata, getWarehouseStock, parseMetadata } from '@/lib/product-metadata';
import { isUniqueConstraintError, normalizeBarcode, validateBarcode } from '@/lib/validators';

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return null;
}

function isMissingBarcodeColumnError(message?: string) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    (normalized.includes('barcode') && normalized.includes('does not exist')) ||
    (normalized.includes('barcode') && normalized.includes('schema cache')) ||
    (normalized.includes('barcode') && normalized.includes('could not find'))
  );
}

function isBarcodeConstraintError(message?: string) {
  return isUniqueConstraintError(message) && (message || '').toLowerCase().includes('barcode');
}

function normalizeProductPayload(input: Record<string, unknown>) {
  const payload: Record<string, unknown> = { ...input };

  if (payload.stock_local21 == null && payload.stock_local != null) {
    payload.stock_local21 = Number(payload.stock_local) || 0;
  }
  delete payload.stock_local;

  if (typeof payload.barcode === 'string') {
    const barcode = normalizeBarcode(payload.barcode);
    payload.barcode = barcode.length > 0 ? barcode : null;
  }

  const currentMeta = parseMetadata(payload.metadata);
  if (payload.competitor_price != null) {
    const competitorRaw = Number(payload.competitor_price);
    currentMeta.competitor_price = Number.isFinite(competitorRaw) && competitorRaw > 0 ? competitorRaw : undefined;
  }
  if (typeof payload.competitor_source === 'string') {
    const source = payload.competitor_source.trim();
    currentMeta.competitor_source = source || undefined;
  }
  if (typeof payload.competitor_url === 'string') {
    const competitorUrl = payload.competitor_url.trim();
    currentMeta.competitor_url = competitorUrl || undefined;
  }
  if (payload.competitor_updated_at === null || typeof payload.competitor_updated_at === 'string') {
    const checked = typeof payload.competitor_updated_at === 'string' ? payload.competitor_updated_at.trim() : '';
    currentMeta.competitor_updated_at = checked || undefined;
  }
  payload.metadata = currentMeta;
  delete payload.competitor_price;
  delete payload.competitor_source;
  delete payload.competitor_url;
  delete payload.competitor_updated_at;

  return payload;
}

function normalizeProductRow(row: Record<string, unknown>) {
  const stockLocal21 = Number(row.stock_local21 ?? row.stock_local ?? 0) || 0;
  const barcode = typeof row.barcode === 'string' ? row.barcode : null;
  const metadata = parseMetadata(row.metadata);
  return {
    ...row,
    stock_local21: stockLocal21,
    stock_local: stockLocal21,
    barcode,
    competitor_price: metadata.competitor_price ?? null,
    competitor_source: metadata.competitor_source ?? null,
    competitor_url: metadata.competitor_url ?? null,
    competitor_updated_at: metadata.competitor_updated_at ?? null,
  };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('id', params.id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(normalizeProductRow(data as Record<string, unknown>));
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const supabase = createAdminClient();
  const body = normalizeProductPayload(await request.json());

  if (typeof body.barcode === 'string' && body.barcode) {
    const validation = validateBarcode(body.barcode, { allowCode128Like: true });
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Barcode inválido. Usa EAN-8, EAN-13, UPC o CODE128.' },
        { status: 400 }
      );
    }
    body.barcode = validation.normalized;
  }

  const updateData: Record<string, unknown> = { ...body };

  // Backward compatibility: some clients still send stock_local instead of stock_local21.
  if (typeof updateData.stock_local === 'number' && typeof updateData.stock_local21 !== 'number') {
    updateData.stock_local21 = updateData.stock_local;
  }
  delete updateData.stock_local;

  const metadataNeedsRebuild =
    typeof updateData.stock_ocoa === 'number' ||
    typeof updateData.stock_local21 === 'number' ||
    Object.prototype.hasOwnProperty.call(updateData, 'metadata');

  if (metadataNeedsRebuild) {
    const { data: currentProduct } = await supabase
      .from('products')
      .select('stock_ocoa, stock_local21, stock, metadata')
      .eq('id', params.id)
      .single();

    const currentStock = currentProduct
      ? getWarehouseStock(currentProduct as unknown as Record<string, unknown>)
      : { ocoa: 0, local21: 0 };

    const currentMeta = parseMetadata(currentProduct?.metadata);
    const bodyMeta = parseMetadata(updateData.metadata);
    const nextOcoa = typeof updateData.stock_ocoa === 'number' ? updateData.stock_ocoa : currentStock.ocoa;
    const nextLocal21 = typeof updateData.stock_local21 === 'number' ? updateData.stock_local21 : currentStock.local21;

    updateData.stock_ocoa = nextOcoa;
    updateData.stock_local21 = nextLocal21;
    updateData.stock = Math.max(0, nextOcoa + nextLocal21);

    updateData.metadata = buildMetadata({
      additional_images: bodyMeta.additional_images ?? currentMeta.additional_images ?? [],
      video_url: bodyMeta.video_url ?? currentMeta.video_url,
      competitor_price: bodyMeta.competitor_price ?? currentMeta.competitor_price,
      competitor_source: bodyMeta.competitor_source ?? currentMeta.competitor_source,
      competitor_url: bodyMeta.competitor_url ?? currentMeta.competitor_url,
      competitor_updated_at: bodyMeta.competitor_updated_at ?? currentMeta.competitor_updated_at,
      warehouse_stock: {
        ocoa: nextOcoa,
        local21: nextLocal21,
      },
    });
  }

  let { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    if (isMissingBarcodeColumnError(error?.message)) {
      delete updateData.barcode;
      const retry = await supabase
        .from('products')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
      if (!error && data) return NextResponse.json(normalizeProductRow(data as Record<string, unknown>));
    }
    if (isBarcodeConstraintError(error?.message)) {
      return NextResponse.json({ error: 'Ese barcode ya está asignado a otro producto.' }, { status: 409 });
    }
    if (error?.message?.includes('updated_at') || error?.message?.includes('column')) {
      delete updateData.updated_at;
      const { data: data2, error: error2 } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single();
      if (error2) return NextResponse.json({ error: error2.message }, { status: 500 });
      return NextResponse.json(normalizeProductRow(data2 as Record<string, unknown>));
    }
    return NextResponse.json({ error: error?.message || 'Error actualizando producto' }, { status: 500 });
  }
  return NextResponse.json(normalizeProductRow(data as Record<string, unknown>));
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const supabase = createAdminClient();
  const { error } = await supabase.from('products').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
