'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Stats {
  totalProducts: number;
  withImages: number;
  withoutImages: number;
  totalStockValue: number;
}

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: 'Total productos', value: stats.totalProducts.toLocaleString('es-CL'), color: 'bg-blue-600', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
        { label: 'Con imagen', value: stats.withImages.toLocaleString('es-CL'), color: 'bg-green-600', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { label: 'Sin imagen', value: stats.withoutImages.toLocaleString('es-CL'), color: 'bg-orange-500', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z' },
        { label: 'Valor en stock', value: formatCLP(stats.totalStockValue), color: 'bg-purple-600', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Resumen general de la tienda</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                  </svg>
                </div>
                <span className="text-sm text-gray-500">{card.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/products"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            Gestionar productos
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Agregar, editar o eliminar productos del catálogo
          </p>
        </Link>
        <Link
          href="/admin/categories"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            Gestionar categorías
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Editar categorías y ver cantidad de productos
          </p>
        </Link>
      </div>
    </div>
  );
}
