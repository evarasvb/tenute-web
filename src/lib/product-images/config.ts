const DEFAULT_ALLOWED_IMAGE_HOSTS = [
  'supabase.co',
  'tenute.cl',
  'tenute-web.vercel.app',
  'cdn.tenute.cl',
];

function normalizeHost(host: string): string {
  return host.trim().toLowerCase();
}

export function getAllowedImageHosts(): string[] {
  const raw = process.env.ALLOWED_IMAGE_HOSTS?.trim();
  if (!raw) return DEFAULT_ALLOWED_IMAGE_HOSTS;
  return raw
    .split(',')
    .map(normalizeHost)
    .filter(Boolean);
}

export function getPublicSupabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  return value;
}

export function getImageBucketName(): string {
  return process.env.PRODUCT_IMAGES_BUCKET?.trim() || 'product-images';
}

export function extractHostname(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isSuspiciousDomain(rawUrl: string): boolean {
  const host = extractHostname(rawUrl);
  if (!host) return true;
  return !hostMatchesAllowList(host, getAllowedImageHosts());
}

export function hostMatchesAllowList(host: string, allowList: string[]) {
  return allowList.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_AUDIT_CONCURRENCY = 5;
export const DEFAULT_FILL_CONCURRENCY = 5;
export const MIN_IMAGE_SIDE = 100;

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || '';
}

export function isMissingImageValue(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}
