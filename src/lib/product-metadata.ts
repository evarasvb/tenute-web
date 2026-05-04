import type { ProductMetadata } from '@/types';

/**
 * Parse product metadata from the metadata JSONB column.
 * Handles cases where the column doesn't exist yet (returns defaults).
 */
export function parseMetadata(raw: unknown): ProductMetadata {
  if (!raw || typeof raw !== 'object') return {};
  const m = raw as Record<string, unknown>;
  const competitorPrice =
    typeof m.competitor_price === 'number'
      ? m.competitor_price
      : typeof m.competitor_price === 'string'
      ? Number(m.competitor_price)
      : undefined;
  const competitorSource =
    typeof m.competitor_source === 'string' && m.competitor_source.trim()
      ? m.competitor_source.trim()
      : undefined;
  const competitorUpdatedAt =
    typeof m.competitor_updated_at === 'string' && m.competitor_updated_at.trim()
      ? m.competitor_updated_at.trim()
      : undefined;
  const competitorUrl =
    typeof m.competitor_url === 'string' && m.competitor_url.trim() ? m.competitor_url.trim() : undefined;
  return {
    additional_images: Array.isArray(m.additional_images) ? m.additional_images : [],
    video_url: typeof m.video_url === 'string' ? m.video_url : undefined,
    competitor_price:
      typeof competitorPrice === 'number' && Number.isFinite(competitorPrice) ? competitorPrice : undefined,
    competitor_source: competitorSource,
    competitor_url: competitorUrl,
    competitor_updated_at: competitorUpdatedAt,
    warehouse_stock: m.warehouse_stock && typeof m.warehouse_stock === 'object'
      ? {
          ocoa: Number((m.warehouse_stock as Record<string, unknown>).ocoa) || 0,
          local21: Number((m.warehouse_stock as Record<string, unknown>).local21) || 0,
        }
      : undefined,
  };
}

/**
 * Get warehouse stock values. Prefers dedicated columns if present,
 * falls back to metadata JSONB.
 */
export function getWarehouseStock(product: Record<string, unknown>): { ocoa: number; local21: number } {
  // Try dedicated columns first
  if (typeof product.stock_ocoa === 'number' && typeof product.stock_local21 === 'number') {
    return { ocoa: product.stock_ocoa, local21: product.stock_local21 };
  }
  // Fall back to metadata
  const meta = parseMetadata(product.metadata);
  if (meta.warehouse_stock) {
    return meta.warehouse_stock;
  }
  // Default: all stock in local21
  const totalStock = Number(product.stock) || 0;
  return { ocoa: 0, local21: totalStock };
}

/**
 * Get additional images from metadata or dedicated column.
 */
export function getAdditionalImages(product: Record<string, unknown>): string[] {
  const meta = parseMetadata(product.metadata);
  return meta.additional_images || [];
}

/**
 * Get video URL from product (dedicated column or metadata).
 */
export function getVideoUrl(product: Record<string, unknown>): string | undefined {
  if (typeof product.video_url === 'string' && product.video_url) return product.video_url;
  const meta = parseMetadata(product.metadata);
  return meta.video_url;
}

/**
 * Check if product is active. Uses 'active' column.
 */
export function isProductActive(product: Record<string, unknown>): boolean {
  if (typeof product.active === 'boolean') return product.active;
  return true; // default active
}

/**
 * Build metadata object for saving to DB.
 */
export function buildMetadata(opts: {
  additional_images?: string[];
  video_url?: string;
  competitor_price?: number;
  competitor_source?: string;
  competitor_url?: string;
  competitor_updated_at?: string;
  warehouse_stock?: { ocoa: number; local21: number };
}): ProductMetadata {
  const competitorPrice =
    typeof opts.competitor_price === 'number' && Number.isFinite(opts.competitor_price)
      ? opts.competitor_price
      : undefined;
  const competitorSource =
    typeof opts.competitor_source === 'string' && opts.competitor_source.trim()
      ? opts.competitor_source.trim()
      : undefined;
  const competitorUrl =
    typeof opts.competitor_url === 'string' && opts.competitor_url.trim()
      ? opts.competitor_url.trim()
      : undefined;
  const competitorUpdatedAt =
    typeof opts.competitor_updated_at === 'string' && opts.competitor_updated_at.trim()
      ? opts.competitor_updated_at.trim()
      : undefined;
  return {
    additional_images: opts.additional_images?.length ? opts.additional_images : [],
    video_url: opts.video_url || undefined,
    competitor_price: competitorPrice,
    competitor_source: competitorSource,
    competitor_url: competitorUrl,
    competitor_updated_at: competitorUpdatedAt,
    warehouse_stock: opts.warehouse_stock,
  };
}

/**
 * Convert YouTube URL to embed URL.
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  // youtube.com/watch?v=ID
  let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  // Already an embed URL
  if (url.includes('youtube.com/embed/')) return url;
  return null;
}
