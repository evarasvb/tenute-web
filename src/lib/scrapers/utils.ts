export function normalizePriceToNumber(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d,.-]/g, '').trim();
  if (!cleaned) return null;

  // CLP usually has thousands separators and no decimals.
  const normalized = cleaned
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .replace(/(?!^)-/g, '');

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return Math.round(parsed);
}

export function extractJsonLdBlocks(html: string): string[] {
  const matches = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (!matches) return [];

  return matches
    .map((block) => block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim())
    .filter(Boolean);
}

export function parseJsonSafe(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}
