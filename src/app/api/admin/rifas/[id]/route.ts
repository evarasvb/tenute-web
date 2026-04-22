import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

function normalizePayload(input: Record<string, unknown>) {
  const output: Record<string, unknown> = {};

  if (typeof input.title === 'string') output.title = input.title.trim();
  if (typeof input.slug === 'string') {
    output.slug = input.slug
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
  if (typeof input.description === 'string') output.description = input.description.trim() || null;
  if (typeof input.hero_image_url === 'string') output.hero_image_url = input.hero_image_url.trim() || null;
  if (typeof input.social_hashtag === 'string') output.social_hashtag = input.social_hashtag.trim() || null;
  if (typeof input.draw_place === 'string') output.draw_place = input.draw_place.trim() || null;
  if (typeof input.draw_date === 'string') output.draw_date = input.draw_date.trim() || null;
  if (typeof input.number_price === 'number') output.number_price = input.number_price;
  if (typeof input.total_numbers === 'number') output.total_numbers = input.total_numbers;
  if (typeof input.available_numbers === 'number') output.available_numbers = input.available_numbers;
  if (input.status === 'draft' || input.status === 'published') output.status = input.status;
  if (Array.isArray(input.featured_products)) {
    output.featured_products = input.featured_products
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 30);
  }

  return output;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const payload = normalizePayload(await request.json());

  if (typeof payload.total_numbers === 'number' && payload.total_numbers < 1) {
    return NextResponse.json({ error: 'La cantidad total de números debe ser mayor a 0' }, { status: 400 });
  }
  if (
    typeof payload.available_numbers === 'number' &&
    typeof payload.total_numbers === 'number' &&
    (payload.available_numbers < 0 || payload.available_numbers > payload.total_numbers)
  ) {
    return NextResponse.json({ error: 'Números disponibles inválidos' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('raffles')
    .update(payload)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const { error } = await supabase.from('raffles').delete().eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
