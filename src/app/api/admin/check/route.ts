import { NextRequest, NextResponse } from 'next/server';
import { isAdminSession } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  if (isAdminSession(request)) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
