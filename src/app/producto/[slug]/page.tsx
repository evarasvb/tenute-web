import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductDetail from '@/components/product/ProductDetail';

const BASE_URL = 'https://www.tenute.cl';

async function getProduct(slug: string) {
  const normalizedSlug = decodeURIComponent(slug).trim().toLowerCase();

  const { data } = await supabase
    .from('products')
    .select('id, name, slug, description, price, compare_price, stock, image_url, categories(name), sku, unit, format, content_info, metadata, video_url, active')
    .eq('slug', normalizedSlug)
    .eq('active', true)
    .limit(1);

  // Avoid 404s when there are duplicate slugs in the database.
  if (data && data.length > 0) return data[0];

  // Fallback for legacy rows where active can be null/false.
  const { data: fallback } = await supabase
    .from('products')
    .select('id, name, slug, description, price, compare_price, stock, image_url, categories(name), sku, unit, format, content_info, metadata, video_url, active')
    .eq('slug', normalizedSlug)
    .limit(1);

  return fallback?.[0] || null;
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
        <div className="max-w-6xl mx-auto px-4 py-8">
          <ProductDetail product={product} />
        </div>
      </main>
      <Footer />
    </>
  );
}
