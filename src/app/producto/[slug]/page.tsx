import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductDetail from '@/components/product/ProductDetail';

async function getProduct(slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('slug', slug)
    .single();
  if (error) console.error('[ProductPage] Supabase error:', error.message);
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
