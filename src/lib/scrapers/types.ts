export interface ScraperContext {
  url: string;
  html: string;
  selector?: string | null;
  competitorName?: string | null;
}

export interface ParsedPriceResult {
  price: number | null;
  currency: string;
  inStock: boolean | null;
  source: string;
  raw: Record<string, unknown>;
}

export interface FetchHtmlOptions {
  timeoutMs?: number;
  retries?: number;
  userAgent?: string;
}
