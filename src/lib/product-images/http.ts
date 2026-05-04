import probeImageSize from 'probe-image-size';
import {
  DEFAULT_TIMEOUT_MS,
  MIN_IMAGE_SIDE,
  getPublicSupabaseUrl,
  isSuspiciousDomain,
} from '@/lib/product-images/config';

export interface UrlHealthResult {
  url: string;
  ok: boolean;
  status: number | null;
  timedOut: boolean;
  contentType: string | null;
  width: number | null;
  height: number | null;
  tooSmall: boolean;
  suspiciousDomain: boolean;
  error: string | null;
}

export interface RequestWithTimeoutOptions {
  method?: 'GET' | 'HEAD';
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export interface DownloadedImage {
  url: string;
  buffer: Buffer | null;
  contentType: string;
  status: number | null;
  error: string | null;
}

function toAbsoluteImageUrl(input: string | null): string | null {
  if (!input) return null;
  const value = input.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const base = getPublicSupabaseUrl();
  if (value.startsWith('/storage/')) return `${base}${value}`;
  if (value.startsWith('/')) return `${base}${value}`;
  return `${base}/${value}`;
}

function createTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function normalizeStatus(status: number | undefined) {
  if (typeof status !== 'number' || Number.isNaN(status)) return null;
  return status;
}

async function fetchHead(url: string, timeoutMs: number): Promise<Response | null> {
  const { signal, clear } = createTimeoutSignal(timeoutMs);
  try {
    return await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal,
    });
  } catch {
    return null;
  } finally {
    clear();
  }
}

async function fetchGet(url: string, timeoutMs: number): Promise<Response> {
  const { signal, clear } = createTimeoutSignal(timeoutMs);
  try {
    return await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal,
    });
  } finally {
    clear();
  }
}

export async function requestWithTimeout(
  url: string,
  options: RequestWithTimeoutOptions = {}
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const { signal, clear } = createTimeoutSignal(timeoutMs);
  try {
    return await fetch(url, {
      method: options.method || 'GET',
      redirect: 'follow',
      headers: options.headers,
      signal,
    });
  } finally {
    clear();
  }
}

function isImageContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.toLowerCase().startsWith('image/');
}

async function readDimensions(
  url: string,
  timeoutMs: number
): Promise<{ width: number | null; height: number | null; error: string | null }> {
  try {
    const { signal, clear } = createTimeoutSignal(timeoutMs);
    try {
      const info = await probeImageSize(url, {
        timeout: timeoutMs,
        signal,
      });
      return {
        width: typeof info.width === 'number' ? info.width : null,
        height: typeof info.height === 'number' ? info.height : null,
        error: null,
      };
    } finally {
      clear();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No fue posible leer dimensiones';
    return { width: null, height: null, error: message };
  }
}

export async function inspectImageUrl(
  rawUrl: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<UrlHealthResult> {
  const url = rawUrl.trim();
  const suspiciousDomain = isSuspiciousDomain(url);

  let status: number | null = null;
  let contentType: string | null = null;
  let timedOut = false;
  let error: string | null = null;

  const headResponse = await fetchHead(url, timeoutMs);
  if (headResponse) {
    status = normalizeStatus(headResponse.status);
    contentType = headResponse.headers.get('content-type');
  }

  if (!headResponse || status === 405 || status === 403) {
    try {
      const getResponse = await fetchGet(url, timeoutMs);
      status = normalizeStatus(getResponse.status);
      contentType = getResponse.headers.get('content-type');
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Error de red';
      timedOut = message.toLowerCase().includes('abort');
      error = message;
    }
  }

  if (status === null && !error) {
    error = 'No se obtuvo respuesta HTTP';
  }

  const okStatus = status !== null && status >= 200 && status < 300;
  const imageTypeOk = isImageContentType(contentType);

  const dimensions = okStatus && imageTypeOk
    ? await readDimensions(url, timeoutMs)
    : { width: null, height: null, error: null };

  if (!error && dimensions.error) {
    error = dimensions.error;
  }

  const tooSmall = typeof dimensions.width === 'number'
    && typeof dimensions.height === 'number'
    && (dimensions.width < MIN_IMAGE_SIDE || dimensions.height < MIN_IMAGE_SIDE);

  const ok = okStatus && imageTypeOk && !tooSmall;

  return {
    url,
    ok,
    status,
    timedOut,
    contentType,
    width: dimensions.width,
    height: dimensions.height,
    tooSmall,
    suspiciousDomain,
    error,
  };
}

export function normalizeImageUrl(input: string): string {
  return input.trim().replace(/^http:\/\//i, 'https://');
}

export function isLikelyValidImageUrl(input: string | null | undefined): boolean {
  if (!input) return false;
  const value = normalizeImageUrl(input);
  if (!value) return false;
  return /^https?:\/\//i.test(value) || value.startsWith('/');
}

export async function fetchJsonWithTimeout<T>(
  url: string,
  options: RequestWithTimeoutOptions = {}
): Promise<T> {
  const response = await requestWithTimeout(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} al consultar ${url}`);
  }
  return (await response.json()) as T;
}

export async function fetchTextWithTimeout(
  url: string,
  options: RequestWithTimeoutOptions = {}
): Promise<string> {
  const response = await requestWithTimeout(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} al consultar ${url}`);
  }
  return response.text();
}

export async function fetchImageBuffer(rawUrl: string): Promise<DownloadedImage> {
  const absoluteUrl = toAbsoluteImageUrl(rawUrl);
  if (!absoluteUrl) {
    return {
      url: rawUrl,
      buffer: null,
      contentType: '',
      status: null,
      error: 'URL inválida',
    };
  }

  try {
    const response = await requestWithTimeout(absoluteUrl, { method: 'GET' });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) {
      return {
        url: absoluteUrl,
        buffer: null,
        contentType,
        status: response.status,
        error: `HTTP ${response.status}`,
      };
    }
    const arrayBuffer = await response.arrayBuffer();
    return {
      url: absoluteUrl,
      buffer: Buffer.from(arrayBuffer),
      contentType,
      status: response.status,
      error: null,
    };
  } catch (error: unknown) {
    return {
      url: absoluteUrl,
      buffer: null,
      contentType: '',
      status: null,
      error: error instanceof Error ? error.message : 'Error de red',
    };
  }
}

