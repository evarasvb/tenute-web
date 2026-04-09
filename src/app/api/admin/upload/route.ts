import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const sku = formData.get('sku') as string;

  if (!file || !sku) {
    return NextResponse.json({ error: 'Archivo y SKU requeridos' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `catalog/${sku}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('products')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage
    .from('products')
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrl.publicUrl });
}
