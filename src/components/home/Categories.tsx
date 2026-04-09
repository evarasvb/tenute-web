import { supabase } from '@/lib/supabase';

const CATEGORY_EMOJIS: Record<string, string> = {
  'articulos-oficina': '✏️',
  'insumos-desechables': '🥤',
  'mobiliario': '🪑',
  'tecnologia': '🖥️',
  'limpieza': '🧹',
  'papeleria': '📄',
  'remates-liquidaciones': '🔥',
  'segunda-mano': '♻️',
  'varios': '📦',
};

async function getCategories() {
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .order('name');

  return data || [];
}

export default async function Categories() {
  const categories = await getCategories();

  if (categories.length === 0) return null;

  return (
    <section id="categorias" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Categorías</h2>
        <p className="text-gray-500 mb-8">Encuentra lo que necesitas por categoría.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {categories.map((cat: any) => (
            <a
              key={cat.slug}
              href={`/catalogo?categoria=${cat.slug}`}
              className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors"
            >
              <span className="text-3xl">{CATEGORY_EMOJIS[cat.slug] || '📦'}</span>
              <span className="font-semibold text-sm text-gray-800">{cat.name}</span>
              <span className="text-xs text-gray-400 leading-snug hidden md:block">{cat.description}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
