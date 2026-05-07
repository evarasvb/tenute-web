import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('raffles')
    .select('id, title, slug, description, hero_image_url, social_hashtag, draw_place, draw_date, number_price, total_numbers, available_numbers, featured_products, status')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Rifa no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ data });
}
