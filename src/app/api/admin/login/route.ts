import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, getCookieValueForRole, type AdminRole } from '@/lib/admin-session';

export async function POST(request: NextRequest) {
  const { password, role } = await request.json();
  const requestedRole: AdminRole = role === 'seller' ? 'seller' : 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'tenute2026';
  const sellerPassword = process.env.SELLER_PASSWORD || 'caja2026';
  const expectedPassword = requestedRole === 'admin' ? adminPassword : sellerPassword;

  if (password !== expectedPassword) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE_NAME, getCookieValueForRole(requestedRole), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
