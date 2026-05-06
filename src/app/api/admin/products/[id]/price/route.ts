import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { isAdminSession, unauthorizedAdminResponse } from '@/lib/admin-auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminSession(request)) {
    return unauthorizedAdminResponse();
  }

  const body = await request.json().catch(() => ({}));
  const price = Number(body?.price);
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: 'price inválido' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .update({ price })
    .eq('id', params.id)
    .select('id, price')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
