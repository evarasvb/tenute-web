import { pLimit } from './limit';
import { createAdminClient } from '@/lib/supabase';
import { DEFAULT_FILL_CONCURRENCY, MIN_IMAGE_SIDE } from './config';
import { fetchImageMetadata } from './http';
import { getImageCandidates } from './search';
import { ensureBucketExists, uploadImageToProductBucket, type UploadedImage } from './storage';
import { hasMissingOrInvalidImage, normalizeProductId, selectProducts } from './supabase';
import type { FillProductImageResult, FillProductImagesResult, ProductRecord } from './types';

export interface FillProductImagesOptions {
  dryRun?: boolean;
  productIds?: string[];
  concurrency?: number;
  previewCandidates?: boolean;
}

export function parseFillOptionsFromArgv(argv: string[]): FillProductImagesOptions {
  const options: FillProductImagesOptions = {
    dryRun: argv.includes('--dry-run'),
  };

  const productIdsArg = argv.find((arg) => arg.startsWith('--product-ids='));
  if (productIdsArg) {
    options.productIds = productIdsArg
      .replace('--product-ids=', '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  const concurrencyArg = argv.find((arg) => arg.startsWith('--concurrency='));
  if (concurrencyArg) {
    const value = Number(concurrencyArg.replace('--concurrency=', ''));
    if (Number.isFinite(value) && value > 0) {
      options.concurrency = value;
    }
  }

  return options;
}

export async function getProductsWithoutValidImage(productIds?: string[]): Promise<ProductRecord[]> {
  const products = await selectProducts(productIds);
  return products.filter((product) => hasMissingOrInvalidImage(product.image_url));
}

async function validateCandidate(
  candidateUrl: string
): Promise<{ ok: boolean; error?: string }> {
  const metadata = await fetchImageMetadata(candidateUrl, { method: 'GET' });
  if (metadata.error) return { ok: false, error: metadata.error };
  if (!metadata.contentType?.startsWith('image/')) {
    return { ok: false, error: `Content-Type inválido: ${metadata.contentType || 'unknown'}` };
  }
  if (
    typeof metadata.width === 'number' &&
    typeof metadata.height === 'number' &&
    (metadata.width < MIN_IMAGE_SIDE || metadata.height < MIN_IMAGE_SIDE)
  ) {
    return { ok: false, error: `Imagen pequeña ${metadata.width}x${metadata.height}` };
  }
  return { ok: true };
}

async function resolveUpload(
  product: ProductRecord,
  candidateUrl: string,
  dryRun: boolean
): Promise<UploadedImage | null> {
  if (dryRun) {
    const ext = candidateUrl.split('?')[0]?.split('.').pop() || 'jpg';
    return {
      path: `auto/${normalizeProductId(product.id)}.${ext}`,
      publicUrl: candidateUrl,
      contentType: 'image/jpeg',
    };
  }
  return uploadImageToProductBucket(product, candidateUrl);
}

async function processOneProduct(
  product: ProductRecord,
  dryRun: boolean,
  previewCandidates: boolean
): Promise<FillProductImageResult> {
  const base: FillProductImageResult = {
    productId: normalizeProductId(product.id),
    sku: product.sku,
    name: product.name,
    success: false,
    dryRun,
    source: null,
    fallbackUsed: false,
    uploadedUrl: null,
    selectedCandidate: null,
    candidates: [],
    error: null,
  };

  const candidates = await getImageCandidates(product.name);
  base.candidates = candidates;
  if (!candidates.length) {
    return { ...base, error: 'No se encontraron candidatas en fuentes externas' };
  }

  if (previewCandidates) {
    return {
      ...base,
      success: true,
      source: candidates[0]?.source || null,
      fallbackUsed: candidates.length > 1,
      uploadedUrl: candidates[0]?.url || null,
      selectedCandidate: candidates[0]?.url || null,
      error: null,
    };
  }

  for (let index = 0; index < candidates.length; index++) {
    const candidate = candidates[index];
    const validation = await validateCandidate(candidate.url);
    if (!validation.ok) continue;

    const uploaded = await resolveUpload(product, candidate.url, dryRun);
    if (!uploaded) {
      return { ...base, error: 'No se pudo subir imagen a Supabase Storage' };
    }

    const admin = createAdminClient();
    const payload: Record<string, unknown> = {
      image_url: uploaded.publicUrl,
      images: [uploaded.publicUrl],
    };
    if (!dryRun) {
      const { error } = await admin
        .from('products')
        .update(payload)
        .eq('id', product.id);
      if (error) {
        return { ...base, error: error.message };
      }
    }

    return {
      ...base,
      success: true,
      source: candidate.source,
      fallbackUsed: index > 0,
      uploadedUrl: uploaded.publicUrl,
      selectedCandidate: candidate.url,
      error: null,
    };
  }

  return { ...base, error: 'Todas las candidatas fallaron validación (>100x100 o content-type)' };
}

export async function fillMissingProductImages(
  input: FillProductImagesOptions | ProductRecord[] = {}
): Promise<FillProductImagesResult> {
  const options = Array.isArray(input) ? {} : input;
  const products = Array.isArray(input) ? input : await selectProducts(options.productIds);
  const dryRun = options.dryRun ?? false;
  const concurrency = options.concurrency ?? DEFAULT_FILL_CONCURRENCY;
  const previewCandidates = options.previewCandidates ?? false;
  const shouldProcessSelectedProducts = Boolean(
    previewCandidates && options.productIds && options.productIds.length > 0
  );
  const pending = shouldProcessSelectedProducts
    ? products
    : products.filter((product) => hasMissingOrInvalidImage(product.image_url));

  if (!dryRun) {
    await ensureBucketExists();
  }

  const limit = pLimit(concurrency);
  const settled = await Promise.allSettled(
    pending.map((product) => limit(() => processOneProduct(product, dryRun, previewCandidates)))
  );

  const results: FillProductImageResult[] = settled.map((item, index) => {
    if (item.status === 'fulfilled') return item.value;
    const fallback = pending[index];
    return {
      productId: normalizeProductId(fallback.id),
      sku: fallback.sku,
      name: fallback.name,
      success: false,
      dryRun,
      source: null,
      fallbackUsed: false,
      uploadedUrl: null,
      selectedCandidate: null,
      candidates: [],
      error: item.reason instanceof Error ? item.reason.message : String(item.reason),
    };
  });

  const success = results.filter((row) => row.success).length;
  const failed = results.length - success;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      processed: results.length,
      success,
      failed,
      dryRun,
    },
    results,
  };
}

export async function fillProductImagesForIds(
  productIds: string[],
  options: Omit<FillProductImagesOptions, 'productIds'> = {}
): Promise<FillProductImagesResult> {
  return fillMissingProductImages({
    ...options,
    productIds,
  });
}

export function productImageAuditToJson(result: FillProductImagesResult): string {
  return JSON.stringify(result, null, 2);
}
