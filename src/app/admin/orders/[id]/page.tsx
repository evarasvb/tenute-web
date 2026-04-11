'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Order, OrderStatus } from '@/types';

function formatCLP(n: number) {
  return '$' + n.toLocaleString('es-CL');
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: 'Pendiente', color: 'text-amber-700', bg: 'bg-amber-100' },
  paid: { label: 'Pagado', color: 'text-green-700', bg: 'bg-green-100' },
  preparing: { label: 'Preparando', color: 'text-blue-700', bg: 'bg-blue-100' },
  shipped: { label: 'Enviado', color: 'text-purple-700', bg: 'bg-purple-100' },
  delivered: { label: 'Entregado', color: 'text-green-700', bg: 'bg-green-100' },
  cancelled: { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-100' },
};

const STATUS_ORDER: OrderStatus[] = [
  'pending',
  'paid',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
];

const SHIPPING_LABELS: Record<string, string> = {
  pickup: 'Retiro en tienda — Feria de Hijuelas',
  local_delivery: 'Despacho local',
  starken: 'Envío nacional (Starken)',
};

const PAYMENT_LABELS: Record<string, string> = {
  mercadopago: 'MercadoPago',
  transfer: 'Transferencia bancaria',
  whatsapp: 'WhatsApp',
};

export default function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [shippingCost, setShippingCost] = useState('');

  useEffect(() => {
    fetch(`/api/admin/orders/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.order) {
          setOrder(data.order);
          setTrackingNumber(data.order.tracking_number || '');
          setAdminNotes(data.order.admin_notes || '');
          setShippingCost(
            data.order.shipping_cost?.toString() || '0'
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  async function updateOrder(updates: Record<string, unknown>) {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.order) {
        setOrder(data.order);
        setMessage('Pedido actualizado');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error: ' + (data.error || 'desconocido'));
      }
    } catch {
      setMessage('Error de conexión');
    }
    setSaving(false);
  }

  function handleStatusChange(newStatus: OrderStatus) {
    updateOrder({ status: newStatus });
  }

  function handleSaveTracking() {
    updateOrder({ tracking_number: trackingNumber });
  }

  function handleSaveNotes() {
    updateOrder({ admin_notes: adminNotes });
  }

  function handleSaveShippingCost() {
    const cost = parseInt(shippingCost) || 0;
    updateOrder({ shipping_cost: cost });
  }

  function buildWhatsAppStatusMessage(): string {
    if (!order) return '';
    const statusLabels: Record<string, string> = {
      pending: 'Pendiente',
      paid: 'Pagado',
      preparing: 'En preparación',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    };
    let msg = `Hola ${order.customer_name}, te informamos sobre tu pedido *${order.order_number}*:\n\n`;
    msg += `Estado: *${statusLabels[order.status] || order.status}*\n`;
    if (order.tracking_number) {
      msg += `Número de seguimiento: *${order.tracking_number}*\n`;
    }
    msg += `Total: *${formatCLP(order.total)}*\n`;
    msg += '\nGracias por tu compra en Tenute.';
    return msg;
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Pedido no encontrado</p>
        <Link href="/admin/orders" className="text-blue-600 hover:underline">
          Volver a pedidos
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status] || {
    label: order.status,
    color: 'text-gray-700',
    bg: 'bg-gray-100',
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/orders"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Pedido {order.order_number}
          </h1>
          <p className="text-sm text-gray-500">
            {new Date(order.created_at).toLocaleDateString('es-CL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${statusCfg.bg} ${statusCfg.color}`}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Success/Error message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.startsWith('Error')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Order details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Cliente
            </h3>
            <p className="text-sm">
              <span className="text-gray-500">Nombre:</span>{' '}
              <strong>{order.customer_name}</strong>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Teléfono:</span>{' '}
              <a
                href={`tel:${order.customer_phone}`}
                className="text-blue-600 hover:underline"
              >
                {order.customer_phone}
              </a>
            </p>
            {order.customer_email && (
              <p className="text-sm">
                <span className="text-gray-500">Email:</span>{' '}
                <a
                  href={`mailto:${order.customer_email}`}
                  className="text-blue-600 hover:underline"
                >
                  {order.customer_email}
                </a>
              </p>
            )}
            {order.customer_rut && (
              <p className="text-sm">
                <span className="text-gray-500">RUT:</span>{' '}
                {order.customer_rut}
              </p>
            )}
          </div>

          {/* Shipping Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Envío
            </h3>
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
            <p className="text-sm">
              <span className="text-gray-500">Costo envío:</span>{' '}
              {order.shipping_cost > 0 ? formatCLP(order.shipping_cost) : 'Gratis'}
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Pago:</span>{' '}
              {PAYMENT_LABELS[order.payment_method] || order.payment_method}
            </p>

            {/* Update shipping cost for Starken */}
            {order.shipping_method === 'starken' && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Actualizar costo de envío (CLP)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <button
                    onClick={handleSaveShippingCost}
                    disabled={saving}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Productos
            </h3>
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
                    <p className="text-sm font-medium text-gray-800">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCLP(item.unit_price)} x {item.quantity}
                      {item.product_sku && ` — SKU: ${item.product_sku}`}
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
                  {order.shipping_cost > 0
                    ? formatCLP(order.shipping_cost)
                    : 'Gratis'}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total</span>
                <span>{formatCLP(order.total)}</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Notas del cliente
              </h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right column - Actions */}
        <div className="space-y-6">
          {/* Status Change */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Cambiar estado
            </h3>
            <div className="space-y-2">
              {STATUS_ORDER.map((s) => {
                const cfg = STATUS_CONFIG[s];
                const isActive = order.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={isActive || saving}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? `${cfg.bg} ${cfg.color} ring-2 ring-offset-1 ring-blue-400`
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tracking Number */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Número de seguimiento
            </h3>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Ej: 123456789"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            <button
              onClick={handleSaveTracking}
              disabled={saving}
              className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Guardar tracking
            </button>
          </div>

          {/* Admin Notes */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Notas internas
            </h3>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Notas internas del pedido..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 resize-none"
            />
            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Guardar notas
            </button>
          </div>

          {/* WhatsApp */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Comunicación
            </h3>
            <a
              href={`https://wa.me/${order.customer_phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(buildWhatsAppStatusMessage())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Enviar estado por WhatsApp
            </a>

            <button
              onClick={() => window.print()}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Imprimir resumen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
