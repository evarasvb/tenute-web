import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

type MediaKind = 'image' | 'video';

const VALID_KINDS: MediaKind[] = ['image', 'video'];

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

function normalizeKind(value: unknown): MediaKind {
  if (typeof value === 'string' && VALID_KINDS.includes(value as MediaKind)) {
    return value as MediaKind;
  }
  return 'image';
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('raffle_media')
    .select('*')
    .eq('raffle_id', params.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const body = (await request.json()) as Record<string, unknown>;
  const url = String(body.url || '').trim();
  if (!url) {
    return NextResponse.json({ error: 'La URL del media es obligatoria' }, { status: 400 });
  }

  const prizeId = String(body.prize_id || '').trim() || null;
  const sortOrderRaw = Number(body.sort_order ?? 0);
  const sortOrder = Number.isFinite(sortOrderRaw) ? Math.max(0, Math.floor(sortOrderRaw)) : 0;

  const payload = {
    raffle_id: params.id,
    prize_id: prizeId,
    kind: normalizeKind(body.kind),
    url,
    alt: String(body.alt || '').trim() || null,
    sort_order: sortOrder,
  };

  const supabase = createAdminClient();
  const { data, error } = await supabase.from('raffle_media').insert(payload).select('*').single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get('id');
  if (!mediaId) {
    return NextResponse.json({ error: 'id es obligatorio para eliminar media' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('raffle_media')
    .delete()
    .eq('id', mediaId)
    .eq('raffle_id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
