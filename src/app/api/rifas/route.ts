import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('rifas')
    .select('id, title, description, status, total_tickets, ticket_price, draw_date, creator_name, rifa_prizes(id, title, image_url, position)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rifas: data || [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, total_tickets, ticket_price, max_per_person, whatsapp_number, bank_info, draw_date, prizes, creator_name, creator_phone } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'El título es requerido' }, { status: 400 });
  if (!whatsapp_number?.trim()) return NextResponse.json({ error: 'El WhatsApp es requerido' }, { status: 400 });

  const numTickets = Math.min(Math.max(parseInt(total_tickets) || 100, 1), 500);

  const supabase = createAdminClient();

  const { data: rifa, error: rifaErr } = await supabase
    .from('rifas')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      status: 'active',
      total_tickets: numTickets,
      ticket_price: parseInt(ticket_price) || 0,
      max_per_person: parseInt(max_per_person) || null,
      whatsapp_number: whatsapp_number.trim(),
      bank_info: bank_info?.trim() || null,
      draw_date: draw_date || null,
      creator_name: creator_name?.trim() || null,
      creator_phone: creator_phone?.trim() || null,
    })
    .select('id, owner_token')
    .single();

  if (rifaErr || !rifa) return NextResponse.json({ error: rifaErr?.message || 'Error al crear' }, { status: 500 });

  // Insert tickets in one shot
  const ticketRows = Array.from({ length: numTickets }, (_, i) => ({
    rifa_id: rifa.id,
    ticket_number: i + 1,
    status: 'available',
  }));
  await supabase.from('rifa_tickets').insert(ticketRows);

  // Insert prizes
  const prizeList = Array.isArray(prizes) ? prizes.slice(0, 5) : [];
  for (const [i, prize] of prizeList.entries()) {
    if (!prize.title?.trim()) continue;
    await supabase.from('rifa_prizes').insert({
      rifa_id: rifa.id,
      title: prize.title.trim(),
      description: prize.description?.trim() || null,
      image_url: prize.image_url?.trim() || null,
      position: i + 1,
    });
  }

  return NextResponse.json({ rifa_id: rifa.id, owner_token: rifa.owner_token }, { status: 201 });
}
