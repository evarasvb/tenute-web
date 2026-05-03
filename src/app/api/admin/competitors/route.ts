import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { isAdminSession, unauthorizedAdminResponse } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  if (!isAdminSession(request)) {
    return unauthorizedAdminResponse();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('competitors')
    .select('id, name, base_url, active, created_at')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
