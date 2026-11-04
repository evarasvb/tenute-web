import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Sesión de administrador firmada.
 * Token: v1.<expMs>.<nonce>.<firma HMAC-SHA256(ADMIN_SESSION_SECRET)>.
 * Falla cerrado: sin ADMIN_SESSION_SECRET (>= 32 caracteres) ninguna sesión es válida y no se puede iniciar sesión.
 * Rotar ADMIN_SESSION_SECRET invalida todas las sesiones abiertas.
 */
export const ADMIN_COOKIE = 'admin_session';
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 horas
const TOKEN_VERSION = 'v1';

function getSecret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

export function isAdminAuthConfigured(): boolean {
  return getSecret() !== null && !!process.env.ADMIN_PASSWORD;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/** Comparación en tiempo constante, también cuando los largos difieren. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a, 'utf8').digest();
  const hb = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(ha, hb) && a.length === b.length;
}

export function createAdminSessionToken(now: number = Date.now()): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const exp = now + ADMIN_SESSION_TTL_SECONDS * 1000;
  const nonce = randomBytes(16).toString('base64url');
  const payload = `${TOKEN_VERSION}.${exp}.${nonce}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyAdminSessionToken(token: string | undefined | null, now: number = Date.now()): boolean {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== TOKEN_VERSION) return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp <= now) return false;
  const expected = sign(parts.slice(0, 3).join('.'), secret);
  return safeEqual(parts[3], expected);
}

type CookieReader = { get(name: string): { value: string } | undefined };

export function isAdminSession(request: NextRequest | { cookies: CookieReader }): boolean {
  return verifyAdminSessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
}

/** Para rutas que leen cookies() de next/headers. */
export function isAdminCookieStore(store: CookieReader): boolean {
  return verifyAdminSessionToken(store.get(ADMIN_COOKIE)?.value);
}

export function adminCookieOptions(maxAge: number = ADMIN_SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge,
  };
}

export function unauthorizedAdminResponse() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}

// ── Límite de intentos de login (por IP, en memoria de cada instancia; es un freno, no una garantía) ──
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; first: number }>();

export function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export function loginBlockedFor(ip: string, now: number = Date.now()): number {
  const a = attempts.get(ip);
  if (!a) return 0;
  if (now - a.first > LOGIN_WINDOW_MS) {
    attempts.delete(ip);
    return 0;
  }
  return a.count >= LOGIN_MAX_ATTEMPTS ? Math.ceil((a.first + LOGIN_WINDOW_MS - now) / 1000) : 0;
}

export function registerFailedLogin(ip: string, now: number = Date.now()): void {
  const a = attempts.get(ip);
  if (!a || now - a.first > LOGIN_WINDOW_MS) attempts.set(ip, { count: 1, first: now });
  else a.count += 1;
  if (attempts.size > 10_000) attempts.clear();
}

export function clearLoginAttempts(ip: string): void {
  attempts.delete(ip);
}
