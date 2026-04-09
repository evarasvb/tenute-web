import Link from 'next/link';

export default function WholesaleBlock() {
  return (
    <section id="mayorista" className="py-16 bg-blue-700 text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest bg-blue-600 px-3 py-1 rounded-full mb-4 inline-block">
          Canal mayorista
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
          ¿Compras en volumen?
        </h2>
        <p className="text-blue-100 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
          Tenemos precios especiales para empresas, colegios, hoteles y revendedores.
          Mínimo de compra aplica. Cotiza sin compromiso.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-700 font-bold rounded-lg hover:bg-blue-50 transition-colors"
          >
            Solicitar cotización
          </Link>
          <a
            href="https://wa.me/56912345678?text=Hola%2C%20quiero%20consultar%20precios%20mayoristas%20Tenute"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 border-2 border-white/60 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
