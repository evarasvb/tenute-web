import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated';
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabase
    .from('rifa_tickets')
    .select('*')
    .eq('rifa_id', params.id)
    .order('ticket_number', { ascending: true });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: data || [] });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const body = await request.json();
  const { ticket_ids, action } = body; // action: 'confirm' | 'release'

  if (!Array.isArray(ticket_ids) || ticket_ids.length === 0)
    return NextResponse.json({ error: 'ticket_ids requerido' }, { status: 400 });
  if (!['confirm', 'release'].includes(action))
    return NextResponse.json({ error: 'action debe ser confirm o release' }, { status: 400 });

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const updatePayload = action === 'confirm'
    ? { status: 'reserved', payment_confirmed_at: now }
    : { status: 'available', reserved_at: null, payment_confirmed_at: null, buyer_name: null, buyer_phone: null };

  const { error } = await supabase
    .from('rifa_tickets')
    .update(updatePayload)
    .eq('rifa_id', params.id)
    .in('id', ticket_ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
