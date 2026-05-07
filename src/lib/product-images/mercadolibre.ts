import type { ImageCandidate } from './types';

interface MercadoLibreSearchResponse {
  results?: Array<{
    id?: string;
    title?: string;
    thumbnail?: string;
    permalink?: string;
  }>;
}

function normalizeMlImageUrl(url: string): string {
  return url.replace(/^http:\/\//i, 'https://');
}

export function parseMercadoLibreCandidates(payload: unknown): ImageCandidate[] {
  if (!payload || typeof payload !== 'object') return [];
  const json = payload as MercadoLibreSearchResponse;
  const seen = new Set<string>();
  const candidates: ImageCandidate[] = [];

  for (const item of json.results || []) {
    const thumbnail = typeof item.thumbnail === 'string' ? normalizeMlImageUrl(item.thumbnail) : '';
    if (!thumbnail || seen.has(thumbnail)) continue;
    seen.add(thumbnail);
    candidates.push({
      url: thumbnail,
      source: 'mercadolibre',
      title: typeof item.title === 'string' ? item.title : undefined,
    });
  }

  return candidates;
}

export async function searchMercadoLibreCandidates(query: string, signal?: AbortSignal): Promise<ImageCandidate[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const endpoint = `https://api.mercadolibre.com/sites/MLC/search?q=${encodeURIComponent(cleanQuery)}&limit=3`;
  const response = await fetch(endpoint, { signal });
  if (!response.ok) {
    throw new Error(`MercadoLibre search failed with ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  return parseMercadoLibreCandidates(payload);
}

export const extractMercadoLibreCandidates = parseMercadoLibreCandidates;
