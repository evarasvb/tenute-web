import Link from 'next/link';

const WA_FERIA =
  'https://wa.me/56994259157?text=' +
  encodeURIComponent(
    'Hola Tenute 👋 Los vi en la Feria Agro Tahsa (Hijuelas). Quiero más información.'
  );

export default function FeriaBanner() {
  return (
    <section className="bg-orange-500 text-white">
      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-100">
            📍 Esta semana
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold leading-tight">
            ¡Estamos en la Feria Agro Tahsa, Hijuelas!
          </h2>
          <p className="text-sm text-orange-50 mt-1">
            Local 21, Segunda Calle · Lunes a Viernes 9:00–18:00 · Compra en el
            puesto o pídenos por WhatsApp y te despachamos a todo Chile.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
          <a
            href={WA_FERIA}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-orange-600 font-bold rounded-lg hover:bg-orange-50 transition-colors"
          >
            💬 Escríbenos
          </a>
          <Link
            href="/catalogo"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 border-2 border-white/70 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    </section>
  );
}
