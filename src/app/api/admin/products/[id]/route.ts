import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('id', params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
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
    .from('products')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
