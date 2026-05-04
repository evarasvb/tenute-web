'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export interface Competitor {
  id: string;
  name: string;
  base_url: string;
  active: boolean;
}

export interface CompetitorLink {
  id: string;
  product_id: string | number;
  competitor_id: string;
  url: string;
  selector: string | null;
  sku_competidor: string | null;
  active: boolean;
  competitors?: Competitor | null;
}

export interface CompetitorPriceHistoryItem {
  id: string;
  price: number;
  currency: string;
  inStock: boolean | null;
  scrapedAt: string;
  sourceUrl: string;
}

export interface CompetitorPriceItem {
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
  history: CompetitorPriceHistoryItem[];
}

export interface CompetitorPriceSummary {
  productId: string | number;
  items: CompetitorPriceItem[];
  suggestedPrice: number | null;
  minimumCompetitorPrice: number | null;
}

function asProductId(input: string): string | number {
  return /^\d+$/.test(input) ? Number(input) : input;
}

async function readJson<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in (data as Record<string, unknown>)
        ? String((data as Record<string, unknown>).error)
        : 'Error de API';
    throw new Error(message);
  }
  return data as T;
}

export function useCompetitorPrices(productId: string, initialOurPrice: number) {
  const parsedProductId = useMemo(() => asProductId(productId), [productId]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [error, setError] = useState<string>('');
  const [summary, setSummary] = useState<CompetitorPriceSummary | null>(null);
  const [links, setLinks] = useState<CompetitorLink[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [ourPrice, setOurPrice] = useState<number>(initialOurPrice || 0);

  const loadCompetitors = useCallback(async () => {
    const res = await fetch('/api/admin/competitors');
    return readJson<Competitor[]>(res);
  }, []);

  const loadLinks = useCallback(async () => {
    const res = await fetch(`/api/admin/competitor-links?productId=${encodeURIComponent(String(parsedProductId))}`);
    return readJson<CompetitorLink[]>(res);
  }, [parsedProductId]);

  const loadSummary = useCallback(async () => {
    const res = await fetch(
      `/api/admin/competitor-prices?productId=${encodeURIComponent(String(parsedProductId))}`
    );
    return readJson<CompetitorPriceSummary>(res);
  }, [parsedProductId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryData, linksData, competitorsData] = await Promise.all([
        loadSummary(),
        loadLinks(),
        loadCompetitors(),
      ]);
      setSummary(summaryData);
      setLinks(linksData);
      setCompetitors(competitorsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando comparativa');
    } finally {
      setLoading(false);
    }
  }, [loadCompetitors, loadLinks, loadSummary]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    setOurPrice(initialOurPrice || 0);
  }, [initialOurPrice]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      const res = await fetch('/api/admin/competitor-prices/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: parsedProductId }),
      });
      await readJson<{
        ok: unknown[];
        errors: Array<{ message: string }>;
      }>(res);
      const summaryData = await loadSummary();
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error refrescando competencia');
    } finally {
      setRefreshing(false);
    }
  }, [loadSummary, parsedProductId]);

  const upsertLink = useCallback(
    async (input: {
      id?: string;
      competitorId: string;
      url: string;
      selector?: string;
      sku_competidor?: string;
      active?: boolean;
    }) => {
      setError('');
      const res = await fetch('/api/admin/competitor-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          id: input.id,
          productId: parsedProductId,
          competitorId: input.competitorId,
          url: input.url,
          selector: input.selector || null,
          sku_competidor: input.sku_competidor || null,
          active: input.active ?? true,
        }),
      });
      await readJson<CompetitorLink>(res);
      const [summaryData, linksData] = await Promise.all([loadSummary(), loadLinks()]);
      setSummary(summaryData);
      setLinks(linksData);
    },
    [loadLinks, loadSummary, parsedProductId]
  );

  const toggleLink = useCallback(
    async (id: string, active: boolean) => {
      setError('');
      const res = await fetch('/api/admin/competitor-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          id,
          active,
        }),
      });
      await readJson<CompetitorLink>(res);
      const [summaryData, linksData] = await Promise.all([loadSummary(), loadLinks()]);
      setSummary(summaryData);
      setLinks(linksData);
    },
    [loadLinks, loadSummary]
  );

  const removeLink = useCallback(
    async (id: string) => {
      setError('');
      const res = await fetch('/api/admin/competitor-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id,
        }),
      });
      await readJson<{ success: boolean }>(res);
      const [summaryData, linksData] = await Promise.all([loadSummary(), loadLinks()]);
      setSummary(summaryData);
      setLinks(linksData);
    },
    [loadLinks, loadSummary]
  );

  const saveOurPrice = useCallback(
    async (nextPrice: number) => {
      setSavingPrice(true);
      setError('');
      const previousPrice = ourPrice;
      setOurPrice(nextPrice);
      try {
        const res = await fetch(`/api/admin/products/${encodeURIComponent(productId)}/price`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ price: nextPrice }),
        });
        await readJson<{ id: string | number; price: number }>(res);
      } catch (err) {
        setOurPrice(previousPrice);
        setError(err instanceof Error ? err.message : 'Error actualizando precio');
        throw err;
      } finally {
        setSavingPrice(false);
      }
    },
    [ourPrice, productId]
  );

  return {
    loading,
    refreshing,
    savingPrice,
    error,
    summary,
    links,
    competitors,
    ourPrice,
    setOurPrice,
    reload: loadAll,
    refresh,
    upsertLink,
    toggleLink,
    removeLink,
    saveOurPrice,
  };
}
