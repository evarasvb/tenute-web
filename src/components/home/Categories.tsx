const CATEGORIES = [
  { name: 'Artículos de oficina', emoji: '🖊️', slug: 'oficina', description: 'Lapiceros, archivadores, carpetas, clips y más.' },
  { name: 'Insumos desechables', emoji: '🥤', slug: 'desechables', description: 'Vasos, platos, cubiertos, bolsas y embalaje.' },
  { name: 'Tecnología', emoji: '🖥️', slug: 'tecnologia', description: 'Accesorios de computación y electrónica básica.' },
  { name: 'Limpieza', emoji: '🧴', slug: 'limpieza', description: 'Productos de aseo y limpieza para empresas.' },
  { name: 'Papelería', emoji: '📋', slug: 'papeleria', description: 'Resmas, papel fotográfico, sobres y más.' },
  { name: 'Varios', emoji: '📦', slug: 'varios', description: 'Otros productos y novedades.' },
];

export default function Categories() {
  return (
    <section id="categorias" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Categorías</h2>
        <p className="text-gray-500 mb-8">Encuentra lo que necesitas por categoría.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.slug}
              href={`/catalogo?categoria=${cat.slug}`}
              className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="font-semibold text-sm text-gray-800 group-hover:text-blue-700 transition-colors">{cat.name}</span>
              <span className="text-xs text-gray-400 leading-snug hidden md:block">{cat.description}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
