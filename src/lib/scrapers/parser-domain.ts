import { parseGenericPrice } from '@/lib/scrapers/parser-generic';
import { ParsedPriceResult, ScraperContext } from '@/lib/scrapers/types';
import { getDomainFromUrl } from '@/lib/scrapers/utils';

type DomainParser = (context: ScraperContext) => ParsedPriceResult;

function parserWithFallback(
  selector: string,
  source: string
): DomainParser {
  return (context) => {
    const parsed = parseGenericPrice({ ...context, selector: context.selector ?? selector });
    if (parsed.price == null) return parsed;
    return {
      ...parsed,
      source: parsed.source === 'selector' ? source : parsed.source,
    };
  };
}

const DOMAIN_PARSERS: Record<string, DomainParser> = {
  'dimerc.cl': parserWithFallback('.product-price, .price, [itemprop="price"]', 'dimerc-selector'),
  'officemax.cl': parserWithFallback('.price, .product-price, [itemprop="price"]', 'officemax-selector'),
  'pcfactory.cl': parserWithFallback('.price-main, .price, [itemprop="price"]', 'pcfactory-selector'),
  'sodimac.cl': parserWithFallback('.sodimac-price, .price, [itemprop="price"]', 'sodimac-selector'),
  'mercadolibre.cl': parserWithFallback('.andes-money-amount__fraction', 'mercadolibre-selector'),
  'falabella.com': parserWithFallback('.copy10.primary.medium, .price, [itemprop="price"]', 'falabella-selector'),
};

export function resolveParser(url: string): DomainParser {
  const domain = getDomainFromUrl(url);
  if (!domain) return parseGenericPrice;

  const direct = DOMAIN_PARSERS[domain];
  if (direct) return direct;

  const fallbackBySuffix = Object.entries(DOMAIN_PARSERS).find(([supported]) =>
    domain.endsWith(supported)
  );
  return fallbackBySuffix?.[1] ?? parseGenericPrice;
}

export function parsePriceForUrl(context: ScraperContext): ParsedPriceResult {
  const parser = resolveParser(context.url);
  return parser(context);
}
