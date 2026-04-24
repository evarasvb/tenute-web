import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdminRole } from '@/lib/admin-session';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdminRole(request);
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
