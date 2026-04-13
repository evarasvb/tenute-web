import type { ProductMetadata } from '@/types';

/**
 * Parse product metadata from the metadata JSONB column.
 * Handles cases where the column doesn't exist yet (returns defaults).
 */
export function parseMetadata(raw: unknown): ProductMetadata {
  if (!raw || typeof raw !== 'object') return {};
  const m = raw as Record<string, unknown>;
  return {
    additional_images: Array.isArray(m.additional_images) ? m.additional_images : [],
    video_url: typeof m.video_url === 'string' ? m.video_url : undefined,
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
  warehouse_stock?: { ocoa: number; local21: number };
}): ProductMetadata {
  return {
    additional_images: opts.additional_images?.length ? opts.additional_images : [],
    video_url: opts.video_url || undefined,
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
