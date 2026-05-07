import { fetchHtmlWithRetries } from '@/lib/scrapers/fetch-html';
import { parsePriceForUrl } from '@/lib/scrapers/parser-domain';
import { ParsedPriceResult } from '@/lib/scrapers/types';

export async function scrapeCompetitorPrice(input: {
  url: string;
  selector?: string | null;
  competitorName?: string | null;
  timeoutMs?: number;
  userAgent?: string;
}): Promise<ParsedPriceResult & { finalUrl: string; status: number }> {
  const fetched = await fetchHtmlWithRetries(input.url, {
    timeoutMs: input.timeoutMs ?? 15_000,
    retries: 2,
    userAgent: input.userAgent,
  });

  const parsed = parsePriceForUrl({
    url: fetched.finalUrl || input.url,
    html: fetched.html,
    selector: input.selector,
    competitorName: input.competitorName,
  });

  return {
    ...parsed,
    finalUrl: fetched.finalUrl || input.url,
    status: fetched.status,
  };
}
