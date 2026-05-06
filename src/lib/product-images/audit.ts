import fs from 'fs/promises';
import path from 'path';
import pLimit from 'p-limit';
import {
  DEFAULT_AUDIT_CONCURRENCY,
  DEFAULT_TIMEOUT_MS,
  MIN_IMAGE_SIDE,
  isSuspiciousDomain,
} from '@/lib/product-images/config';
import { probeImageDimensions, requestWithTimeout } from '@/lib/product-images/http';
import { getAdminSupabaseClient, mapProductRecord } from '@/lib/product-images/supabase';
import type {
  ProductImageAuditResult,
  ProductImageAuditRow,
  ProductRecord,
  ProductImageAuditSummary,
} from '@/lib/product-images/types';

function isMissingUrl(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

function normalizeUrl(url: string): string {
  return url.trim();
}

function asProductRecord(row: Record<string, unknown>): ProductRecord {
  return mapProductRecord(row);
}

function parseImagesField(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof raw === 'string' && raw.trim().length > 0) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      }
    } catch {
      return [];
    }
  }
  return [];
}

function rowFor(
  product: ProductRecord,
  issueType: ProductImageAuditRow['issue_type'],
  overrides: Partial<ProductImageAuditRow> = {}
): ProductImageAuditRow {
  return {
    product_id: String(product.id),
    sku: product.sku || null,
    name: product.name,
    current_url: product.image_url || null,
    issue_type: issueType,
    http_status: null,
    suggested_url: null,
    ...overrides,
  };
}

export interface AuditOptions {
  productIds?: string[];
  includeHttpChecks?: boolean;
  timeoutMs?: number;
  concurrency?: number;
  exportJsonPath?: string;
  persistTable?: boolean;
  persistToDatabase?: boolean;
}

interface UrlAuditMeta {
  status: number | null;
  timeout: boolean;
  small: boolean;
}

