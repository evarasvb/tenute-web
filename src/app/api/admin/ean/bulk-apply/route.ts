import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { normalizeBarcodeDigits, validateEAN13 } from '@/lib/ean';

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

type UpdateRow = { productId?: string; product_id?: string; ean: string };

export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const raw: UpdateRow[] = Array.isArray(body?.updates)
      ? body.updates
      : Array.isArray(body?.items)
        ? body.items
        : [];

    if (!raw.length) {
      return NextResponse.json({ error: 'No hay items para aplicar' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const applied: { productId: string; ean: string }[] = [];
    const errors: string[] = [];

    for (const row of raw) {
      const productId = row.productId || row.product_id;
      const ean = normalizeBarcodeDigits(String(row.ean || ''));

      if (!productId || !ean) {
        errors.push('Item inválido (falta productId o ean)');
        continue;
      }

      if (ean.length !== 13 || !validateEAN13(ean)) {
        errors.push(`${productId}: EAN-13 inválido (${ean})`);
        continue;
      }

      const { error } = await supabase.from('products').update({ barcode: ean }).eq('id', productId);

      if (error) {
        errors.push(`${productId}: ${error.message}`);
      } else {
        applied.push({ productId, ean });
      }
    }

    return NextResponse.json({
      appliedCount: applied.length,
      applied,
      errors,
    });
  } catch {
    return NextResponse.json({ error: 'Error aplicando EAN en lote' }, { status: 500 });
  }
}
