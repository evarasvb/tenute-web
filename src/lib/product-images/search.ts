import { load } from 'cheerio';
import { fetchJsonWithTimeout, fetchTextWithTimeout, normalizeImageUrl } from '@/lib/product-images/http';
import { parseMercadoLibreCandidates } from '@/lib/product-images/mercadolibre';
import type { ImageCandidate } from '@/lib/product-images/types';

const USER_AGENT = 'Mozilla/5.0 (compatible; TenuteBot/1.0)';

function sanitizeQuery(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

async function fetchBingCandidate(query: string): Promise<ImageCandidate[]> {
  const apiKey = process.env.BING_API_KEY?.trim();
  if (!apiKey) return [];
  const url = `https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(query)}&count=3&mkt=es-CL&safeSearch=Moderate`;
  const payload = await fetchJsonWithTimeout<{ value?: Array<{ contentUrl?: string; name?: string }> }>(url, {
    headers: { 'Ocp-Apim-Subscription-Key': apiKey },
  });
  const candidates = (payload.value || [])
    .map((item) => ({
      url: normalizeImageUrl(item.contentUrl || ''),
      source: 'bing' as const,
      title: item.name,
    }))
    .filter((item) => item.url);
  return candidates;
}

function extractListingImage(html: string, source: 'falabella' | 'sodimac'): ImageCandidate[] {
  const $ = load(html);
  const candidateUrl =
    $('img[data-src]').first().attr('data-src') ||
    $('img[srcset]').first().attr('srcset')?.split(',')[0]?.trim().split(' ')[0] ||
    $('img[src]').first().attr('src') ||
    '';
  const normalized = normalizeImageUrl(candidateUrl);
  if (!normalized) return [];
  return [{ url: normalized, source }];
}

async function scrapeListingImage(query: string, source: 'falabella' | 'sodimac'): Promise<ImageCandidate[]> {
  const encoded = encodeURIComponent(query);
  const url =
    source === 'falabella'
      ? `https://www.falabella.com/falabella-cl/search?Ntt=${encoded}`
      : `https://www.sodimac.cl/sodimac-cl/search?Ntt=${encoded}`;
  const html = await fetchTextWithTimeout(url, { headers: { 'User-Agent': USER_AGENT } });
  return extractListingImage(html, source);
}

/**
 * Parsea la respuesta de la API pública de catálogo VTEX
 * (`/api/catalog_system/pub/products/search?ft=...`) que usan proveedores como
 * Dimerc. Extrae la primera imagen de cada producto. Función pura y testeable.
 */
export function parseVtexCandidates(payload: unknown, source: ImageCandidate['source']): ImageCandidate[] {
  if (!Array.isArray(payload)) return [];
  const out: ImageCandidate[] = [];
  for (const product of payload) {
    if (!product || typeof product !== 'object') continue;
    const items = (product as { items?: unknown }).items;
    const firstItem = Array.isArray(items) && items[0] && typeof items[0] === 'object' ? items[0] as { images?: unknown } : null;
    const images = firstItem?.images;
    const firstImage = Array.isArray(images) && images[0] && typeof images[0] === 'object' ? images[0] as { imageUrl?: unknown } : null;
    const imageUrl = typeof firstImage?.imageUrl === 'string' ? firstImage.imageUrl : '';
    if (!imageUrl) continue;
    const title = typeof (product as { productName?: unknown }).productName === 'string'
      ? (product as { productName?: string }).productName
      : undefined;
    out.push({ url: normalizeImageUrl(imageUrl), source, title });
  }
  return out;
}

/** Consulta la API de catálogo VTEX de un proveedor (Dimerc, Prisa). */
async function fetchVtexCandidate(
  host: string,
  query: string,
  source: ImageCandidate['source']
): Promise<ImageCandidate[]> {
  try {
    const payload = await fetchJsonWithTimeout<unknown>(
      `https://${host}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=2`,
      { headers: { 'User-Agent': USER_AGENT } }
    );
    return parseVtexCandidates(payload, source);
  } catch {
    return [];
  }
}

export async function searchImageCandidates(productName: string): Promise<ImageCandidate[]> {
  const query = sanitizeQuery(productName);
  if (!query) return [];

  const mercadoLibrePayload = await fetchJsonWithTimeout<unknown>(
    `https://api.mercadolibre.com/sites/MLC/search?q=${encodeURIComponent(query)}&limit=3`
  );
  const mercadolibreCandidates = parseMercadoLibreCandidates(mercadoLibrePayload);
  if (mercadolibreCandidates.length > 0) return mercadolibreCandidates;

  const bingCandidates = await fetchBingCandidate(query);
  if (bingCandidates.length > 0) return bingCandidates;

  // Proveedores propios (catálogo VTEX). Dimerc es de donde se sacan productos;
  // Prisa se intenta con el mismo patrón (si no es VTEX, devuelve []).
  const dimercCandidates = await fetchVtexCandidate('www.dimerc.cl', query, 'dimerc');
  if (dimercCandidates.length > 0) return dimercCandidates;

  const prisaCandidates = await fetchVtexCandidate('www.prisa.cl', query, 'prisa');
  if (prisaCandidates.length > 0) return prisaCandidates;

  let falabellaCandidates: ImageCandidate[] = [];
  try {
    falabellaCandidates = await scrapeListingImage(query, 'falabella');
  } catch {
    falabellaCandidates = [];
  }
  if (falabellaCandidates.length > 0) return falabellaCandidates;

  try {
    return await scrapeListingImage(query, 'sodimac');
  } catch {
    return [];
  }
}

export async function findBestImageCandidate(productName: string): Promise<{
  bestCandidate: ImageCandidate | null;
  candidates: ImageCandidate[];
  fallbackUsed: boolean;
}> {
  const candidates = await searchImageCandidates(productName);
  return {
    bestCandidate: candidates[0] ?? null,
    candidates,
    fallbackUsed: candidates.length > 1,
  };
}

export const getImageCandidates = searchImageCandidates;

