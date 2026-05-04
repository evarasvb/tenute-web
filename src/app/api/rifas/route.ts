import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
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
      draw_place,
      draw_date,
      min_sold_to_draw,
      status,
      raffle_prizes(
        id,
        position,
        title,
        description,
        declared_value,
        quantity
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
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}
