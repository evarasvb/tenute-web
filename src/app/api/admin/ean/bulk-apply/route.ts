import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

type BulkApplyItem = {
  product_id: string;
  ean: string;
};

export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const items: BulkApplyItem[] = Array.isArray(body?.items) ? body.items : [];

    if (!items.length) {
      return NextResponse.json({ error: 'No hay items para aplicar' }, { status: 400 });
    }

    const supabase = createAdminClient();

    let updated = 0;
    const errors: string[] = [];

    for (const item of items) {
      if (!item.product_id || !item.ean) {
        errors.push('Item inválido (falta product_id o ean)');
        continue;
      }

      const normalized = String(item.ean).replace(/\D/g, '');
      if (normalized.length < 8 || normalized.length > 14) {
        errors.push(`EAN inválido para ${item.product_id}`);
        continue;
      }

      const { error } = await supabase
        .from('products')
        .update({ barcode: normalized })
        .eq('id', item.product_id);

      if (error) {
        errors.push(`${item.product_id}: ${error.message}`);
      } else {
        updated += 1;
      }
    }

    return NextResponse.json({ updated, errors });
  } catch {
    return NextResponse.json({ error: 'Error aplicando EAN en lote' }, { status: 500 });
  }
}
