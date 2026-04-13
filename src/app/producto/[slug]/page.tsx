import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductDetail from '@/components/product/ProductDetail';

async function getProduct(slug: string) {
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, description, price, compare_price, stock, image_url, categories(name), sku, unit, format, content_info, metadata, video_url, active')
    .eq('slug', slug)
    .single();
  return data;
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
