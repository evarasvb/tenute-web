import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdminRole } from '@/lib/admin-session';

function normalizePayload(input: Record<string, unknown>) {
  const slug =
    typeof input.slug === 'string' && input.slug.trim()
      ? input.slug
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
      : '';

  return {
    title: String(input.title || '').trim(),
    slug,
    description: String(input.description || '').trim() || null,
    hero_image_url: String(input.hero_image_url || '').trim() || null,
    social_hashtag: String(input.social_hashtag || '').trim() || null,
    draw_place: String(input.draw_place || '').trim() || null,
    draw_date: String(input.draw_date || '').trim() || null,
    number_price: Number(input.number_price || 0),
    total_numbers: Number(input.total_numbers || 0),
    available_numbers: Number(input.available_numbers || 0),
    status: input.status === 'draft' ? 'draft' : 'published',
    featured_products: Array.isArray(input.featured_products)
      ? input.featured_products
          .map((item) => String(item || '').trim())
          .filter(Boolean)
          .slice(0, 30)
      : [],
  };
}

export async function GET(request: NextRequest) {
  const authError = requireAdminRole(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('raffles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data: data || [] });
}

export async function POST(request: NextRequest) {
  const authError = requireAdminRole(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const payload = normalizePayload(await request.json());

  if (!payload.title) {
    return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });
  }
  if (!payload.slug) {
    return NextResponse.json({ error: 'El slug es obligatorio' }, { status: 400 });
  }
  if (payload.total_numbers < 1) {
    return NextResponse.json({ error: 'La cantidad total de números debe ser mayor a 0' }, { status: 400 });
  }

  if (payload.available_numbers < 0 || payload.available_numbers > payload.total_numbers) {
    return NextResponse.json({ error: 'Números disponibles inválidos' }, { status: 400 });
  }

  const { data, error } = await supabase.from('raffles').insert(payload).select().single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
