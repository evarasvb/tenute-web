'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Order, OrderStatus } from '@/types';

function formatCLP(n: number) {
  return '$' + n.toLocaleString('es-CL');
}

function cleanPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  // Ensure it starts with 56
  if (digits.startsWith('56')) return digits;
  if (digits.startsWith('9') && digits.length === 9) return '56' + digits;
  if (digits.startsWith('09') && digits.length === 10) return '56' + digits.slice(1);
  return '56' + digits;
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

const SHIPPING_LABELS: Record<string, string> = {
  pickup: 'Retiro en tienda — Feria Agro Tahsa, Local 21, Hijuelas',
  local_delivery: 'Despacho local',
  starken: 'Envío nacional (Starken)',
};

const PAYMENT_LABELS: Record<string, string> = {
  mercadopago: 'MercadoPago',
  transfer: 'Transferencia bancaria',
  whatsapp: 'WhatsApp',
  flow: 'Tarjeta (Flow.cl)',
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
  const [trackingInput, setTrackingInput] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [labelPackages, setLabelPackages] = useState('1');
  const [labelWeight, setLabelWeight] = useState('');
  const [labelPreparedBy, setLabelPreparedBy] = useState('');
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/admin/orders/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.order) {
          setOrder(data.order);
          setTrackingInput(data.order.tracking_number || '');
          setAdminNotes(data.order.admin_notes || '');
          setShippingCost(data.order.shipping_cost?.toString() || '0');
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
        return data.order;
      } else {
        setMessage('Error: ' + (data.error || 'desconocido'));
        return null;
      }
    } catch {
      setMessage('Error de conexión');
      return null;
    } finally {
      setSaving(false);
    }
  }

  function openWhatsApp(msg: string) {
    if (!order) return;
    const phone = cleanPhone(order.customer_phone);
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  }

  // === WhatsApp Workflow Buttons ===
  async function handleConfirmPayment() {
    const updated = await updateOrder({ status: 'paid' });
    if (updated) {
      openWhatsApp(
        `Hola ${order!.customer_name}! Tu pedido ${order!.order_number} ha sido confirmado. Estamos preparando tu envío. Te avisaremos cuando esté listo. Gracias por comprar en Tenute!`
      );
    }
  }

  async function handleMarkPreparing() {
    const updated = await updateOrder({ status: 'preparing' });
    if (updated) {
      openWhatsApp(
        `Hola ${order!.customer_name}! Tu pedido ${order!.order_number} está siendo preparado para envío. Te notificaremos el número de seguimiento pronto.`
      );
    }
  }

  async function handleSendTracking() {
    if (!trackingInput.trim()) return;
    const updated = await updateOrder({
      status: 'shipped',
      tracking_number: trackingInput.trim(),
    });
    if (updated) {
      setShowTrackingModal(false);
      openWhatsApp(
        `Hola ${order!.customer_name}! Tu pedido ${order!.order_number} ha sido despachado por Starken. Tu número de seguimiento es: ${trackingInput.trim()}. Puedes rastrear tu envío en: https://www.starken.cl/seguimiento Gracias por comprar en Tenute!`
      );
    }
  }

  async function handleMarkDelivered() {
    const updated = await updateOrder({ status: 'delivered' });
    if (updated) {
      openWhatsApp(
        `Hola ${order!.customer_name}! Tu pedido ${order!.order_number} ha sido entregado. Esperamos que disfrutes tu compra. Si necesitas algo, escríbenos al +569 87299147. Gracias por comprar en Tenute!`
      );
    }
  }

  function handleSaveNotes() {
    updateOrder({ admin_notes: adminNotes });
  }

  function handleSaveShippingCost() {
    const cost = parseInt(shippingCost) || 0;
    updateOrder({ shipping_cost: cost });
  }

  function handlePrintLabel() {
    setShowLabelModal(true);
  }

  function printLabel() {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !order) return;

    const shippingMethodLabel =
      order.shipping_method === 'starken'
        ? 'Starken Normal'
        : order.shipping_method === 'local_delivery'
        ? 'Despacho Local'
        : 'Retiro en Tienda';

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const orderDate = new Date(order.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const addressParts = [order.shipping_address].filter(Boolean);
    const locationParts = [order.shipping_commune, order.shipping_city, order.shipping_region].filter(Boolean).join(', ');

    const itemsHtml = (order.items || [])
      .map(
        (item) =>
          `<div style="padding:3px 0;"><strong>[${item.product_sku || 'S/C'}] ${item.product_name}</strong> — Cant: ${item.quantity} un.</div>`
      )
      .join('');

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Etiqueta ${order.order_number}</title>
  <style>
    @page { size: A5 landscape; margin: 8mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000; }
    .label {
      width: 100%; max-width: 210mm; border: 2px solid #000;
      padding: 0; page-break-after: always;
    }
    .section { padding: 8px 12px; border-bottom: 2px solid #000; }
    .section:last-child { border-bottom: none; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; }
    .header-left .brand { font-size: 22px; font-weight: bold; letter-spacing: 2px; }
    .header-left .sender { font-size: 11px; color: #444; }
    .header-right { text-align: right; font-size: 11px; }
    .header-right .order-num { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
    .dest-label { font-size: 10px; font-weight: bold; color: #666; letter-spacing: 1px; margin-bottom: 4px; }
    .dest-name { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
    .dest-phone { font-size: 20px; font-weight: bold; margin-bottom: 4px; border: 1px solid #000; display: inline-block; padding: 2px 8px; }
    .dest-address { font-size: 13px; margin-bottom: 2px; }
    .dest-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .shipping-row { display: flex; gap: 24px; font-size: 13px; font-weight: bold; }
    .items { font-size: 11px; }
    .items-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .items-label { font-size: 10px; font-weight: bold; color: #666; letter-spacing: 1px; }
    .bultos { font-size: 13px; font-weight: bold; }
    .notes-label { font-size: 10px; font-weight: bold; color: #666; letter-spacing: 1px; margin-bottom: 2px; }
    .notes { font-size: 11px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="label">
    <div class="section">
      <div class="header">
        <div class="header-left">
          <div class="brand">TENUTE</div>
          <div class="sender">Feria Agro Tahsa, Local 21</div>
          <div class="sender">Hijuelas, V Región</div>
          <div class="sender">+569 87299147</div>
        </div>
        <div class="header-right">
          <div class="order-num">PEDIDO ${order.order_number}</div>
          <div>Fecha: ${orderDate}</div>
          <div>Embalaje: ${dateStr}</div>
          ${labelPreparedBy ? `<div>Preparado por: ${labelPreparedBy}</div>` : ''}
        </div>
      </div>
    </div>
    <div class="section" style="min-height: 80px;">
      <div class="dest-label">DESTINATARIO:</div>
      <div class="dest-row">
        <div style="flex:1;">
          <div class="dest-name">${order.customer_name}</div>
          <div class="dest-address">${addressParts.join(', ') || 'Sin dirección'}</div>
          <div class="dest-address">${locationParts || ''}</div>
          ${order.notes ? `<div style="font-size:11px;margin-top:4px;"><strong>Obs:</strong> ${order.notes}</div>` : ''}
        </div>
        <div style="text-align:right;padding-left:16px;">
          <div class="dest-phone">Tel: ${order.customer_phone}</div>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="items-header">
        <div class="items-label">CONTENIDO:</div>
        <div class="bultos">BULTOS: ${labelPackages || '1'}</div>
      </div>
      <div class="items">${itemsHtml}</div>
    </div>
    <div class="section">
      <div class="shipping-row">
        <span>ENVÍO: ${shippingMethodLabel}</span>
        ${labelWeight ? `<span>PESO APROX: ${labelWeight} kg</span>` : ''}
      </div>
    </div>
  </div>
  <script>window.onload=function(){window.print();}</script>
</body>
</html>`);
    printWindow.document.close();
    setShowLabelModal(false);
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
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
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
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusCfg.bg} ${statusCfg.color}`}>
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
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Cliente</h3>
            <p className="text-sm">
              <span className="text-gray-500">Nombre:</span>{' '}
              <strong>{order.customer_name}</strong>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Teléfono:</span>{' '}
              <a href={`tel:${order.customer_phone}`} className="text-blue-600 hover:underline">
                {order.customer_phone}
              </a>
            </p>
            {order.customer_email && (
              <p className="text-sm">
                <span className="text-gray-500">Email:</span>{' '}
                <a href={`mailto:${order.customer_email}`} className="text-blue-600 hover:underline">
                  {order.customer_email}
                </a>
              </p>
            )}
            {order.customer_rut && (
              <p className="text-sm">
                <span className="text-gray-500">RUT:</span> {order.customer_rut}
              </p>
            )}
          </div>

          {/* Shipping Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-2">
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
            <p className="text-sm">
              <span className="text-gray-500">Costo envío:</span>{' '}
              {order.shipping_cost > 0 ? formatCLP(order.shipping_cost) : 'Gratis'}
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Pago:</span>{' '}
              {PAYMENT_LABELS[order.payment_method] || order.payment_method}
            </p>
            {order.tracking_number && (
              <p className="text-sm">
                <span className="text-gray-500">Tracking:</span>{' '}
                <strong>{order.tracking_number}</strong>
              </p>
            )}

            {/* Update shipping cost */}
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
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Productos</h3>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.product_image_url ? (
                      <img src={item.product_image_url} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm text-gray-300">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{item.product_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatCLP(item.unit_price)} x {item.quantity}
                      {item.product_sku && ` — SKU: ${item.product_sku}`}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatCLP(item.subtotal)}</p>
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
                <span>{order.shipping_cost > 0 ? formatCLP(order.shipping_cost) : 'Gratis'}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total</span>
                <span>{formatCLP(order.total)}</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Notas del cliente</h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right column - Actions */}
        <div className="space-y-6">
          {/* Order Workflow Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Acciones del pedido
            </h3>
            <div className="space-y-2">
              {/* Confirm Payment */}
              <button
                onClick={handleConfirmPayment}
                disabled={saving || order.status !== 'pending'}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  order.status === 'pending'
                    ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confirmar pago
              </button>

              {/* Mark Preparing */}
              <button
                onClick={handleMarkPreparing}
                disabled={saving || order.status !== 'paid'}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  order.status === 'paid'
                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Marcar en preparación
              </button>

              {/* Send Tracking */}
              <button
                onClick={() => setShowTrackingModal(true)}
                disabled={saving || (order.status !== 'preparing' && order.status !== 'paid')}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  order.status === 'preparing' || order.status === 'paid'
                    ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
                Enviar tracking
              </button>

              {/* Mark Delivered */}
              <button
                onClick={handleMarkDelivered}
                disabled={saving || order.status !== 'shipped'}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  order.status === 'shipped'
                    ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Marcar entregado
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
              Cada acción cambia el estado y abre WhatsApp con un mensaje al cliente.
            </div>
          </div>

          {/* Print & Label */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Impresión</h3>
            <button
              onClick={handlePrintLabel}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir etiqueta de envío
            </button>
          </div>

          {/* Admin Notes */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Notas internas</h3>
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

          {/* Manual Status Override */}
          <details className="bg-white rounded-lg border border-gray-200 p-5">
            <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
              Cambio manual de estado
            </summary>
            <div className="mt-3 space-y-2">
              {(['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map((s) => {
                const cfg = STATUS_CONFIG[s];
                const isActive = order.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => updateOrder({ status: s })}
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
          </details>
        </div>
      </div>

      {/* Tracking Number Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Enviar número de seguimiento
            </h3>
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="Número de seguimiento Starken"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <p className="text-xs text-gray-500 mb-4">
              Se cambiará el estado a &quot;Enviado&quot; y se enviará un WhatsApp al cliente con el tracking.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTrackingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendTracking}
                disabled={!trackingInput.trim() || saving}
                className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Enviar tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Label Modal */}
      {showLabelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Imprimir etiqueta de envío
            </h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad de bultos
                </label>
                <input
                  type="number"
                  value={labelPackages}
                  onChange={(e) => setLabelPackages(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso aproximado (kg) <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={labelWeight}
                  onChange={(e) => setLabelWeight(e.target.value)}
                  placeholder="Ej: 2.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preparado por
                </label>
                <input
                  type="text"
                  value={labelPreparedBy}
                  onChange={(e) => setLabelPreparedBy(e.target.value)}
                  placeholder="Tenute"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLabelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={printLabel}
                className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
