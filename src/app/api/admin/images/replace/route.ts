import { NextRequest, NextResponse } from 'next/server';
import { replaceProductImageUrl } from '@/lib/product-images/storage';
import { isAdminSession, unauthorizedAdminResponse } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  if (!isAdminSession(request)) return unauthorizedAdminResponse();

  const body = await request.json().catch(() => ({}));
  const productId = typeof body.productId === 'string' ? body.productId.trim() : '';
  const newUrl = typeof body.newUrl === 'string' ? body.newUrl.trim() : '';

  if (!productId || !newUrl) {
    return NextResponse.json({ error: 'productId y newUrl son requeridos' }, { status: 400 });
  }

  try {
    await replaceProductImageUrl(productId, newUrl);
    return NextResponse.json({ ok: true, productId, imageUrl: newUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
