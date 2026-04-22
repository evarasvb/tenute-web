import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('raffles')
    .select('id, title, slug, description, hero_image_url, social_hashtag, draw_place, draw_date, number_price, total_numbers, available_numbers, featured_products, status')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}
