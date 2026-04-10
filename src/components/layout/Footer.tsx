import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <p className="text-white font-bold text-lg mb-2">Tenute</p>
          <p className="text-sm leading-relaxed">
            Artículos de oficina, insumos desechables y varios.<br />
            Venta al por menor y mayorista.
          </p>
        </div>

        {/* Links */}
        <div>
          <p className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">Navegación</p>
          <ul className="flex flex-col gap-2 text-sm">
            <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
            <li><Link href="/catalogo" className="hover:text-white transition-colors">Catálogo</Link></li>
            <li><Link href="/#mayorista" className="hover:text-white transition-colors">Mayorista</Link></li>
            <li><Link href="/politicas" className="hover:text-white transition-colors">Políticas de cambio y envío</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">Contacto</p>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <a
                href="https://wa.me/56987299147"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors inline-flex items-center gap-1"
              >
                📱 +569 87299147 (WhatsApp)
              </a>
            </li>
            <li>📍 Feria de Hijuelas, Chile</li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 mt-8 pt-8 border-t border-gray-800 text-xs text-center">
        © {new Date().getFullYear()} Tenute. Todos los derechos reservados.
      </div>
    </footer>
  );
}
