import { supabase } from '@/lib/supabase';

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

async function getFeaturedProducts() {
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_price, image_url, brand, categories(name)')
    .eq('is_featured', true)
    .order('name')
    .limit(12);

  if (data && data.length > 0) return data;

  // Fallback: get any 12 products with images
  const { data: fallback } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_price, image_url, brand, categories(name)')
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
            <div key={p.id} className="card flex flex-col">
              <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-4xl text-gray-300">📦</span>
                )}
              </div>
              <div className="p-3 flex flex-col gap-1 flex-1">
                <span className="text-xs text-blue-600 font-medium">
                  {(p.categories as any)?.name || p.brand || ''}
                </span>
                <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">{p.name}</p>
                <div className="mt-auto">
                  {p.compare_price && p.compare_price > p.price ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-gray-900">{formatCLP(p.price)}</span>
                      <span className="text-xs text-gray-400 line-through">{formatCLP(p.compare_price)}</span>
                    </div>
                  ) : (
                    <p className="text-base font-bold text-gray-900">{formatCLP(p.price)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