export async function probeImageDimensions(
  rawUrl: string,
  timeoutOrBuffer?: number | Buffer
): Promise<{ width: number; height: number } | null> {
  const absoluteUrl = toAbsoluteImageUrl(rawUrl);
  if (!absoluteUrl) return null;
  try {
    if (Buffer.isBuffer(timeoutOrBuffer)) {
      const meta = probeImageSize.sync(timeoutOrBuffer);
      if (!meta) return null;
      return { width: meta.width, height: meta.height };
    }
    const timeoutMs = typeof timeoutOrBuffer === 'number' ? timeoutOrBuffer : DEFAULT_TIMEOUT_MS;
    const info = await probeImageSize(absoluteUrl, { timeout: timeoutMs });
    return { width: info.width, height: info.height };
  } catch {
    return null;
  }
}

export async function resolveUrlWithMetadata(rawUrl: string): Promise<DownloadedImage> {
  const downloaded = await fetchImageBuffer(rawUrl);
  if (!downloaded.contentType && downloaded.buffer) {
    const dimensions = await probeImageDimensions(downloaded.url, downloaded.buffer);
    if (dimensions) {
      return { ...downloaded, contentType: 'image/jpeg' };
    }
  }
  return downloaded;
}

export async function fetchImageMetadata(
  rawUrl: string,
  options: RequestWithTimeoutOptions = {}
): Promise<{ contentType: string | null; width: number | null; height: number | null; error: string | null }> {
  const absoluteUrl = toAbsoluteImageUrl(rawUrl);
  if (!absoluteUrl) {
    return { contentType: null, width: null, height: null, error: 'URL inválida' };
  }
  try {
    const response = await requestWithTimeout(absoluteUrl, {
      method: options.method || 'HEAD',
      timeoutMs: options.timeoutMs,
      headers: options.headers,
    });
    let contentType = response.headers.get('content-type');
    let width: number | null = null;
    let height: number | null = null;
    if ((!contentType || !contentType.startsWith('image/')) || response.status === 405) {
      const getResponse = await requestWithTimeout(absoluteUrl, {
        method: 'GET',
        timeoutMs: options.timeoutMs,
        headers: options.headers,
      });
      contentType = getResponse.headers.get('content-type');
      if (getResponse.ok) {
        const buf = Buffer.from(await getResponse.arrayBuffer());
        const dimensions = await probeImageDimensions(absoluteUrl, buf);
        width = dimensions?.width ?? null;
        height = dimensions?.height ?? null;
      }
    } else if (response.ok) {
      const dimensions = await probeImageDimensions(absoluteUrl, options.timeoutMs);
      width = dimensions?.width ?? null;
      height = dimensions?.height ?? null;
    }
    return { contentType, width, height, error: null };
  } catch (error: unknown) {
    return {
      contentType: null,
      width: null,
      height: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
