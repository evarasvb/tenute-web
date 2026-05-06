import type { ProductRecord } from '@/lib/product-images/types';
import { fetchImageBuffer } from '@/lib/product-images/http';
import { getImageBucketName, getPublicSupabaseUrl } from '@/lib/product-images/config';
import { getAdminSupabaseClient } from '@/lib/product-images/supabase';

function inferExtension(contentType: string, url: string): string {
  if (contentType.includes('image/png')) return 'png';
  if (contentType.includes('image/webp')) return 'webp';
  if (contentType.includes('image/gif')) return 'gif';
  if (contentType.includes('image/avif')) return 'avif';
  if (contentType.includes('image/jpeg')) return 'jpg';
  const fromUrl = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (fromUrl && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(fromUrl)) {
    return fromUrl === 'jpeg' ? 'jpg' : fromUrl;
  }
  return 'jpg';
}

export function toAbsoluteImageUrl(input: string | null): string | null {
  if (!input) return null;
  const value = input.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const base = getPublicSupabaseUrl();
  if (value.startsWith('/storage/')) return `${base}${value}`;
  if (value.startsWith('/')) return `${base}${value}`;
  return `${base}/${value}`;
}

export async function ensureProductImagesBucket(): Promise<void> {
  const supabase = getAdminSupabaseClient();
  const bucketName = getImageBucketName();
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`No se pudo listar buckets: ${error.message}`);
  const exists = (data || []).some((bucket) => bucket.name === bucketName);
  if (exists) return;
  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: '5MB',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
  });
  if (createError) {
    throw new Error(`No se pudo crear bucket "${bucketName}": ${createError.message}`);
  }
}

export async function uploadImageToStorage(opts: {
  productId: string;
  imageBuffer: Buffer;
  contentType: string;
  sourceUrl: string;
}): Promise<string> {
  const supabase = getAdminSupabaseClient();
  const bucketName = getImageBucketName();
  const extension = inferExtension(opts.contentType, opts.sourceUrl);
  const path = `auto/${opts.productId}.${extension}`;
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(path, opts.imageBuffer, { contentType: opts.contentType, upsert: true });
  if (error) {
    throw new Error(`Error subiendo imagen a storage: ${error.message}`);
  }
  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
  return data.publicUrl;
}

export interface UploadedImage {
  path: string;
  publicUrl: string;
  contentType: string;
}

export async function uploadImageToProductBucket(
  product: ProductRecord,
  sourceUrl: string
): Promise<UploadedImage | null> {
  const downloaded = await fetchImageBuffer(sourceUrl);
  if (!downloaded.buffer || downloaded.error) {
    return null;
  }

  const supabase = getAdminSupabaseClient();
  const bucketName = getImageBucketName();
  const extension = inferExtension(downloaded.contentType || 'image/jpeg', downloaded.url);
  const productId = String(product.id);
  const path = `auto/${productId}.${extension}`;
  const contentType = downloaded.contentType || 'image/jpeg';

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(path, downloaded.buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Error subiendo imagen a storage: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
  return {
    path,
    publicUrl: data.publicUrl,
    contentType,
  };
}

export const ensureBucketExists = ensureProductImagesBucket;

export async function replaceProductImageUrl(productId: string, newUrl: string): Promise<void> {
  const supabase = getAdminSupabaseClient();
  const { error } = await supabase
    .from('products')
    .update({
      image_url: newUrl,
      images: [newUrl],
    })
    .eq('id', productId);
  if (error) {
    throw new Error(`Error actualizando producto ${productId}: ${error.message}`);
  }
}
