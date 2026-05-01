import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const { data: rifa, error } = await supabase
    .from('rifas')
    .select('id, title, description, status, total_tickets, ticket_price, max_per_person, whatsapp_number, bank_info, draw_date, prizes:rifa_prizes(id, title, description, image_url, position)')
    .eq('id', params.id)
    .in('status', ['active', 'closed', 'completed'])
    .single();

  if (error || !rifa) return NextResponse.json({ error: 'Rifa no encontrada' }, { status: 404 });

  // Only return ticket numbers + statuses (no buyer info for privacy)
  const { data: tickets } = await supabase
    .from('rifa_tickets')
    .select('ticket_number, status')
    .eq('rifa_id', params.id)
    .order('ticket_number', { ascending: true });

  const sortedPrizes = (rifa.prizes || []).sort((a: { position: number }, b: { position: number }) => a.position - b.position);

  return NextResponse.json({ rifa: { ...rifa, prizes: sortedPrizes }, tickets: tickets || [] });
}
