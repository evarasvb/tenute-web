const CATEGORIES = [
  { name: 'Artículos de oficina', emoji: '✏️', slug: 'articulos-oficina', description: 'Lápices, archivadores, corchetes, clips, post-it y más.' },
  { name: 'Insumos desechables', emoji: '🥤', slug: 'insumos-desechables', description: 'Vasos, platos, cubiertos, marmitas, servilletas, bolsas.' },
  { name: 'Mobiliario', emoji: '🪑', slug: 'mobiliario', description: 'Escritorios, sillas, estanterías, archivadores metálicos.' },
  { name: 'Tecnología', emoji: '🖥️', slug: 'tecnologia', description: 'Toner, cartuchos, cables, accesorios computación.' },
  { name: 'Limpieza', emoji: '🧹', slug: 'limpieza', description: 'Jabón, papel higiénico, toalla nova, desinfectantes.' },
  { name: 'Papelería', emoji: '📄', slug: 'papeleria', description: 'Resmas, sobres, carpetas, cuadernos.' },
  { name: 'Remates y liquidaciones', emoji: '🔥', slug: 'remates-liquidaciones', description: 'Ofertas únicas, precios de liquidación.' },
  { name: 'Segunda mano', emoji: '♻️', slug: 'segunda-mano', description: 'Artículos usados en buen estado, mix de segunda.' },
  { name: 'Varios', emoji: '📦', slug: 'varios', description: 'Mix surtido y productos varios.' },
];

export default function Categories() {
  return (
    <section id="categorias" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Categorías</h2>
        <p className="text-gray-500 mb-8">Encuentra lo que necesitas por categoría.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.slug}
              href={`/catalogo?categoria=${cat.slug}`}
              className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors"
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
