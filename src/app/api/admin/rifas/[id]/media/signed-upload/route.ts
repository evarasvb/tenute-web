import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

function sanitizeFilename(name: string) {
  const parts = name.split('.');
  const ext = parts.length > 1 ? parts.pop() : 'bin';
  const base = (parts.join('.') || 'archivo')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `${base || 'archivo'}.${String(ext || 'bin')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10) || 'bin'}`;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const body = (await request.json()) as {
    filename?: unknown;
    kind?: unknown;
  };

  const filename = String(body.filename || '').trim();
  if (!filename) {
    return NextResponse.json({ error: 'filename es obligatorio' }, { status: 400 });
  }

  const kind = body.kind === 'video' ? 'video' : 'image';
  const now = Date.now();
  const cleanName = sanitizeFilename(filename);
  const path = `${params.id}/${kind}/${now}-${cleanName}`;

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from('raffle-media')
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'No se pudo crear URL firmada' }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from('raffle-media').getPublicUrl(path);

  return NextResponse.json({
    token: data.token,
    path,
    signedUrl: data.signedUrl,
    publicUrl: publicUrlData.publicUrl,
  });
}
