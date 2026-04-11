'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Order } from '@/types';

function formatCLP(n: number) {
  return '$' + n.toLocaleString('es-CL');
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
  preparing: { label: 'En preparación', color: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

const SHIPPING_LABELS: Record<string, string> = {
  pickup: 'Retiro en tienda — Feria de Hijuelas',
  local_delivery: 'Despacho local',
  starken: 'Envío nacional (Starken)',
};

export default function OrderDetailClient({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/orders/${orderNumber}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.order) {
          setOrder(data.order);
        } else {
          setError('Pedido no encontrado');
        }
      })
      .catch(() => setError('Error al cargar el pedido'))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-gray-500 mt-4">Cargando pedido...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg mb-4">{error || 'Pedido no encontrado'}</p>
        <Link href="/catalogo" className="btn-primary">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  const status = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Pedido {order.order_number}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(order.created_at).toLocaleDateString('es-CL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Customer Info */}
      <div className="card p-5 space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Datos del cliente</h3>
        <p className="text-sm">
          <span className="text-gray-500">Nombre:</span>{' '}
          <strong>{order.customer_name}</strong>
        </p>
        <p className="text-sm">
          <span className="text-gray-500">Teléfono:</span> {order.customer_phone}
        </p>
        {order.customer_email && (
          <p className="text-sm">
            <span className="text-gray-500">Email:</span> {order.customer_email}
          </p>
        )}
        {order.customer_rut && (
          <p className="text-sm">
            <span className="text-gray-500">RUT:</span> {order.customer_rut}
          </p>
        )}
      </div>

      {/* Shipping */}
      <div className="card p-5 space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Envío</h3>
        <p className="text-sm">
          <span className="text-gray-500">Método:</span>{' '}
          {SHIPPING_LABELS[order.shipping_method] || order.shipping_method}
        </p>
        {order.shipping_address && (
          <p className="text-sm">
            <span className="text-gray-500">Dirección:</span>{' '}
            {order.shipping_address}
            {order.shipping_commune && `, ${order.shipping_commune}`}
            {order.shipping_city && `, ${order.shipping_city}`}
            {order.shipping_region && `, ${order.shipping_region}`}
          </p>
        )}
        {order.tracking_number && (
          <p className="text-sm">
            <span className="text-gray-500">Número de seguimiento:</span>{' '}
            <strong>{order.tracking_number}</strong>
          </p>
        )}
        {order.shipping_method === 'starken' && !order.tracking_number && order.status === 'pending' && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
            Te contactaremos por WhatsApp para confirmar el costo de envío.
          </div>
        )}
      </div>

      {/* Items */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Productos</h3>
        <div className="space-y-3">
          {order.items?.map((item) => (
            <div key={item.id} className="flex gap-3 items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                {item.product_image_url ? (
                  <img
                    src={item.product_image_url}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-gray-300">📦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-1">
                  {item.product_name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatCLP(item.unit_price)} x {item.quantity}
                </p>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {formatCLP(item.subtotal)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 mt-4 pt-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCLP(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Envío</span>
            <span>
              {order.shipping_method === 'starken' && order.shipping_cost === 0
                ? 'Por cotizar'
                : order.shipping_cost === 0
                ? 'Gratis'
                : formatCLP(order.shipping_cost)}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold pt-1">
            <span>Total</span>
            <span>{formatCLP(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 text-center">
        Para consultas sobre tu pedido, contáctanos por WhatsApp al{' '}
        <a
          href="https://wa.me/56987299147"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline"
        >
          +569 8729 9147
        </a>
      </div>

      <div className="text-center">
        <Link href="/catalogo" className="btn-secondary">
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
