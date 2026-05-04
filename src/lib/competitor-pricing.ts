import { createAdminClient } from '@/lib/supabase';
import { scrapeCompetitorPrice } from '@/lib/scrapers';

type ProductId = string | number;

export interface CompetitorLinkRow {
  id: string;
  product_id: ProductId;
  competitor_id: string;
  url: string;
  selector: string | null;
  sku_competidor: string | null;
  active: boolean;
  competitors?: {
    id: string;
    name: string;
    base_url: string;
    active: boolean;
  } | null;
}

interface CompetitorRow {
  id: string;
  name: string;
  base_url: string;
  active: boolean;
}

export interface LatestCompetitorPrice {
  linkId: string;
  competitorId: string;
  competitorName: string;
  sourceUrl: string;
  selector: string | null;
  active: boolean;
  latestPrice: number | null;
  currency: string;
  inStock: boolean | null;
  scrapedAt: string | null;
  source: string | null;
  history: Array<{
    id: string;
    price: number;
    currency: string;
    inStock: boolean | null;
    scrapedAt: string;
    sourceUrl: string;
  }>;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}

function normalizeProductIdList(input: unknown): ProductId[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((value) => typeof value === 'string' || typeof value === 'number')
    .map((value) => value as ProductId);
}

export async function getActiveCompetitorLinksByProducts(
  productIds: ProductId[]
): Promise<CompetitorLinkRow[]> {
  if (productIds.length === 0) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('product_competitor_links')
    .select('id, product_id, competitor_id, url, selector, sku_competidor, active, competitors(id, name, base_url, active)')
    .in('product_id', productIds)
    .eq('active', true);

  if (error) throw new Error(error.message);
  return (data || []) as unknown as CompetitorLinkRow[];
}

export async function getAllActiveCompetitorLinks(): Promise<CompetitorLinkRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('product_competitor_links')
    .select('id, product_id, competitor_id, url, selector, sku_competidor, active, competitors(id, name, base_url, active)')
    .eq('active', true);

  if (error) throw new Error(error.message);
  return (data || []) as unknown as CompetitorLinkRow[];
}

