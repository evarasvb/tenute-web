'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Stats {
  totalProducts: number; withImages: number; withoutImages: number;
  totalStockValue: number; totalCostValue: number;
  revenue30d: number; webOrdersRevenue30d: number; webOrdersCount30d: number;
  manualSalesRevenue30d: number; manualSalesCount30d: number;
  grossProfit30d: number; grossMargin30d: number;
  purchasesTotal30d: number; purchasesCount30d: number;
  avgCatalogMargin: number | null;
}

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

function StatCard({ label, value, sub, color = 'gray', icon }: { label: string; value: string; sub?: string; color?: 'gray'|'blue'|'green'|'purple'|'orange'|'red'; icon: string }) {
  const colorMap = { gray: 'bg-gray-600', blue: 'bg-blue-600', green: 'bg-green-600', purple: 'bg-purple-600', orange: 'bg-orange-500', red: 'bg-red-500' };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${colorMap[color]} flex items-center justify-center`}>
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const Skeleton = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-3" /><div className="h-8 bg-gray-200 rounded w-32" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Resumen general - ultimos 30 dias</p>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ventas ultimos 30 dias</h3>
        {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} />)}</div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Ingresos totales" value={formatCLP(stats?.revenue30d||0)} sub={`Web: ${formatCLP(stats?.webOrdersRevenue30d||0)} · Manual: ${formatCLP(stats?.manualSalesRevenue30d||0)}`} color="green" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <StatCard label="Utilidad bruta" value={formatCLP(stats?.grossProfit30d||0)} sub={stats?.grossMargin30d!=null?`Margen: ${stats.grossMargin30d}%`:'Sin datos de costo aun'} color={stats&&stats.grossProfit30d>=0?'blue':'red'} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            <StatCard label="Pedidos web" value={String(stats?.webOrdersCount30d||0)} sub="Pedidos en la tienda online" color="purple" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            <StatCard label="Ventas manuales" value={String(stats?.manualSalesCount30d||0)} sub="WhatsApp, telefono, caja" color="orange" icon="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </div>
        )}
      </div>
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Inventario</h3>
        {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} />)}</div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total productos" value={(stats?.totalProducts||0).toLocaleString('es-CL')} color="gray" icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            <StatCard label="Valor a costo" value={formatCLP(stats?.totalCostValue||0)} sub="Valorizado a precio de compra" color="blue" icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            <StatCard label="Con imagen" value={(stats?.withImages||0).toLocaleString('es-CL')} color="green" icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            <StatCard label="Margen promedio" value={stats?.avgCatalogMargin!=null?`${stats.avgCatalogMargin}%`:'—'} sub="Promedio productos con costo" color="purple" icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </div>
        )}
      </div>
      {stats && (stats.purchasesCount30d > 0) && (
        <div className="bg-white rounded-xl border border-orange-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Compras a proveedores (30 dias)</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">{formatCLP(stats.purchasesTotal30d)}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.purchasesCount30d} ordenes de compra</p>
          </div>
          <Link href="/admin/compras" className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors">Ver compras</Link>
        </div>
      )}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Acciones rapidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/ventas" className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-300 hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Registrar venta</h3>
            </div>
            <p className="text-sm text-gray-500">WhatsApp, telefono o caja</p>
          </Link>
          <Link href="/admin/compras" className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Registrar compra</h3>
            </div>
            <p className="text-sm text-gray-500">Ingresa mercaderia y actualiza stock</p>
          </Link>
          <Link href="/admin/products" className="bg-white rounded-xl border border-gray-200 p-6 hover:border-purple-300 hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">Gestionar productos</h3>
            </div>
            <p className="text-sm text-gray-500">Editar catalogo, precios e imagenes</p>
          </Link>
          <Link href="/admin/rifas" className="bg-white rounded-xl border border-gray-200 p-6 hover:border-pink-300 hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-pink-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.868v4.264a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25A2.25 2.25 0 015.25 6h13.5A2.25 2.25 0 0121 8.25v7.5A2.25 2.25 0 0118.75 18H5.25A2.25 2.25 0 013 15.75v-7.5z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">Rifas y redes</h3>
            </div>
            <p className="text-sm text-gray-500">Configura rifas online para Instagram/TikTok</p>
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/orders" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group">
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Pedidos online</h3>
          <p className="text-sm text-gray-500 mt-1">Ver y gestionar pedidos de la tienda</p>
        </Link>
        <Link href="/admin/stock" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group">
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Inventario valorizado</h3>
          <p className="text-sm text-gray-500 mt-1">Stock por bodega a costo de compra</p>
        </Link>
      </div>
    </div>
  );
}
