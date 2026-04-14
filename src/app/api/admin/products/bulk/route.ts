import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  if (session?.value !== 'authenticated') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return null;
}

// PATCH /api/admin/products/bulk
// Body: { active: boolean, ids?: string[] }
export async function PATCH(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const body = await request.json();
  const { active, ids } = body as { active: boolean; ids?: string[] };

  if (typeof active !== 'boolean') {
    return NextResponse.json({ error: 'active debe ser true o false' }, { status: 400 });
  }

  let query = supabase.from('products').update({ active });

  if (ids && ids.length > 0) {
    query = query.in('id', ids);
  } else {
    query = query.neq('id', '00000000-0000-0000-0000-000000000000');
  }

  const { error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, updated: count });
}
