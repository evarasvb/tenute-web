import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
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

  return payload;
}

function normalizeProductRow(row: Record<string, unknown>) {
  const stockLocal21 = Number(row.stock_local21 ?? row.stock_local ?? 0) || 0;
  const barcode = typeof row.barcode === 'string' ? row.barcode : null;
  return {
    ...row,
    stock_local21: stockLocal21,
    stock_local: stockLocal21,
    barcode,
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
