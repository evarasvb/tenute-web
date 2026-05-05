import { NextRequest, NextResponse } from 'next/server';
import {
  getRoleFromAdminCookie,
  ADMIN_COOKIE_NAME,
  canSellerAccessAdminApi,
  canSellerAccessAdminPath,
  getSellerAllowedAdminPrefixes,
} from '@/lib/admin-session';

function unauthorizedApiResponse() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = getRoleFromAdminCookie(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
  const sellerAllowedPrefixes = getSellerAllowedAdminPrefixes();
  const sellerHomePrefix = sellerAllowedPrefixes[0] || '/admin/ventas';

  if (pathname.startsWith('/api/admin')) {
    if (pathname === '/api/admin/login') return NextResponse.next();
    if (!role) return unauthorizedApiResponse();
    if (role === 'seller') {
      return canSellerAccessAdminApi(pathname, request.method)
        ? NextResponse.next()
        : unauthorizedApiResponse();
    }
    return NextResponse.next();
  }

  if (pathname === '/ventas') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();
    if (!role) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    if (role === 'seller' && !canSellerAccessAdminPath(pathname)) {
      const sellerHomeUrl = new URL(sellerHomePrefix, request.url);
      return NextResponse.redirect(sellerHomeUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/ventas', '/admin/:path*', '/api/admin/:path*'],
};