async function persistCompetitorPrice(input: {
  productId: ProductId;
  competitorId: string;
  sourceUrl: string;
  price: number;
  currency: string;
  inStock: boolean | null;
  raw: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('competitor_prices').insert({
    product_id: input.productId,
    competitor_id: input.competitorId,
    price: input.price,
    currency: input.currency || 'CLP',
    in_stock: input.inStock,
    source_url: input.sourceUrl,
    raw: input.raw,
  });
  if (error) throw new Error(error.message);
}

export async function refreshLinks(
  links: CompetitorLinkRow[]
): Promise<{
  ok: Array<{
    linkId: string;
    productId: ProductId;
    competitorId: string;
    competitorName: string;
    price: number;
    currency: string;
    inStock: boolean | null;
    scrapedAt: string;
    sourceUrl: string;
  }>;
  errors: Array<{
    linkId: string;
    productId: ProductId;
    competitorId: string;
    message: string;
  }>;
}> {
  const ok: Array<{
    linkId: string;
    productId: ProductId;
    competitorId: string;
    competitorName: string;
    price: number;
    currency: string;
    inStock: boolean | null;
    scrapedAt: string;
    sourceUrl: string;
  }> = [];
  const errors: Array<{
    linkId: string;
    productId: ProductId;
    competitorId: string;
    message: string;
  }> = [];

  for (const link of links) {
    try {
      const scraped = await scrapeCompetitorPrice({
        url: link.url,
        selector: link.selector,
        competitorName: link.competitors?.name ?? null,
      });

      if (scraped.price == null) {
        throw new Error('No se pudo extraer precio');
      }

      await persistCompetitorPrice({
        productId: link.product_id,
        competitorId: link.competitor_id,
        sourceUrl: scraped.finalUrl || link.url,
        price: scraped.price,
        currency: scraped.currency || 'CLP',
        inStock: scraped.inStock,
        raw: {
          ...scraped.raw,
          source: scraped.source,
          status: scraped.status,
          finalUrl: scraped.finalUrl,
        },
      });

      ok.push({
        linkId: link.id,
        productId: link.product_id,
        competitorId: link.competitor_id,
        competitorName: link.competitors?.name ?? 'Competidor',
        price: scraped.price,
        currency: scraped.currency || 'CLP',
        inStock: scraped.inStock,
        scrapedAt: new Date().toISOString(),
        sourceUrl: scraped.finalUrl || link.url,
      });
    } catch (error) {
      errors.push({
        linkId: link.id,
        productId: link.product_id,
        competitorId: link.competitor_id,
        message: toErrorMessage(error),
      });
    }
  }

  return { ok, errors };
}

export async function getCompetitorPriceSummary(productId: ProductId): Promise<{
  productId: ProductId;
  items: LatestCompetitorPrice[];
  suggestedPrice: number | null;
  minimumCompetitorPrice: number | null;
}> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: linksData, error: linksError } = await supabase
    .from('product_competitor_links')
    .select('id, product_id, competitor_id, url, selector, active, competitors(id, name, base_url, active)')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });
  if (linksError) throw new Error(linksError.message);

  const links = (linksData || []) as unknown as Array<
    Pick<CompetitorLinkRow, 'id' | 'product_id' | 'competitor_id' | 'url' | 'selector' | 'active' | 'competitors'>
  >;

  const competitorIds = Array.from(new Set(links.map((link) => link.competitor_id)));
  let pricesByCompetitor = new Map<string, Array<{
    id: string;
    competitor_id: string;
    price: number;
    currency: string;
    in_stock: boolean | null;
    scraped_at: string;
    source_url: string;
  }>>();

  if (competitorIds.length > 0) {
    const { data: pricesData, error: pricesError } = await supabase
      .from('competitor_prices')
      .select('id, competitor_id, price, currency, in_stock, scraped_at, source_url')
      .eq('product_id', productId)
      .in('competitor_id', competitorIds)
      .gte('scraped_at', since)
      .order('scraped_at', { ascending: false });

    if (pricesError) throw new Error(pricesError.message);

    pricesByCompetitor = (pricesData || []).reduce((acc, row) => {
      const key = String((row as { competitor_id: string }).competitor_id);
      const current = acc.get(key) || [];
      current.push(row as {
        id: string;
        competitor_id: string;
        price: number;
        currency: string;
        in_stock: boolean | null;
        scraped_at: string;
        source_url: string;
      });
      acc.set(key, current);
      return acc;
    }, new Map<string, Array<{
      id: string;
      competitor_id: string;
      price: number;
      currency: string;
      in_stock: boolean | null;
      scraped_at: string;
      source_url: string;
    }>>());
  }

  const items: LatestCompetitorPrice[] = links.map((link) => {
    const historyRows = pricesByCompetitor.get(link.competitor_id) || [];
    const latest = historyRows[0];

    return {
      linkId: link.id,
      competitorId: link.competitor_id,
      competitorName: link.competitors?.name || 'Competidor',
      sourceUrl: link.url,
      selector: link.selector ?? null,
      active: link.active,
      latestPrice: latest?.price ?? null,
      currency: latest?.currency ?? 'CLP',
      inStock: latest?.in_stock ?? null,
      scrapedAt: latest?.scraped_at ?? null,
      source: latest ? 'stored' : null,
      history: historyRows.map((row) => ({
        id: row.id,
        price: row.price,
        currency: row.currency,
        inStock: row.in_stock,
        scrapedAt: row.scraped_at,
        sourceUrl: row.source_url,
      })),
    };
  });

  const prices = items
    .map((item) => item.latestPrice)
    .filter((value): value is number => typeof value === 'number' && value > 0);
  const minimumCompetitorPrice = prices.length ? Math.min(...prices) : null;
  const suggestedPrice =
    minimumCompetitorPrice != null
      ? Math.max(1, Math.round(minimumCompetitorPrice * 0.95))
      : null;

  return {
    productId,
    items,
    suggestedPrice,
    minimumCompetitorPrice,
  };
}

export function parseRefreshPayload(body: unknown): ProductId[] {
  if (!body || typeof body !== 'object') return [];
  const payload = body as Record<string, unknown>;
  const single = payload.productId;
  const list = normalizeProductIdList(payload.productIds);
  if (list.length > 0) return list;
  if (typeof single === 'string' || typeof single === 'number') return [single];
  return [];
}

export async function getCompetitorsCatalog(): Promise<CompetitorRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('competitors')
    .select('id, name, base_url, active')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as CompetitorRow[];
}

export async function getProductCompetitorLinks(productId: ProductId): Promise<CompetitorLinkRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('product_competitor_links')
    .select('id, product_id, competitor_id, url, selector, sku_competidor, active, competitors(id, name, base_url, active)')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as unknown as CompetitorLinkRow[];
}
