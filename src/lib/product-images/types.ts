export interface ProductRecord {
  id: string | number;
  sku: string | null;
  name: string;
  image_url: string | null;
  images: unknown;
}

export type AuditIssueType =
  | 'missing_image'
  | 'missing_gallery'
  | 'http_error'
  | 'http_timeout'
  | 'duplicate_url'
  | 'small_dimensions'
  | 'suspicious_domain';

export interface ProductImageAuditRow {
  product_id: string;
  sku: string | null;
  name: string;
  current_url: string | null;
  issue_type: AuditIssueType;
  http_status: number | null;
  suggested_url: string | null;
}

export interface ProductImageAuditSummary {
  totalProducts: number;
  withIssues: number;
  missingImage: number;
  missingGallery: number;
  httpErrors: number;
  httpTimeouts: number;
  duplicateUrls: number;
  smallDimensions: number;
  suspiciousDomains: number;
}

export interface ProductImageAuditResult {
  generatedAt: string;
  summary: ProductImageAuditSummary;
  issues: ProductImageAuditRow[];
}

export interface ImageCandidate {
  url: string;
  source: 'mercadolibre' | 'bing' | 'falabella' | 'sodimac';
  title?: string;
}

export interface FillProductImageResult {
  productId: string;
  sku: string | null;
  name: string;
  success: boolean;
  dryRun: boolean;
  source: string | null;
  fallbackUsed: boolean;
  uploadedUrl: string | null;
  selectedCandidate: string | null;
  candidates: ImageCandidate[];
  error: string | null;
}

export interface FillProductImagesSummary {
  processed: number;
  success: number;
  failed: number;
  dryRun: boolean;
}

export interface FillProductImagesResult {
  generatedAt: string;
  summary: FillProductImagesSummary;
  results: FillProductImageResult[];
}
