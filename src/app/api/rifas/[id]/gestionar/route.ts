import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

async function verifyToken(supabase: ReturnType<typeof import('@/lib/supabase').createAdminClient>, id: string, token: string | null) {
  if (!token) return null;
  const { data } = await supabase
    .from('rifas')
    .select('id, title, description, status, total_tickets, ticket_price, max_per_person, whatsapp_number, bank_info, draw_date, creator_name, creator_phone')
    .eq('id', id)
    .eq('owner_token', token)
    .single();
  return data;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const token = request.nextUrl.searchParams.get('token');
  const supabase = createAdminClient();
  const rifa = await verifyToken(supabase, params.id, token);
  if (!rifa) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const [{ data: pending }, { data: reserved }, { count: available }] = await Promise.all([
    supabase.from('rifa_tickets').select('*').eq('rifa_id', params.id).eq('status', 'pending').order('reserved_at', { ascending: false }),
    supabase.from('rifa_tickets').select('*').eq('rifa_id', params.id).eq('status', 'reserved').order('payment_confirmed_at', { ascending: false }),
    supabase.from('rifa_tickets').select('*', { count: 'exact', head: true }).eq('rifa_id', params.id).eq('status', 'available'),
  ]);

  return NextResponse.json({
    rifa,
    pending: pending || [],
    reserved: reserved || [],
    counts: { available: available || 0, pending: pending?.length || 0, reserved: reserved?.length || 0 },
  });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const token = request.nextUrl.searchParams.get('token');
  const supabase = createAdminClient();
  const rifa = await verifyToken(supabase, params.id, token);
  if (!rifa) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await request.json();
  const { ticket_ids, action } = body;
  const now = new Date().toISOString();

  if (action === 'confirm' && Array.isArray(ticket_ids)) {
    await supabase.from('rifa_tickets')
      .update({ status: 'reserved', payment_confirmed_at: now })
      .eq('rifa_id', params.id)
      .in('id', ticket_ids)
      .eq('status', 'pending');
  } else if (action === 'release' && Array.isArray(ticket_ids)) {
    await supabase.from('rifa_tickets')
      .update({ status: 'available', buyer_name: null, buyer_phone: null, reserved_at: null })
      .eq('rifa_id', params.id)
      .in('id', ticket_ids);
  } else if (action === 'activate') {
    await supabase.from('rifas').update({ status: 'active' }).eq('id', params.id);
  } else if (action === 'close') {
    await supabase.from('rifas').update({ status: 'closed' }).eq('id', params.id);
  } else {
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
