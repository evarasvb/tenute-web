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

  // Solo productos activos CON stock real (stock = stock_ocoa + stock_local21,
  // sincronizado por trigger). Esto evita listar el catalogo no vendible en el
  // sitemap, que es la causa raiz de la baja indexacion en Google.
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at, created_at')
    .eq('active', true)
    .gt('stock', 0);

  const { data: categories } = await supabase
    .from('categories')
    .select('slug');

  const productRoutes: MetadataRoute.Sitemap = (products ?? [])
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${BASE_URL}/producto/${p.slug.toLowerCase()}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : p.created_at ? new Date(p.created_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? [])
    .filter((c) => c.slug)
    .map((c) => ({
      url: `${BASE_URL}/catalogo?categoria=${c.slug.toLowerCase()}`,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
