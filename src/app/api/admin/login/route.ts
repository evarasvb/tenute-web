import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  clearLoginAttempts,
  clientIp,
  createAdminSessionToken,
  isAdminAuthConfigured,
  loginBlockedFor,
  registerFailedLogin,
  safeEqual,
} from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  // Falla cerrado: sin ADMIN_PASSWORD o sin ADMIN_SESSION_SECRET no hay login posible.
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || !isAdminAuthConfigured()) {
    return NextResponse.json({ error: 'Acceso de administración no configurado' }, { status: 503 });
  }

  const ip = clientIp(request);
  const retryAfter = loginBlockedFor(ip);
  if (retryAfter > 0) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  let password = '';
  try {
    const body = await request.json();
    password = typeof body?.password === 'string' ? body.password : '';
  } catch {
    password = '';
  }

  if (!password || !safeEqual(password, adminPassword)) {
    registerFailedLogin(ip);
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  }

  const token = createAdminSessionToken();
  if (!token) {
    return NextResponse.json({ error: 'Acceso de administración no configurado' }, { status: 503 });
  }
  clearLoginAttempts(ip);

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
  return response;
}
