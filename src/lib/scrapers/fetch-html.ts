import '@/lib/polyfills/file';
import { FetchHtmlOptions } from '@/lib/scrapers/types';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchHtmlWithRetries(
  url: string,
  options: FetchHtmlOptions = {}
): Promise<{ html: string; status: number; finalUrl: string }> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const retries = options.retries ?? 2;
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'user-agent': userAgent,
          accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'accept-language': 'es-CL,es;q=0.9,en;q=0.8',
          'cache-control': 'no-cache',
          pragma: 'no-cache',
        },
        signal: controller.signal,
      });

      const html = await response.text();
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      return {
        html,
        status: response.status,
        finalUrl: response.url || url,
      };
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt < retries) {
        await wait(250 * (attempt + 1));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('No fue posible obtener HTML');
}
