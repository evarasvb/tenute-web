import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('raffles')
    .select(
      `
      id,
      title,
      slug,
      description,
      hero_image_url,
      promo_headline,
      hashtag,
      draw_method,
      draw_date,
      draw_place,
      min_sold_to_draw,
      status,
      terms_md,
      raffle_prizes(
        id,
        position,
        title,
        description,
        declared_value,
        quantity,
        reserve_stock,
        product:products(id, name, sku, image_url)
      ),
      raffle_media(
        id,
        prize_id,
        kind,
        url,
        alt,
        sort_order
      )
    `
    )
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Rifa no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ data });
}
