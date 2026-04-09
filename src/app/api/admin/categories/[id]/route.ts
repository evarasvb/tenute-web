import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('categories')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
