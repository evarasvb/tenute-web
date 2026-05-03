import '@/lib/polyfills/file';
import { load } from 'cheerio';
import { ParsedPriceResult, ScraperContext } from '@/lib/scrapers/types';
import { normalizePriceToNumber, parseJsonSafe } from '@/lib/scrapers/utils';

function extractBySelector(html: string, selector: string): string | null {
  if (!selector) return null;
  const trimmed = selector.trim();
  if (!trimmed) return null;

  const $ = load(html);
  const node = $(trimmed).first();
  if (!node || node.length === 0) return null;

  const content = node.attr('content');
  if (content && content.trim()) return content.trim();

  const value = node.attr('value');
  if (value && value.trim()) return value.trim();

  const text = node.text().trim();
  if (text) return text;

  return null;
}

function extractFromJsonLd(html: string): string | null {
  const $ = load(html);
  const blocks = $('script[type="application/ld+json"]')
    .map((_, node) => $(node).text())
    .get()
    .filter(Boolean);

  for (const block of blocks) {
    const parsed = parseJsonSafe(block);
    const stack: unknown[] = [parsed];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      if (Array.isArray(current)) {
        for (const item of current) stack.push(item);
        continue;
      }
      if (typeof current === 'object') {
        const obj = current as Record<string, unknown>;
        const offers = obj.offers;
        if (offers && typeof offers === 'object') {
          const offerObject = Array.isArray(offers)
            ? (offers[0] as Record<string, unknown> | undefined)
            : (offers as Record<string, unknown>);
          if (offerObject) {
            const price = offerObject.price;
            if (typeof price === 'number') return String(price);
            if (typeof price === 'string') return price;
          }
        }
        for (const value of Object.values(obj)) {
          stack.push(value);
        }
      }
    }
  }
  return null;
}

function extractByRegexMoney(html: string): string | null {
  const moneyRegexes = [
    /\$\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:,[0-9]{1,2})?)/i,
    /\bCLP\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:,[0-9]{1,2})?)/i,
    /"price"\s*:\s*"([0-9]{2,}(?:\.[0-9]{2})?)"/i,
  ];

  for (const regex of moneyRegexes) {
    const match = html.match(regex);
    if (match?.[1]) return match[1];
  }

  return null;
}

function detectInStock(html: string): boolean | null {
  const normalized = html.toLowerCase();
  if (
    normalized.includes('sin stock') ||
    normalized.includes('agotado') ||
    normalized.includes('outofstock') ||
    normalized.includes('out of stock')
  ) {
    return false;
  }
  if (
    normalized.includes('en stock') ||
    normalized.includes('disponible') ||
    normalized.includes('instock') ||
    normalized.includes('in stock')
  ) {
    return true;
  }
  return null;
}

export function parseGenericPrice(context: ScraperContext): ParsedPriceResult {
  const { html, selector } = context;
  const $ = load(html);

  const selectorValue = selector ? extractBySelector(html, selector) : null;
  const metaValue =
    $('meta[itemprop="price"]').attr('content')?.trim() ??
    $('meta[property="product:price:amount"]').attr('content')?.trim() ??
    null;
  const jsonLdValue = extractFromJsonLd(html);
  const regexValue = extractByRegexMoney(html);

  const rawValue = selectorValue ?? metaValue ?? jsonLdValue ?? regexValue;
  const price = rawValue ? normalizePriceToNumber(rawValue) : null;
  const inStock = detectInStock(html);

  return {
    price,
    currency: 'CLP',
    inStock,
    source: selectorValue
      ? 'selector'
      : metaValue
      ? 'meta'
      : jsonLdValue
      ? 'json-ld'
      : regexValue
      ? 'regex'
      : 'none',
    raw: {
      selector,
      selectorValue,
      metaValue,
      jsonLdValue,
      regexValue,
    },
  };
}
