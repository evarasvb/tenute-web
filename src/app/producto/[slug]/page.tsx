import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductDetail from '@/components/product/ProductDetail';

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

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  return (
    <>
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
