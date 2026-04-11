'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import type { ShippingZone } from '@/types';
import { supabase } from '@/lib/supabase';

function formatCLP(n: number) {
  return '$' + n.toLocaleString('es-CL');
}

type ShippingMethod = 'pickup' | 'local_delivery' | 'starken';
type PaymentMethod = 'transfer' | 'whatsapp';

interface CustomerInfo {
  name: string;
  phone: string;
  rut: string;
  email: string;
}

interface ShippingInfo {
  method: ShippingMethod | '';
  commune: string;
  address: string;
  city: string;
  region: string;
  cost: number;
  estimatedDays: string;
}

const STEPS = ['Datos', 'Envío', 'Resumen', 'Confirmación'];

export default function CheckoutClient() {
  const router = useRouter();
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [orderResult, setOrderResult] = useState<{
    order_number: string;
    id: string;
    shipping_method: string;
  } | null>(null);

  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    phone: '',
    rut: '',
    email: '',
  });

  const [shipping, setShipping] = useState<ShippingInfo>({
    method: '',
    commune: '',
    address: '',
    city: '',
    region: '',
    cost: 0,
    estimatedDays: '',
  });

  useEffect(() => {
    supabase
      .from('shipping_zones')
      .select('*')
      .eq('is_active', true)
      .order('delivery_cost', { ascending: true })
      .then(({ data }) => {
        if (data) setZones(data);
      });
  }, []);

  // Redirect to cart if empty (except on confirmation step)
  useEffect(() => {
    if (items.length === 0 && step < 3 && !orderResult) {
      router.push('/carro');
    }
  }, [items, step, orderResult, router]);

  function validateStep0(): boolean {
    if (!customer.name.trim()) {
      setError('Ingresa tu nombre');
      return false;
    }
    if (!customer.phone.trim()) {
      setError('Ingresa tu teléfono');
      return false;
    }
    // Basic Chilean phone validation
    const phoneClean = customer.phone.replace(/\s/g, '');
    if (!/^(\+?56)?[0-9]{8,9}$/.test(phoneClean)) {
      setError('Ingresa un teléfono válido (ej: +569 87299147)');
      return false;
    }
    setError('');
    return true;
  }

  function validateStep1(): boolean {
    if (!shipping.method) {
      setError('Selecciona un método de envío');
      return false;
    }
    if (shipping.method === 'local_delivery' && !shipping.commune) {
      setError('Selecciona tu comuna');
      return false;
    }
    if (shipping.method === 'local_delivery' && !shipping.address.trim()) {
      setError('Ingresa tu dirección de entrega');
      return false;
    }
    if (shipping.method === 'starken') {
      if (!shipping.address.trim() || !shipping.commune.trim() || !shipping.city.trim() || !shipping.region.trim()) {
        setError('Completa todos los campos de dirección');
        return false;
      }
    }
    setError('');
    return true;
  }

  function handleNext() {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    setStep((s) => Math.min(s + 1, 3));
  }

  function handleBack() {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  }

  function selectShippingMethod(method: ShippingMethod) {
    setShipping((prev) => ({
      ...prev,
      method,
      commune: '',
      address: '',
      city: '',
      region: '',
      cost: method === 'pickup' ? 0 : prev.cost,
      estimatedDays: method === 'pickup' ? '' : prev.estimatedDays,
    }));
    setError('');
  }

  function selectLocalCommune(communeName: string) {
    const zone = zones.find((z) => z.commune_name === communeName);
    setShipping((prev) => ({
      ...prev,
      commune: communeName,
      cost: zone?.delivery_cost || 0,
      estimatedDays: zone?.estimated_days || '',
    }));
  }

  const shippingTotal =
    shipping.method === 'starken' ? 0 : shipping.cost;
  const grandTotal = totalPrice + shippingTotal;

  async function placeOrder(paymentMethod: PaymentMethod) {
    setLoading(true);
    setError('');

    try {
      const orderData = {
        customer_name: customer.name.trim(),
        customer_phone: customer.phone.trim(),
        customer_email: customer.email.trim() || null,
        customer_rut: customer.rut.trim() || null,
        shipping_method: shipping.method,
        shipping_address: shipping.address.trim() || null,
        shipping_commune: shipping.commune.trim() || null,
        shipping_city: shipping.city.trim() || null,
        shipping_region: shipping.region.trim() || null,
        shipping_cost: shippingTotal,
        payment_method: paymentMethod,
        items: items.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          product_sku: null,
          product_image_url: item.image_url,
          quantity: item.quantity,
          unit_price: item.price,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Error al crear el pedido');
        setLoading(false);
        return;
      }

      const order = result.order;
      setOrderResult({
        order_number: order.order_number,
        id: order.id,
        shipping_method: order.shipping_method,
      });

      // Build WhatsApp message for the order
      const whatsappMsg = buildWhatsAppMessage(order, paymentMethod);

      if (paymentMethod === 'whatsapp') {
        // Open WhatsApp with the order
        window.open(
          `https://wa.me/56987299147?text=${encodeURIComponent(whatsappMsg)}`,
          '_blank'
        );
      }

      clearCart();
      setStep(3);
    } catch {
      setError('Error de conexión. Intenta nuevamente.');
    }
    setLoading(false);
  }

  function buildWhatsAppMessage(
    order: { order_number: string; shipping_method: string },
    paymentMethod: PaymentMethod
  ): string {
    let msg = `Hola, quiero confirmar mi pedido *${order.order_number}*\n\n`;
    msg += `*Cliente:* ${customer.name}\n`;
    msg += `*Teléfono:* ${customer.phone}\n`;
    if (customer.email) msg += `*Email:* ${customer.email}\n`;
    if (customer.rut) msg += `*RUT:* ${customer.rut}\n`;

    msg += '\n*Productos:*\n';
    items.forEach((item, i) => {
      msg += `${i + 1}. ${item.name} x${item.quantity} — ${formatCLP(item.price * item.quantity)}\n`;
    });

    msg += `\n*Subtotal:* ${formatCLP(totalPrice)}`;

    if (order.shipping_method === 'pickup') {
      msg += '\n*Envío:* Retiro en tienda (Feria de Hijuelas)';
    } else if (order.shipping_method === 'local_delivery') {
      msg += `\n*Envío:* Despacho local a ${shipping.commune} — ${shipping.cost > 0 ? formatCLP(shipping.cost) : 'Gratis'}`;
      msg += `\n*Dirección:* ${shipping.address}`;
    } else {
      msg += '\n*Envío:* Nacional (Starken) — Por cotizar';
      msg += `\n*Dirección:* ${shipping.address}, ${shipping.commune}, ${shipping.city}, ${shipping.region}`;
    }

    msg += `\n*Total:* ${formatCLP(grandTotal)}`;

    if (paymentMethod === 'transfer') {
      msg += '\n\nPagaré por *transferencia bancaria*.';
    }

    msg += '\n\nQuedo atento/a a la confirmación.';
    return msg;
  }

  // ========== Step 0: Customer Info ==========
  function renderStep0() {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Tus datos</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo *
          </label>
          <input
            type="text"
            value={customer.name}
            onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
            placeholder="Juan Pérez"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono *
          </label>
          <input
            type="tel"
            value={customer.phone}
            onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
            placeholder="+569 12345678"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            RUT <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={customer.rut}
            onChange={(e) => setCustomer((c) => ({ ...c, rut: e.target.value }))}
            placeholder="12.345.678-9"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            type="email"
            value={customer.email}
            onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
            placeholder="tu@email.com"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>
    );
  }

  // ========== Step 1: Shipping ==========
  function renderStep1() {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Método de envío</h2>

        {/* Option 1: Pickup */}
        <button
          onClick={() => selectShippingMethod('pickup')}
          className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
            shipping.method === 'pickup'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Retiro en tienda</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Feria de Hijuelas, Hijuelas, V Región
              </p>
            </div>
            <span className="text-sm font-bold text-green-600">Gratis</span>
          </div>
        </button>

        {/* Option 2: Local Delivery */}
        <button
          onClick={() => selectShippingMethod('local_delivery')}
          className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
            shipping.method === 'local_delivery'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div>
            <p className="font-semibold text-gray-900">Despacho local</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Ocoa, Hijuelas, La Calera, La Cruz, Quillota, Nogales, Limache
            </p>
          </div>
        </button>

        {shipping.method === 'local_delivery' && (
          <div className="ml-4 space-y-3 border-l-2 border-blue-200 pl-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comuna *
              </label>
              <select
                value={shipping.commune}
                onChange={(e) => selectLocalCommune(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecciona tu comuna</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.commune_name}>
                    {zone.commune_name} —{' '}
                    {zone.delivery_cost === 0
                      ? 'Gratis'
                      : formatCLP(zone.delivery_cost)}{' '}
                    ({zone.estimated_days})
                  </option>
                ))}
              </select>
            </div>
            {shipping.commune && (
              <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Envío a {shipping.commune}:</strong>{' '}
                  {shipping.cost === 0 ? 'Gratis' : formatCLP(shipping.cost)}
                  {shipping.estimatedDays && ` — ${shipping.estimatedDays}`}
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección de entrega *
              </label>
              <input
                type="text"
                value={shipping.address}
                onChange={(e) =>
                  setShipping((s) => ({ ...s, address: e.target.value }))
                }
                placeholder="Calle, número, depto/casa"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        )}

        {/* Option 3: National Shipping (Starken) */}
        <button
          onClick={() => selectShippingMethod('starken')}
          className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
            shipping.method === 'starken'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div>
            <p className="font-semibold text-gray-900">
              Envío nacional (Starken)
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Despacho a todo Chile
            </p>
          </div>
        </button>

        {shipping.method === 'starken' && (
          <div className="ml-4 space-y-3 border-l-2 border-blue-200 pl-4">
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <p className="text-sm text-amber-800">
                El costo de envío será cotizado y confirmado por WhatsApp antes
                de procesar tu pedido.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección *
              </label>
              <input
                type="text"
                value={shipping.address}
                onChange={(e) =>
                  setShipping((s) => ({ ...s, address: e.target.value }))
                }
                placeholder="Calle, número, depto/casa"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comuna *
                </label>
                <input
                  type="text"
                  value={shipping.commune}
                  onChange={(e) =>
                    setShipping((s) => ({ ...s, commune: e.target.value }))
                  }
                  placeholder="Ej: Providencia"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad *
                </label>
                <input
                  type="text"
                  value={shipping.city}
                  onChange={(e) =>
                    setShipping((s) => ({ ...s, city: e.target.value }))
                  }
                  placeholder="Ej: Santiago"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Región *
              </label>
              <select
                value={shipping.region}
                onChange={(e) =>
                  setShipping((s) => ({ ...s, region: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecciona tu región</option>
                <option value="Arica y Parinacota">Arica y Parinacota</option>
                <option value="Tarapacá">Tarapacá</option>
                <option value="Antofagasta">Antofagasta</option>
                <option value="Atacama">Atacama</option>
                <option value="Coquimbo">Coquimbo</option>
                <option value="Valparaíso">Valparaíso</option>
                <option value="Metropolitana">Metropolitana</option>
                <option value="O'Higgins">O&apos;Higgins</option>
                <option value="Maule">Maule</option>
                <option value="Ñuble">Ñuble</option>
                <option value="Biobío">Biobío</option>
                <option value="Araucanía">Araucanía</option>
                <option value="Los Ríos">Los Ríos</option>
                <option value="Los Lagos">Los Lagos</option>
                <option value="Aysén">Aysén</option>
                <option value="Magallanes">Magallanes</option>
              </select>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========== Step 2: Order Summary ==========
  function renderStep2() {
    return (
      <div className="space-y-5">
        <h2 className="text-xl font-bold text-gray-900">Resumen del pedido</h2>

        {/* Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 p-3 bg-white rounded-lg border border-gray-100">
              <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg text-gray-300">📦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-1">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatCLP(item.price)} x {item.quantity}
                </p>
              </div>
              <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                {formatCLP(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="card p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal ({totalItems} productos)</span>
            <span className="font-medium">{formatCLP(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Envío</span>
            <span className="font-medium">
              {shipping.method === 'starken'
                ? 'Por cotizar'
                : shippingTotal === 0
                ? 'Gratis'
                : formatCLP(shippingTotal)}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-base font-bold text-gray-900">
              {shipping.method === 'starken'
                ? `${formatCLP(totalPrice)} + envío`
                : formatCLP(grandTotal)}
            </span>
          </div>
        </div>

        {/* Customer & Shipping Summary */}
        <div className="card p-4 space-y-2 text-sm">
          <p>
            <span className="text-gray-500">Cliente:</span>{' '}
            <strong>{customer.name}</strong> — {customer.phone}
          </p>
          <p>
            <span className="text-gray-500">Envío:</span>{' '}
            {shipping.method === 'pickup' && (
              <span>Retiro en tienda — Feria de Hijuelas</span>
            )}
            {shipping.method === 'local_delivery' && (
              <span>
                Despacho local a {shipping.commune}
                {shipping.address && ` — ${shipping.address}`}
              </span>
            )}
            {shipping.method === 'starken' && (
              <span>
                Envío nacional — {shipping.address}, {shipping.commune},{' '}
                {shipping.city}, {shipping.region}
              </span>
            )}
          </p>
        </div>

        {/* Payment Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Selecciona cómo pagar
          </h3>

          {/* MercadoPago - Disabled */}
          <button
            disabled
            className="w-full p-4 rounded-lg border-2 border-gray-200 bg-gray-50 cursor-not-allowed relative"
          >
            <div className="flex items-center justify-between opacity-50">
              <div className="flex items-center gap-3">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-sky-500"
                >
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                <span className="font-medium text-gray-700">
                  Pagar con MercadoPago
                </span>
              </div>
              <span className="text-xs bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full">
                Próximamente
              </span>
            </div>
          </button>

          {/* Transfer */}
          <button
            onClick={() => placeOrder('transfer')}
            disabled={loading}
            className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600"
              >
                <path d="M21 12V7H5a2 2 0 010-4h14v4" />
                <path d="M3 5v14a2 2 0 002 2h16v-5" />
                <path d="M18 12a2 2 0 000 4h4v-4z" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">
                  Pagar por transferencia bancaria
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cuenta RUT Banco Estado — Eduardo Varas — RUT 17.032.024-1
                  — Cta. 17032024 — evaras@firmavb.cl
                </p>
              </div>
            </div>
          </button>

          {/* WhatsApp */}
          <button
            onClick={() => placeOrder('whatsapp')}
            disabled={loading}
            className="w-full p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:border-green-400 transition-colors text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-green-600"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">
                  Confirmar pedido por WhatsApp
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Se abrirá WhatsApp con los detalles de tu pedido
                </p>
              </div>
            </div>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Procesando tu pedido...
          </div>
        )}
      </div>
    );
  }

  // ========== Step 3: Confirmation ==========
  function renderStep3() {
    if (!orderResult) return null;

    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Pedido registrado
          </h2>
          <p className="text-gray-500 mt-1">
            Tu pedido ha sido creado exitosamente
          </p>
        </div>

        <div className="card p-6 text-left space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Número de pedido</span>
            <span className="text-lg font-bold text-blue-600">
              {orderResult.order_number}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Estado</span>
            <span className="text-sm font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              Pendiente
            </span>
          </div>
        </div>

        {orderResult.shipping_method === 'starken' && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
            Te contactaremos por WhatsApp para confirmar el costo de envío antes
            de procesar tu pedido.
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
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

        <div className="flex flex-col gap-3">
          <Link
            href={`/pedido/${orderResult.order_number}`}
            className="btn-primary text-center"
          >
            Ver detalle del pedido
          </Link>
          <Link
            href="/catalogo"
            className="btn-secondary text-center"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Step indicator */}
      {step < 3 && (
        <div className="flex items-center gap-2 mb-8">
          {STEPS.slice(0, 3).map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i < step
                    ? 'bg-blue-600 text-white'
                    : i === step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < step ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  i <= step ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
              {i < 2 && (
                <div
                  className={`flex-1 h-0.5 ${
                    i < step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Steps */}
      {step === 0 && renderStep0()}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      {/* Navigation */}
      {step < 2 && (
        <div className="mt-6 flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={handleBack}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Volver
            </button>
          ) : (
            <Link
              href="/carro"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Volver al carro
            </Link>
          )}
          <button
            onClick={handleNext}
            className="btn-primary"
          >
            Continuar
          </button>
        </div>
      )}

      {step === 2 && !loading && (
        <div className="mt-6">
          <button
            onClick={handleBack}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Volver
          </button>
        </div>
      )}
    </div>
  );
}
