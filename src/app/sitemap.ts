import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

const BASE_URL = 'https://www.tenute.cl';

export const revalidate = 3600; // regenera cada hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/catalogo`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/politicas`, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const { data: products } = await supabase
    .from('products')
    .select('slug, created_at')
    .eq('active', true);

  const { data: categories } = await supabase
    .from('categories')
    .select('slug');

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${BASE_URL}/producto/${p.slug}`,
    lastModified: p.created_at ? new Date(p.created_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${BASE_URL}/catalogo?categoria=${c.slug}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
