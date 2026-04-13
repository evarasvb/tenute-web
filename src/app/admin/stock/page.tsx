'use client';

import { useEffect, useState, useCallback } from 'react';
import { getWarehouseStock } from '@/lib/product-metadata';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost_price: number;
  stock: number;
  stock_ocoa?: number;
  stock_local21?: number;
  image_url: string;
  brand: string;
  active: boolean;
  metadata?: Record<string, unknown>;
}

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function AdminStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [editingStock, setEditingStock] = useState<Record<string, { ocoa: string; local21: string }>>({});

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: '1', limit: '500', sort_by: 'name', sort_dir: 'asc' });
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();
    setProducts(data.data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function getStockForProduct(p: Product) {
    return getWarehouseStock(p as unknown as Record<string, unknown>);
  }

  function startEditing(p: Product) {
    const ws = getStockForProduct(p);
    setEditingStock(prev => ({
      ...prev,
      [p.id]: { ocoa: ws.ocoa.toString(), local21: ws.local21.toString() },
    }));
  }

  function cancelEditing(id: string) {
    setEditingStock(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function saveStock(p: Product) {
    const edit = editingStock[p.id];
    if (!edit) return;

    setSaving(p.id);
    const ocoa = parseInt(edit.ocoa) || 0;
    const local21 = parseInt(edit.local21) || 0;

    const metadata = {
      ...(p.metadata || {}),
      warehouse_stock: { ocoa, local21 },
    };

    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock: ocoa + local21,
          stock_ocoa: ocoa,
          stock_local21: local21,
          metadata,
        }),
      });

      if (res.ok) {
        setProducts(prev => prev.map(pp =>
          pp.id === p.id ? { ...pp, stock: ocoa + local21, stock_ocoa: ocoa, stock_local21: local21, metadata } : pp
        ));
        cancelEditing(p.id);
      }
    } catch { /* ignore */ }
    setSaving(null);
  }

  // Summary calculations
  const summaryProducts = products.filter(p => p.active);
  let totalOcoa = 0, totalLocal21 = 0, valueOcoa = 0, valueLocal21 = 0;
  summaryProducts.forEach(p => {
    const ws = getStockForProduct(p);
    totalOcoa += ws.ocoa;
    totalLocal21 += ws.local21;
    const cost = p.cost_price || p.price;
    valueOcoa += ws.ocoa * cost;
    valueLocal21 += ws.local21 * cost;
  });

  // Filter products
  let filteredProducts = products;
  if (warehouseFilter === 'ocoa') {
    filteredProducts = products.filter(p => getStockForProduct(p).ocoa > 0);
  } else if (warehouseFilter === 'local21') {
    filteredProducts = products.filter(p => getStockForProduct(p).local21 > 0);
  } else if (warehouseFilter === 'empty') {
    filteredProducts = products.filter(p => p.stock <= 0);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Stock por Bodega</h2>
        <p className="text-sm text-gray-500">Vista general del inventario en cada bodega</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bodega Ocoa</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalOcoa.toLocaleString('es-CL')}</p>
          <p className="text-xs text-gray-500 mt-1">unidades</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bodega Local 21</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalLocal21.toLocaleString('es-CL')}</p>
          <p className="text-xs text-gray-500 mt-1">unidades</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Valor Ocoa</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCLP(valueOcoa)}</p>
          <p className="text-xs text-gray-500 mt-1">a costo</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Valor Local 21</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCLP(valueLocal21)}</p>
          <p className="text-xs text-gray-500 mt-1">a costo</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">Todas las bodegas</option>
            <option value="ocoa">Con stock en Ocoa</option>
            <option value="local21">Con stock en Local 21</option>
            <option value="empty">Sin stock</option>
          </select>
          <p className="text-sm text-gray-500 flex items-center">
            {filteredProducts.length} productos
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Producto</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">SKU</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Ocoa</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Local 21</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Total</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 w-32">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-12 ml-auto" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-12 ml-auto" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-12 ml-auto" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const ws = getStockForProduct(p);
                  const isEditing = !!editingStock[p.id];

                  return (
                    <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!p.active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-100 flex-shrink-0" />
                          )}
                          <span className="font-medium text-gray-900 truncate max-w-xs">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-500 font-mono text-xs hidden sm:table-cell">{p.sku || '-'}</td>
                      <td className="px-4 py-2 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingStock[p.id].ocoa}
                            onChange={(e) => setEditingStock(prev => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], ocoa: e.target.value },
                            }))}
                            min="0"
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className={ws.ocoa === 0 ? 'text-gray-400' : 'text-gray-700'}>{ws.ocoa}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingStock[p.id].local21}
                            onChange={(e) => setEditingStock(prev => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], local21: e.target.value },
                            }))}
                            min="0"
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className={ws.local21 === 0 ? 'text-gray-400' : 'text-gray-700'}>{ws.local21}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={`font-bold ${p.stock <= 0 ? 'text-red-600' : p.stock < 10 ? 'text-orange-600' : 'text-gray-900'}`}>
                          {isEditing
                            ? (parseInt(editingStock[p.id].ocoa) || 0) + (parseInt(editingStock[p.id].local21) || 0)
                            : p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {isEditing ? (
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => saveStock(p)}
                              disabled={saving === p.id}
                              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {saving === p.id ? '...' : 'Guardar'}
                            </button>
                            <button
                              onClick={() => cancelEditing(p.id)}
                              className="px-2 py-1 border border-gray-300 text-xs rounded hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(p)}
                            className="px-2 py-1 text-blue-600 text-xs hover:bg-blue-50 rounded transition-colors"
                          >
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