export async function runProductImageAudit(
  options: AuditOptions = {}
): Promise<ProductImageAuditResult> {
  const includeHttpChecks = options.includeHttpChecks ?? true;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const concurrency = options.concurrency ?? DEFAULT_AUDIT_CONCURRENCY;
  const supabase = getAdminSupabaseClient();
  let query = supabase
    .from('products')
    .select('id, sku, name, image_url, images')
    .order('id', { ascending: true });

  if (options.productIds?.length) {
    query = query.in('id', options.productIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`No se pudo cargar products: ${error.message}`);
  }

  const products = (data || []).map((row) => asProductRecord(row as Record<string, unknown>));
  const issues: ProductImageAuditRow[] = [];

  for (const product of products) {
    const hasPrimary = !isMissingUrl(product.image_url);
    const gallery = parseImagesField(product.images);
    if (!hasPrimary) {
      issues.push(rowFor(product, 'missing_image'));
    }
    if (gallery.length === 0) {
      issues.push(
        rowFor(product, 'missing_gallery', {
          suggested_url: null,
        })
      );
    }
  }

  const urlMap = new Map<string, ProductRecord[]>();
  for (const product of products) {
    if (isMissingUrl(product.image_url)) continue;
    const key = normalizeUrl(product.image_url as string);
    if (!urlMap.has(key)) {
      urlMap.set(key, []);
    }
    urlMap.get(key)?.push(product);
  }

  for (const [url, owners] of urlMap.entries()) {
    if (owners.length <= 1) continue;
    for (const product of owners) {
      issues.push(
        rowFor(product, 'duplicate_url', {
          current_url: url,
        })
      );
    }
  }

  const uniqueUrls = Array.from(urlMap.keys());
  const urlMeta = new Map<string, UrlAuditMeta>();
  if (includeHttpChecks && uniqueUrls.length > 0) {
    const limit = pLimit(concurrency);
    const tasks = uniqueUrls.map((url) =>
      limit(async () => {
        let status: number | null = null;
        let timeout = false;
        let small = false;
        try {
          const head = await requestWithTimeout(url, {
            method: 'HEAD',
            timeoutMs,
          });
          status = head.status;
          if (head.status === 405 || head.status === 403) {
            const get = await requestWithTimeout(url, {
              method: 'GET',
              timeoutMs,
            });
            status = get.status;
          }
          if (status >= 200 && status < 400) {
            const dimensions = await probeImageDimensions(url, timeoutMs);
            small =
              !!dimensions &&
              (dimensions.width < MIN_IMAGE_SIDE || dimensions.height < MIN_IMAGE_SIDE);
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message.toLowerCase() : '';
          timeout = message.includes('abort') || message.includes('timeout');
        }
        urlMeta.set(url, { status, timeout, small });
      })
    );
    await Promise.allSettled(tasks);
  }

  for (const [url, owners] of urlMap.entries()) {
    if (isSuspiciousDomain(url)) {
      for (const product of owners) {
        issues.push(
          rowFor(product, 'suspicious_domain', {
            current_url: url,
          })
        );
      }
    }

    const meta = urlMeta.get(url);
    if (!meta) continue;
    if (meta.timeout) {
      for (const product of owners) {
        issues.push(
          rowFor(product, 'http_timeout', {
            current_url: url,
          })
        );
      }
      continue;
    }

    if (meta.status !== null && (meta.status === 403 || meta.status === 404 || meta.status >= 500)) {
      for (const product of owners) {
        issues.push(
          rowFor(product, 'http_error', {
            current_url: url,
            http_status: meta.status,
          })
        );
      }
    }

    if (meta.small) {
      for (const product of owners) {
        issues.push(
          rowFor(product, 'small_dimensions', {
            current_url: url,
          })
        );
      }
    }
  }

  const deduped = dedupeIssues(issues);
  const summary = summarizeAudit(products.length, deduped);
  const result: ProductImageAuditResult = {
    generatedAt: new Date().toISOString(),
    summary,
    issues: deduped,
  };

  const shouldPersist = options.persistTable ?? options.persistToDatabase ?? true;
  if (shouldPersist) {
    await persistAuditRows(deduped);
  }

  if (options.exportJsonPath) {
    const exportPath = path.resolve(options.exportJsonPath);
    await fs.mkdir(path.dirname(exportPath), { recursive: true });
    await fs.writeFile(exportPath, JSON.stringify(result, null, 2), 'utf8');
  }

  return result;
}

function dedupeIssues(issues: ProductImageAuditRow[]): ProductImageAuditRow[] {
  const map = new Map<string, ProductImageAuditRow>();
  for (const issue of issues) {
    const key = [
      issue.product_id,
      issue.issue_type,
      issue.current_url || '',
      issue.http_status ?? '',
      issue.suggested_url || '',
    ].join('|');
    if (!map.has(key)) {
      map.set(key, issue);
    }
  }
  return Array.from(map.values());
}

function summarizeAudit(totalProducts: number, issues: ProductImageAuditRow[]): ProductImageAuditSummary {
  const withIssues = new Set(issues.map((item) => item.product_id)).size;
  return {
    totalProducts,
    withIssues,
    missingImage: issues.filter((item) => item.issue_type === 'missing_image').length,
    missingGallery: issues.filter((item) => item.issue_type === 'missing_gallery').length,
    httpErrors: issues.filter((item) => item.issue_type === 'http_error').length,
    httpTimeouts: issues.filter((item) => item.issue_type === 'http_timeout').length,
    duplicateUrls: issues.filter((item) => item.issue_type === 'duplicate_url').length,
    smallDimensions: issues.filter((item) => item.issue_type === 'small_dimensions').length,
    suspiciousDomains: issues.filter((item) => item.issue_type === 'suspicious_domain').length,
  };
}

async function persistAuditRows(rows: ProductImageAuditRow[]) {
  const supabase = getAdminSupabaseClient();
  const { error: truncateError } = await supabase.from('product_image_audit').delete().neq('product_id', '');
  if (truncateError && !truncateError.message.toLowerCase().includes('relation')) {
    throw new Error(`No se pudo limpiar product_image_audit: ${truncateError.message}`);
  }

  if (rows.length === 0) return;
  const { error } = await supabase.from('product_image_audit').insert(rows);
  if (error) {
    throw new Error(`No se pudo insertar product_image_audit: ${error.message}`);
  }
}

export async function buildProductImageAudit(
  products: ProductRecord[],
  options: Pick<AuditOptions, 'includeHttpChecks' | 'timeoutMs' | 'concurrency'> = {}
): Promise<ProductImageAuditResult> {
  const includeHttpChecks = options.includeHttpChecks ?? true;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const concurrency = options.concurrency ?? DEFAULT_AUDIT_CONCURRENCY;
  const issues: ProductImageAuditRow[] = [];

  for (const product of products) {
    const hasPrimary = !isMissingUrl(product.image_url);
    const gallery = parseImagesField(product.images);
    if (!hasPrimary) {
      issues.push(rowFor(product, 'missing_image'));
    }
    if (gallery.length === 0) {
      issues.push(rowFor(product, 'missing_gallery'));
    }
  }

  const urlMap = new Map<string, ProductRecord[]>();
  for (const product of products) {
    if (isMissingUrl(product.image_url)) continue;
    const key = normalizeUrl(product.image_url as string);
    if (!urlMap.has(key)) {
      urlMap.set(key, []);
    }
    urlMap.get(key)?.push(product);
  }

  for (const [url, owners] of urlMap.entries()) {
    if (owners.length <= 1) continue;
    for (const product of owners) {
      issues.push(
        rowFor(product, 'duplicate_url', {
          current_url: url,
        })
      );
    }
  }

  const uniqueUrls = Array.from(urlMap.keys());
  const urlMeta = new Map<string, UrlAuditMeta>();
  if (includeHttpChecks && uniqueUrls.length > 0) {
    const limit = pLimit(concurrency);
    const tasks = uniqueUrls.map((url) =>
      limit(async () => {
        let status: number | null = null;
        let timeout = false;
        let small = false;
        try {
          const head = await requestWithTimeout(url, {
            method: 'HEAD',
            timeoutMs,
          });
          status = head.status;
          if (head.status === 405 || head.status === 403) {
            const get = await requestWithTimeout(url, {
              method: 'GET',
              timeoutMs,
            });
            status = get.status;
          }
          if (status >= 200 && status < 400) {
            const dimensions = await probeImageDimensions(url, timeoutMs);
            small =
              !!dimensions &&
              (dimensions.width < MIN_IMAGE_SIDE || dimensions.height < MIN_IMAGE_SIDE);
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message.toLowerCase() : '';
          timeout = message.includes('abort') || message.includes('timeout');
        }
        urlMeta.set(url, { status, timeout, small });
      })
    );
    await Promise.allSettled(tasks);
  }

  for (const [url, owners] of urlMap.entries()) {
    if (isSuspiciousDomain(url)) {
      for (const product of owners) {
        issues.push(
          rowFor(product, 'suspicious_domain', {
            current_url: url,
          })
        );
      }
    }

    const meta = urlMeta.get(url);
    if (!meta) continue;
    if (meta.timeout) {
      for (const product of owners) {
        issues.push(
          rowFor(product, 'http_timeout', {
            current_url: url,
          })
        );
      }
      continue;
    }

    if (meta.status !== null && (meta.status === 403 || meta.status === 404 || meta.status >= 500)) {
      for (const product of owners) {
        issues.push(
          rowFor(product, 'http_error', {
            current_url: url,
            http_status: meta.status,
          })
        );
      }
    }

    if (meta.small) {
      for (const product of owners) {
        issues.push(
          rowFor(product, 'small_dimensions', {
            current_url: url,
          })
        );
      }
    }
  }

  const deduped = dedupeIssues(issues);
  return {
    generatedAt: new Date().toISOString(),
    summary: summarizeAudit(products.length, deduped),
    issues: deduped,
  };
}

export async function saveAuditRows(rows: ProductImageAuditRow[]) {
  await persistAuditRows(rows);
}
