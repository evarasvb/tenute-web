import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated';
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('rifas')
    .select('*, prizes:rifa_prizes(id), tickets:rifa_tickets(status)')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rifas = (data || []).map((r) => ({
    ...r,
    prize_count: r.prizes?.length ?? 0,
    tickets_available: r.tickets?.filter((t: { status: string }) => t.status === 'available').length ?? 0,
    tickets_pending: r.tickets?.filter((t: { status: string }) => t.status === 'pending').length ?? 0,
    tickets_reserved: r.tickets?.filter((t: { status: string }) => t.status === 'reserved').length ?? 0,
    prizes: undefined,
    tickets: undefined,
  }));
  return NextResponse.json({ rifas });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const body = await request.json();
  const { title, description, total_tickets, ticket_price, max_per_person, whatsapp_number, bank_info, draw_date } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'El título es requerido' }, { status: 400 });
  const numTickets = parseInt(total_tickets) || 100;
  if (numTickets < 1 || numTickets > 1000) return NextResponse.json({ error: 'Total de tickets debe ser entre 1 y 1000' }, { status: 400 });

  const supabase = createAdminClient();

  const { data: rifa, error } = await supabase
    .from('rifas')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      total_tickets: numTickets,
      ticket_price: parseInt(ticket_price) || 0,
      max_per_person: max_per_person ? parseInt(max_per_person) : null,
      whatsapp_number: whatsapp_number?.trim() || '',
      bank_info: bank_info?.trim() || null,
      draw_date: draw_date || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate all ticket rows upfront
  const ticketRows = Array.from({ length: numTickets }, (_, i) => ({
    rifa_id: rifa.id,
    ticket_number: i + 1,
    status: 'available',
  }));

  const { error: ticketsError } = await supabase.from('rifa_tickets').insert(ticketRows);
  if (ticketsError) {
    await supabase.from('rifas').delete().eq('id', rifa.id);
    return NextResponse.json({ error: ticketsError.message }, { status: 500 });
  }

  return NextResponse.json({ rifa }, { status: 201 });
}
