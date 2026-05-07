import { createClient } from '@supabase/supabase-js';
import type { ProductRecord } from '@/lib/product-images/types';
import { getPublicSupabaseUrl } from '@/lib/product-images/config';

export function getAdminSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient(getPublicSupabaseUrl(), serviceRoleKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        'x-client-info': 'tenute-product-images',
      },
    },
  });
}

export function normalizeProductId(value: string | number): string {
  return String(value);
}

export function hasMissingOrInvalidImage(value: string | null | undefined): boolean {
  if (!value) return true;
  return value.trim().length === 0;
}

export function mapProductRecord(row: Record<string, unknown>): ProductRecord {
  return {
    id: row.id as string | number,
    sku: typeof row.sku === 'string' ? row.sku : null,
    name: typeof row.name === 'string' ? row.name : '',
    image_url: typeof row.image_url === 'string' ? row.image_url : null,
    images: row.images,
  };
}

export async function selectProducts(productIds?: string[]): Promise<ProductRecord[]> {
  const supabase = getAdminSupabaseClient();
  let query = supabase
    .from('products')
    .select('id, sku, name, image_url, images')
    .order('id', { ascending: true });

  if (productIds && productIds.length > 0) {
    query = query.in('id', productIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`No se pudo cargar products: ${error.message}`);
  }

  return (data || []).map((row) => mapProductRecord(row as Record<string, unknown>));
}
