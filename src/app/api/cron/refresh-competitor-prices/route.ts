import { NextRequest, NextResponse } from 'next/server';
import {
  getAllActiveCompetitorLinks,
  refreshLinks,
} from '@/lib/competitor-pricing';

const CRON_EXECUTION_BUDGET_MS = 700_000;
const CRON_CONCURRENCY = 8;
const CRON_PROGRESS_EVERY = 100;
const CRON_BATCH_SIZE = 40;
const FETCH_TIMEOUT_MS = 15_000;
const SCRAPER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function parseNumberParam(value: string | null, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return defaultValue;
  return parsed;
}

function splitIntoBatches<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function estimateBatchDurationMs(batchSize: number): number {
  const rounds = Math.ceil(batchSize / CRON_CONCURRENCY);
  return rounds * FETCH_TIMEOUT_MS;
}

function isAuthorizedCron(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  if (!authHeader) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const startedAt = Date.now();
    const { searchParams } = new URL(request.url);
    const offset = parseNumberParam(searchParams.get('offset'), 0);
    const requestedLimit = parseNumberParam(searchParams.get('limit'), 0);

    const links = await getAllActiveCompetitorLinks();
    const totalLinks = links.length;
    const safeOffset = Math.min(offset, totalLinks);
    const remaining = totalLinks - safeOffset;
    const effectiveLimit = requestedLimit > 0 ? Math.min(requestedLimit, remaining) : remaining;
    const selectedLinks = links.slice(safeOffset, safeOffset + effectiveLimit);

    const batches = splitIntoBatches(selectedLinks, CRON_BATCH_SIZE);
    const aggregateOk: Awaited<ReturnType<typeof refreshLinks>>['ok'] = [];
    const aggregateErrors: Awaited<ReturnType<typeof refreshLinks>>['errors'] = [];
    const aggregateCounts: Record<string, number> = {};
    let processed = safeOffset;
    let partial = false;

    for (const batch of batches) {
      const elapsed = Date.now() - startedAt;
      const estimatedBatchDurationMs = estimateBatchDurationMs(batch.length);
      if (elapsed + estimatedBatchDurationMs >= CRON_EXECUTION_BUDGET_MS) {
        partial = true;
        break;
      }

      const refreshed = await refreshLinks(batch, {
        concurrency: CRON_CONCURRENCY,
        timeoutMs: FETCH_TIMEOUT_MS,
        userAgent: SCRAPER_USER_AGENT,
        total: totalLinks,
        initialProcessed: processed,
        initialCompetitorCounts: aggregateCounts,
        progressEvery: CRON_PROGRESS_EVERY,
        onProgress: (progress) => {
          console.log(
            `[cron:refresh-competitor-prices] progress ${progress.processed}/${progress.total}`,
            progress.competitorCounts
          );
        },
      });

      aggregateOk.push(...refreshed.ok);
      aggregateErrors.push(...refreshed.errors);
      processed = refreshed.progress.processed;
      Object.assign(aggregateCounts, refreshed.progress.competitorCounts);
    }

    const isDone = processed >= totalLinks || safeOffset + effectiveLimit >= totalLinks;
    const shouldReturnPartial = !isDone;
    const nextOffset = shouldReturnPartial ? processed : null;

    return NextResponse.json({
      processedLinks: processed,
      totalLinks,
      offset: safeOffset,
      limit: effectiveLimit,
      partial: shouldReturnPartial,
      nextOffset,
      competitorCounts: aggregateCounts,
      okCount: aggregateOk.length,
      errorCount: aggregateErrors.length,
      ok: aggregateOk,
      errors: aggregateErrors,
      exhaustedTimeBudget: partial,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error ejecutando cron de precios',
      },
      { status: 500 }
    );
  }
}
