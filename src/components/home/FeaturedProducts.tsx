import { supabase } from '@/lib/supabase';
import ProductCard from './ProductCard';

async function getFeaturedProducts() {
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_price, image_url, stock, categories(name)')
    .eq('is_featured', true)
    .order('name')
    .limit(12);

  if (data && data.length > 0) return data;

  const { data: fallback } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_price, image_url, stock, categories(name)')
    .not('image_url', 'is', null)
    .neq('image_url', '')
    .order('created_at', { ascending: false })
    .limit(12);

  return fallback || [];
}

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  if (products.length === 0) return null;

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Productos destacados</h2>
        <p className="text-gray-500 mb-8">Nuestros artículos más vendidos.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {products.map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
