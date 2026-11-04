import {
  createAdminSessionToken,
  verifyAdminSessionToken,
  safeEqual,
  isAdminSession,
  loginBlockedFor,
  registerFailedLogin,
  clearLoginAttempts,
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MS,
  ADMIN_SESSION_TTL_SECONDS,
} from '@/lib/admin-auth';

const SECRET = 'x'.repeat(40);
const reader = (value?: string) => ({ cookies: { get: () => (value === undefined ? undefined : { value }) } });

describe('admin-auth', () => {
  const env = process.env;
  beforeEach(() => { process.env = { ...env, ADMIN_SESSION_SECRET: SECRET, ADMIN_PASSWORD: 'clave-de-prueba' }; });
  afterAll(() => { process.env = env; });

  it('acepta un token recién firmado', () => {
    const t = createAdminSessionToken()!;
    expect(verifyAdminSessionToken(t)).toBe(true);
    expect(isAdminSession(reader(t))).toBe(true);
  });

  it('rechaza la cookie vieja literal "authenticated"', () => {
    expect(isAdminSession(reader('authenticated'))).toBe(false);
    expect(isAdminSession(reader())).toBe(false);
  });

  it('rechaza tokens alterados o expirados', () => {
    const now = Date.now();
    const t = createAdminSessionToken(now)!;
    const [v, exp, nonce, sig] = t.split('.');
    expect(verifyAdminSessionToken(`${v}.${Number(exp) + 1}.${nonce}.${sig}`)).toBe(false);
    expect(verifyAdminSessionToken(`${v}.${exp}.${nonce}.${sig.slice(0, -1)}${sig.endsWith('A') ? 'B' : 'A'}`)).toBe(false);
    expect(verifyAdminSessionToken(t, now + ADMIN_SESSION_TTL_SECONDS * 1000 + 1)).toBe(false);
  });

  it('falla cerrado sin ADMIN_SESSION_SECRET o con secreto corto', () => {
    const t = createAdminSessionToken()!;
    delete process.env.ADMIN_SESSION_SECRET;
    expect(createAdminSessionToken()).toBeNull();
    expect(verifyAdminSessionToken(t)).toBe(false);
    process.env.ADMIN_SESSION_SECRET = 'corto';
    expect(verifyAdminSessionToken(t)).toBe(false);
  });

  it('un token firmado con otro secreto no sirve', () => {
    const t = createAdminSessionToken()!;
    process.env.ADMIN_SESSION_SECRET = 'y'.repeat(40);
    expect(verifyAdminSessionToken(t)).toBe(false);
  });

  it('safeEqual', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });

  it('bloquea tras demasiados intentos y libera al pasar la ventana', () => {
    const ip = '203.0.113.9';
    const now = 1_000_000;
    clearLoginAttempts(ip);
    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) registerFailedLogin(ip, now);
    expect(loginBlockedFor(ip, now + 1000)).toBeGreaterThan(0);
    expect(loginBlockedFor(ip, now + LOGIN_WINDOW_MS + 1)).toBe(0);
  });
});
