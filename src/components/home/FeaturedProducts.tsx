// TODO Fase 2: reemplazar mock por lectura real desde Supabase
const MOCK_PRODUCTS = [
  { id: 1, name: 'Pack 100 vasos desechables 7oz', price: 2490, image_url: null, category: 'Desechables' },
  { id: 2, name: 'Archivador lomo ancho A4', price: 1890, image_url: null, category: 'Oficina' },
  { id: 3, name: 'Resma papel A4 75g 500 hojas', price: 4990, image_url: null, category: 'Papelería' },
  { id: 4, name: 'Set lapiceros azul x10', price: 990, image_url: null, category: 'Oficina' },
  { id: 5, name: 'Bolsas basura 80L x25u', price: 1490, image_url: null, category: 'Desechables' },
  { id: 6, name: 'Mouse inalámbrico USB', price: 7990, image_url: null, category: 'Tecnología' },
];

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function FeaturedProducts() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Productos destacados</h2>
        <p className="text-gray-500 mb-8">Nuestros artículos más vendidos.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {MOCK_PRODUCTS.map((p) => (
            <div key={p.id} className="card flex flex-col">
              <div className="aspect-square bg-gray-100 flex items-center justify-center text-4xl">
                📦
              </div>
              <div className="p-3 flex flex-col gap-1 flex-1">
                <span className="text-xs text-blue-600 font-medium">{p.category}</span>
                <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">{p.name}</p>
                <p className="text-base font-bold text-gray-900 mt-auto">{formatCLP(p.price)}</p>
              </div>
              <div className="px-3 pb-3">
                <button className="w-full py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Agregar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
