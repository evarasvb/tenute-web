import Link from 'next/link';

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
      <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 flex flex-col items-start gap-6">
        <span className="text-xs font-semibold uppercase tracking-widest bg-blue-500/30 px-3 py-1 rounded-full">
          Venta al por menor y mayorista
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight max-w-2xl">
          Todo lo que tu oficina necesita, en un solo lugar
        </h1>
        <p className="text-blue-100 text-lg max-w-xl leading-relaxed">
          Artículos de oficina, insumos desechables y productos varios.
          Despacho a todo Chile. Precios especiales para compras mayoristas.
        </p>
        <div className="flex flex-wrap gap-3 mt-2">
          <Link href="/catalogo" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-bold rounded-lg hover:bg-blue-50 transition-colors">
            Ver catálogo
          </Link>
          <Link href="/#mayorista" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/60 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
            Soy mayorista
          </Link>
        </div>
      </div>
    </section>
  );
}
