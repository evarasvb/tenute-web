import { NextRequest, NextResponse } from 'next/server';

export type AdminRole = 'admin' | 'seller';
export type SellerModule =
  | 'ventas'
  | 'products'
  | 'orders'
  | 'rifas'
  | 'shipping'
  | 'dashboard'
  | 'categories'
  | 'compras'
  | 'proveedores';

export interface AdminSession {
  authenticated: boolean;
  role: AdminRole | null;
}

export const ADMIN_COOKIE_NAME = 'admin_session';
export const ADMIN_COOKIE_ADMIN_VALUE = 'authenticated';
export const ADMIN_COOKIE_SELLER_VALUE = 'sales';

type ApiPermission = {
  prefix: string;
  methods?: string[];
};

type SellerModuleConfig = {
  adminPrefix: string;
  apiPermissions: ApiPermission[];
};

const SELLER_MODULE_CONFIG: Record<SellerModule, SellerModuleConfig> = {
  ventas: {
    adminPrefix: '/admin/ventas',
    apiPermissions: [
      { prefix: '/api/admin/ventas' },
      { prefix: '/api/admin/products', methods: ['GET'] },
    ],
  },
  products: {
    adminPrefix: '/admin/products',
    apiPermissions: [
      { prefix: '/api/admin/products', methods: ['GET'] },
      { prefix: '/api/admin/brands', methods: ['GET'] },
      { prefix: '/api/admin/categories', methods: ['GET'] },
    ],
  },
  orders: {
    adminPrefix: '/admin/orders',
    apiPermissions: [{ prefix: '/api/admin/orders', methods: ['GET'] }],
  },
  rifas: {
    adminPrefix: '/admin/rifas',
    apiPermissions: [{ prefix: '/api/admin/rifas', methods: ['GET'] }],
  },
  shipping: {
    adminPrefix: '/admin/shipping',
    apiPermissions: [{ prefix: '/api/admin/shipping', methods: ['GET'] }],
  },
  dashboard: {
    adminPrefix: '/admin',
    apiPermissions: [{ prefix: '/api/admin/stats', methods: ['GET'] }],
  },
  categories: {
    adminPrefix: '/admin/categories',
    apiPermissions: [{ prefix: '/api/admin/categories', methods: ['GET'] }],
  },
  compras: {
    adminPrefix: '/admin/compras',
    apiPermissions: [{ prefix: '/api/admin/compras', methods: ['GET'] }],
  },
  proveedores: {
    adminPrefix: '/admin/proveedores',
    apiPermissions: [{ prefix: '/api/admin/proveedores', methods: ['GET'] }],
  },
};

const SELLER_AUTH_API_PREFIXES = ['/api/admin/check', '/api/admin/logout'];

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

export function getSellerAllowedModules(): SellerModule[] {
  const raw = process.env.SELLER_ALLOWED_MODULES || 'ventas';
  const modules = raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean) as SellerModule[];
  const valid = modules.filter((module) => SELLER_MODULE_CONFIG[module]);
  return valid.length > 0 ? Array.from(new Set(valid)) : ['ventas'];
}

export function getSellerAllowedAdminPrefixes(modules = getSellerAllowedModules()): string[] {
  return Array.from(new Set(modules.map((module) => SELLER_MODULE_CONFIG[module].adminPrefix)));
}

function matchesAdminPrefix(pathname: string, prefix: string): boolean {
  // '/admin' should only unlock dashboard, not every admin route.
  if (prefix === '/admin') return pathname === '/admin';
  return pathname === prefix || pathname.startsWith(prefix);
}

export function canSellerAccessAdminPath(pathname: string, modules = getSellerAllowedModules()): boolean {
  return getSellerAllowedAdminPrefixes(modules).some((prefix) => matchesAdminPrefix(pathname, prefix));
}

export function canSellerAccessAdminApi(
  pathname: string,
  method: string,
  modules = getSellerAllowedModules()
): boolean {
  if (SELLER_AUTH_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix))) {
    return true;
  }

  const upperMethod = method.toUpperCase();
  const permissions = modules.flatMap((module) => SELLER_MODULE_CONFIG[module].apiPermissions);
  return permissions.some((permission) => {
    const isPathAllowed = pathname === permission.prefix || pathname.startsWith(permission.prefix);
    if (!isPathAllowed) return false;
    if (!permission.methods || permission.methods.length === 0) return true;
    return permission.methods.includes(upperMethod);
  });
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
