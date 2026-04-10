import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PoliciesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Políticas de cambio, devolución y envío</h1>
          <p className="text-gray-500 mb-8">Información importante sobre tus compras en Tenute.</p>

          {/* Productos Nuevos */}
          <section className="card p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Política de Cambio y Devolución — Productos Nuevos</h2>
            <ul className="space-y-3 text-gray-700 text-sm leading-relaxed">
              <li className="flex gap-2">
                <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                <span>Plazo de <strong>10 días corridos</strong> desde la recepción para solicitar cambio.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                <span>El producto debe estar <strong>sin uso</strong>, con embalaje original y todos sus accesorios.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                <span>
                  Para solicitar un cambio, contactar por WhatsApp al{' '}
                  <a href="https://wa.me/56987299147" target="_blank" rel="noopener noreferrer" className="text-green-600 font-medium hover:underline">
                    +569 87299147
                  </a>{' '}
                  con: número de pedido, fotos del producto, motivo del cambio.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                <span>El costo de envío del cambio es <strong>responsabilidad del comprador</strong>, salvo que el producto llegue defectuoso o no corresponda a lo comprado.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                <span>En caso de producto defectuoso, <strong>Tenute cubre el envío de reemplazo</strong>.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                <span>No se realizan devoluciones de dinero, solo <strong>cambios por productos de igual o mayor valor</strong> (pagando la diferencia).</span>
              </li>
            </ul>
          </section>

          {/* Segunda Mano */}
          <section className="card p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Política de Cambio — Productos Segunda Mano</h2>
            <ul className="space-y-3 text-gray-700 text-sm leading-relaxed">
              <li className="flex gap-2">
                <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>
                <span>Los productos de segunda mano se venden <strong>&quot;en el estado en que se encuentran&quot;</strong>.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>
                <span><strong>NO tienen cambio ni devolución</strong>, salvo que la descripción del aviso no coincida con el producto recibido.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>
                <span>
                  Si hay discrepancia entre lo publicado y lo recibido, el comprador tiene <strong>3 días corridos</strong> para reportar por WhatsApp al{' '}
                  <a href="https://wa.me/56987299147" target="_blank" rel="noopener noreferrer" className="text-green-600 font-medium hover:underline">
                    +569 87299147
                  </a>{' '}
                  con fotos.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>
                <span>En ese caso, Tenute evaluará y podrá ofrecer un <strong>cambio o crédito en la tienda</strong>.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>
                <span>Se recomienda <strong>revisar cuidadosamente las fotos y descripción</strong> antes de comprar.</span>
              </li>
            </ul>
          </section>

          {/* Envíos */}
          <section className="card p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Envíos</h2>
            <ul className="space-y-3 text-gray-700 text-sm leading-relaxed">
              <li className="flex gap-2">
                <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                <span>Despachos a <strong>todo Chile</strong> vía <strong>Starken</strong>.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                <span>El costo de envío se calcula según destino y peso/volumen del pedido.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                <span>Tiempos de entrega: <strong>1-5 días hábiles</strong> en zonas urbanas, hasta <strong>10 días</strong> en zonas extremas.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                <span>Una vez despachado, se entrega el <strong>número de seguimiento de Starken</strong>.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                <span><strong>Retiro en tienda</strong> disponible en Feria de Hijuelas (sin costo).</span>
              </li>
            </ul>
          </section>

          {/* Contact CTA */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm mb-3">¿Tienes dudas sobre tu pedido?</p>
            <a
              href="https://wa.me/56987299147"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
