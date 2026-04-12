'use client';

import { useState, useEffect } from 'react';
import type { ShippingZone } from '@/types';

function formatCLP(n: number) {
  return '$' + n.toLocaleString('es-CL');
}

export default function AdminShippingPage() {
  const [localZones, setLocalZones] = useState<ShippingZone[]>([]);
  const [starkenRates, setStarkenRates] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/shipping')
      .then((res) => res.json())
      .then((data) => {
        if (data.zones) {
          setLocalZones(data.zones.filter((z: ShippingZone) => z.zone_type === 'local'));
          setStarkenRates(data.zones.filter((z: ShippingZone) => z.zone_type === 'starken'));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function updateRate(id: string, field: string, value: number | string | boolean) {
    setSaving(id);
    setMessage('');
    try {
      const res = await fetch('/api/admin/shipping', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      });
      const data = await res.json();
      if (data.zone) {
        // Update in local state
        const updateList = (list: ShippingZone[]) =>
          list.map((z) => (z.id === id ? { ...z, ...data.zone } : z));
        setLocalZones(updateList);
        setStarkenRates(updateList);
        setMessage('Guardado');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch {
      setMessage('Error al guardar');
    }
    setSaving(null);
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tarifas de envío</h1>

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

      {/* Starken National Rates */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Envío nacional (Starken)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Tarifas referenciales por región para paquetes hasta 5kg
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Región</th>
                <th className="px-5 py-3 font-medium">Costo (CLP)</th>
                <th className="px-5 py-3 font-medium">Días estimados</th>
                <th className="px-5 py-3 font-medium w-20">Activo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {starkenRates.map((rate) => (
                <tr key={rate.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">
                    {rate.commune_name}
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="number"
                      defaultValue={rate.delivery_cost}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        if (val !== rate.delivery_cost) {
                          updateRate(rate.id, 'delivery_cost', val);
                        }
                      }}
                      className="w-28 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="text"
                      defaultValue={rate.estimated_days}
                      onBlur={(e) => {
                        if (e.target.value !== rate.estimated_days) {
                          updateRate(rate.id, 'estimated_days', e.target.value);
                        }
                      }}
                      className="w-40 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => updateRate(rate.id, 'is_active', !rate.is_active)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${
                        rate.is_active ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          rate.is_active ? 'left-5' : 'left-1'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Local Delivery Zones */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Despacho local
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Zonas de entrega local. Gratis sobre $50.000 (excepto comunas con costo $0 que son siempre gratis).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Comuna</th>
                <th className="px-5 py-3 font-medium">Costo (CLP)</th>
                <th className="px-5 py-3 font-medium">Días estimados</th>
                <th className="px-5 py-3 font-medium w-20">Activo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {localZones.map((zone) => (
                <tr key={zone.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">
                    {zone.commune_name}
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="number"
                      defaultValue={zone.delivery_cost}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        if (val !== zone.delivery_cost) {
                          updateRate(zone.id, 'delivery_cost', val);
                        }
                      }}
                      className="w-28 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="text"
                      defaultValue={zone.estimated_days}
                      onBlur={(e) => {
                        if (e.target.value !== zone.estimated_days) {
                          updateRate(zone.id, 'estimated_days', e.target.value);
                        }
                      }}
                      className="w-40 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => updateRate(zone.id, 'is_active', !zone.is_active)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${
                        zone.is_active ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          zone.is_active ? 'left-5' : 'left-1'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
