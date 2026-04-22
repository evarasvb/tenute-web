import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const raffleId = params.id;

  const { data: raffle, error: raffleError } = await supabase
    .from('raffles')
    .select('id, title, status')
    .eq('id', raffleId)
    .single();

  if (raffleError || !raffle) {
    return NextResponse.json({ error: 'Rifa no encontrada' }, { status: 404 });
  }

  const { data: paidEntries, error: entriesError } = await supabase
    .from('raffle_entries')
    .select('id, number, customer_name, customer_phone, customer_email')
    .eq('raffle_id', raffleId)
    .eq('payment_status', 'paid');

  if (entriesError) {
    return NextResponse.json({ error: entriesError.message }, { status: 500 });
  }

  if (!paidEntries || paidEntries.length === 0) {
    return NextResponse.json({ error: 'No hay participantes pagados para sortear' }, { status: 400 });
  }

  const winner = paidEntries[Math.floor(Math.random() * paidEntries.length)];

  const { error: markWinnersError } = await supabase
    .from('raffle_entries')
    .update({ is_winner: false, updated_at: new Date().toISOString() })
    .eq('raffle_id', raffleId);

  if (markWinnersError) {
    return NextResponse.json({ error: markWinnersError.message }, { status: 500 });
  }

  const { data: winnerUpdated, error: winnerError } = await supabase
    .from('raffle_entries')
    .update({ is_winner: true, winner_announced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', winner.id)
    .select()
    .single();

  if (winnerError) {
    return NextResponse.json({ error: winnerError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    raffle: {
      id: raffle.id,
      title: raffle.title,
    },
    winner: winnerUpdated,
    participantsCount: paidEntries.length,
  });
}
