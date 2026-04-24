import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-session';

export async function GET(request: NextRequest) {
  const session = getAdminSession(request);
  if (session.authenticated) {
    return NextResponse.json({ authenticated: true, role: session.role });
  }
  return NextResponse.json({ authenticated: false, role: null }, { status: 401 });
}
