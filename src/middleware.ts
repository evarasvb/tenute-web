import { NextRequest, NextResponse } from 'next/server';
import { getRoleFromAdminCookie, ADMIN_COOKIE_NAME } from '@/lib/admin-session';

function unauthorizedApiResponse() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = getRoleFromAdminCookie(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
  const isSellerAllowedProductsGet =
    role === 'seller' && pathname === '/api/admin/products' && request.method === 'GET';

  if (pathname.startsWith('/api/admin')) {
    if (pathname === '/api/admin/login') return NextResponse.next();
    if (!role) return unauthorizedApiResponse();
    if (role === 'seller') {
      if (
        pathname === '/api/admin/check' ||
        pathname === '/api/admin/logout' ||
        pathname.startsWith('/api/admin/ventas') ||
        isSellerAllowedProductsGet
      ) {
        return NextResponse.next();
      }
      return unauthorizedApiResponse();
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();
    if (!role) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    if (role === 'seller' && !pathname.startsWith('/admin/ventas')) {
      const ventasUrl = new URL('/admin/ventas', request.url);
      return NextResponse.redirect(ventasUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
