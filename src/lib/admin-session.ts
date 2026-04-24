import { NextRequest, NextResponse } from 'next/server';

export type AdminRole = 'admin' | 'seller';

export interface AdminSession {
  authenticated: boolean;
  role: AdminRole | null;
}

export const ADMIN_COOKIE_NAME = 'admin_session';
export const ADMIN_COOKIE_ADMIN_VALUE = 'authenticated';
export const ADMIN_COOKIE_SELLER_VALUE = 'sales';

export function getRoleFromAdminCookie(value?: string | null): AdminRole | null {
  if (!value) return null;
  if (value === ADMIN_COOKIE_ADMIN_VALUE || value === 'role:admin') return 'admin';
  if (value === ADMIN_COOKIE_SELLER_VALUE || value === 'role:seller') return 'seller';
  return null;
}

export function getAdminSession(request: NextRequest): AdminSession {
  const cookieValue = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const role = getRoleFromAdminCookie(cookieValue);
  return { authenticated: !!role, role };
}

export function canAccessVentas(role: AdminRole | null): boolean {
  return role === 'admin' || role === 'seller';
}

export function isAdmin(role: AdminRole | null): boolean {
  return role === 'admin';
}

export function getCookieValueForRole(role: AdminRole): string {
  return role === 'admin' ? ADMIN_COOKIE_ADMIN_VALUE : ADMIN_COOKIE_SELLER_VALUE;
}

export function requireAdminRole(request: NextRequest): NextResponse | null {
  const session = getAdminSession(request);
  if (!session.authenticated || !isAdmin(session.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

export function requireVentasRole(request: NextRequest): NextResponse | null {
  const session = getAdminSession(request);
  if (!session.authenticated || !canAccessVentas(session.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}
