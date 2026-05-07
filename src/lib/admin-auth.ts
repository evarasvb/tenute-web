import { NextRequest, NextResponse } from 'next/server';

export function isAdminSession(request: NextRequest): boolean {
  return request.cookies.get('admin_session')?.value === 'authenticated';
}

export function unauthorizedAdminResponse() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}
