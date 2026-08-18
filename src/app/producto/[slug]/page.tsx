import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductDetail from '@/components/product/ProductDetail';
import ProductCard from '@/components/home/ProductCard';

const BASE_URL = 'https://www.tenute.cl';

const PRODUCT_FIELDS =
  'id, name, slug, description, price, compare_price, stock, image_url, category_id, categories(name), sku, unit, format, content_info, metadata, video_url, active';

async function getProduct(slug: string) {
  const normalizedSlug = decodeURIComponent(slug).trim().toLowerCase();

  const { data } = await supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .eq('slug', normalizedSlug)
    .eq('active', true)
    .limit(1);

  // Avoid 404s when there are duplicate slugs in the database.
  if (data && data.length > 0) return data[0];

  // Fallback for legacy rows where active can be null/false.
  const { data: fallback } = await supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .eq('slug', normalizedSlug)
    .limit(1);

  return fallback?.[0] || null;
}

/**
 * Productos alternativos: misma categoría, priorizando los que tienen foto.
 * Si no alcanzan, se completa con otros productos activos con foto.
 */
async function getRelatedProducts(product: {
  id: string | number;
  category_id: number | null;
}) {
  const RELATED_FIELDS = 'id, name, slug, price, compare_price, image_url, stock, metadata, categories(name)';
  const collected: any[] = [];
  const seen = new Set<string>([String(product.id)]);

  const pushUnique = (rows: any[] | null | undefined) => {
    for (const r of rows || []) {
      const key = String(r.id);
      if (seen.has(key)) continue;
      seen.add(key);
      collected.push(r);
    }
  };

  if (product.category_id != null) {
    const { data: sameCat } = await supabase
      .from('products')
      .select(RELATED_FIELDS)
      .eq('category_id', product.category_id)
      .eq('active', true)
      .neq('id', product.id)
      .not('image_url', 'is', null)
      .neq('image_url', '')
      .limit(10);
    pushUnique(sameCat);
  }

  // Completar con destacados/recientes con foto si faltan alternativas.
  if (collected.length < 4) {
    const { data: extra } = await supabase
      .from('products')
      .select(RELATED_FIELDS)
      .eq('active', true)
      .neq('id', product.id)
      .not('image_url', 'is', null)
      .neq('image_url', '')
      .order('created_at', { ascending: false })
      .limit(12);
    pushUnique(extra);
  }

  return collected.slice(0, 5);
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Producto no encontrado' };

  const desc =
    product.description?.slice(0, 160) ||
    `Compra ${product.name} en Tenute. Despacho a todo Chile.`;

  return {
    title: product.name,
    description: desc,
    alternates: { canonical: `${BASE_URL}/producto/${product.slug}` },
    openGraph: {
      title: product.name,
      description: desc,
      url: `${BASE_URL}/producto/${product.slug}`,
      type: 'website',
      images: product.image_url ? [{ url: product.image_url }] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product as any);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: product.image_url ? [product.image_url] : undefined,
    sku: product.sku ?? String(product.id),
    brand: { '@type': 'Brand', name: 'Tenute' },
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/producto/${product.slug}`,
      priceCurrency: 'CLP',
      price: product.price,
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8 pb-28 md:pb-8">
          <ProductDetail product={product} />

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Productos alternativos</h2>
              <p className="text-sm text-gray-500 mb-5">Otras opciones que te pueden servir.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {related.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
