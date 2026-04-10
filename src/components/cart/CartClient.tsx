'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import ShippingEstimator from '@/components/cart/ShippingEstimator';

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function CartClient() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

  function buildWhatsAppMessage() {
    let msg = 'Hola, quiero realizar el siguiente pedido:\n\n';
    items.forEach((item, i) => {
      msg += `${i + 1}. ${item.name} x${item.quantity} — ${formatCLP(item.price * item.quantity)}\n`;
    });
    msg += `\nTotal: ${formatCLP(totalPrice)}`;
    msg += '\n\nQuedo atento/a a la confirmación.';
    return encodeURIComponent(msg);
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-5xl mb-4 block">🛒</span>
        <p className="text-gray-500 text-lg mb-2">Tu carro está vacío</p>
        <p className="text-gray-400 text-sm mb-6">Agrega productos desde nuestro catálogo</p>
        <Link href="/catalogo" className="btn-primary">
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Items */}
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="card p-4 flex gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-gray-300">📦</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/producto/${item.slug}`} className="text-sm font-semibold text-gray-800 hover:text-blue-600 line-clamp-2">
                {item.name}
              </Link>
              <p className="text-sm text-gray-500 mt-0.5">{formatCLP(item.price)} c/u</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 text-sm transition-colors"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-sm font-medium min-w-[2.5rem] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 text-sm transition-colors"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-gray-900">{formatCLP(item.price * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Shipping */}
      <ShippingEstimator />

      {/* Summary */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Productos ({totalItems})</span>
          <span className="font-medium">{formatCLP(totalPrice)}</span>
        </div>
        <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
          <span>Envío</span>
          <span>Por cotizar</span>
        </div>
        <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-lg font-bold text-gray-900">{formatCLP(totalPrice)}</span>
        </div>

        <div className="mt-6 space-y-3">
          <a
            href={`https://wa.me/56987299147?text=${buildWhatsAppMessage()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Pedir por WhatsApp
          </a>

          <button
            disabled
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-sky-100 text-sky-400 font-semibold text-sm cursor-not-allowed relative"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            Pagar con MercadoPago
            <span className="ml-1 text-xs bg-sky-200 text-sky-600 px-2 py-0.5 rounded-full">Próximamente</span>
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={clearCart}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Vaciar carro
          </button>
          <Link href="/politicas" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
            Ver políticas de cambio y envío
          </Link>
        </div>
      </div>
    </div>
  );
}
