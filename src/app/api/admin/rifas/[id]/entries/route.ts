import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();

  const { data: entries, error } = await supabase
    .from('raffle_entries')
    .select('*')
    .eq('raffle_id', params.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const paid = (entries || []).filter((x) => x.payment_status === 'paid');
  const pending = (entries || []).filter((x) => x.payment_status === 'pending');

  return NextResponse.json({
    data: entries || [],
    summary: {
      total: (entries || []).length,
      paid: paid.length,
      pending: pending.length,
    },
  });
}
