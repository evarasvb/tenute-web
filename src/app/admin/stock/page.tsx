'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost_price: number | null;
  stock: number;
  stock_ocoa: number;
  stock_local: number;
  image_url: string | null;
  brand: string | null;
  active: boolean;
}

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<'all' | 'ocoa' | 'local'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOcoa, setEditOcoa] = useState(0);
  const [editLocal, setEditLocal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/admin/products?limit=9999&page=1');
      const data = await resp.json();
      setProducts(data.products || []);
    } catch {
      setErrorMsg('Error cargando productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Summary calculations using cost_price
  const totalOcoa = products.reduce((s, p) => s + (p.stock_ocoa || 0), 0);
  const totalLocal = products.reduce((s, p) => s + (p.stock_local || 0), 0);
  const valueOcoa = products.reduce((s, p) => s + (p.cost_price || 0) * (p.stock_ocoa || 0), 0);
  const valueLocal = products.reduce((s, p) => s + (p.cost_price || 0) * (p.stock_local || 0), 0);

  // Filter products
  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchWarehouse =
      warehouseFilter === 'all' ||
      (warehouseFilter === 'ocoa' && (p.stock_ocoa || 0) > 0) ||
      (warehouseFilter === 'local' && (p.stock_local || 0) > 0);
    return matchSearch && matchWarehouse;
  });

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditOcoa(p.stock_ocoa || 0);
    setEditLocal(p.stock_local || 0);
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveStock = async (productId: string) => {
    setSaving(true);
    try {
      const resp = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_ocoa: editOcoa, stock_local: editLocal, stock: editOcoa + editLocal }),
      });
      if (!resp.ok) throw new Error('Error guardando');
      setProducts(prev => prev.map(p =>
        p.id === productId
          ? { ...p, stock_ocoa: editOcoa, stock_local: editLocal, stock: editOcoa + editLocal }
          : p
      ));
      setEditingId(null);
    } catch {
      setErrorMsg('Error al guardar el stock');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock por Bodega</h1>
        <p className="text-gray-500 text-sm mt-1">Vista general del inventario en cada bodega</p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <span>â ï¸</span> {errorMsg}
          <button onClick={() => setErrorMsg('')} className="ml-auto text-red-400 hover:text-red-600">â</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bodega Ocoa</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalOcoa.toLocaleString('es-CL')}</p>
          <p className="text-xs text-gray-500 mt-1">unidades</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bodega Local 21</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalLocal.toLocaleString('es-CL')}</p>
          <p className="text-xs text-gray-500 mt-1">unidades</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-5 bg-blue-50">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Valor Ocoa</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{formatCLP(valueOcoa)}</p>
          <p className="text-xs text-blue-500 mt-1">a costo de compra</p>
        </div>
        <div className="bg-white rounded-xl border border-purple-200 p-5 bg-purple-50">
          <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Valor Local 21</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{formatCLP(valueLocal)}</p>
          <p className="text-xs text-purple-500 mt-1">a costo de compra</p>
        </div>
      </div>

      {/* Total combined */}
      <div className="bg-gray-900 text-white rounded-xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Inventario Total</p>
          <p className="text-2xl font-bold mt-0.5">{formatCLP(valueOcoa + valueLocal)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total unidades</p>
          <p className="text-2xl font-bold mt-0.5">{(totalOcoa + totalLocal).toLocaleString('es-CL')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={warehouseFilter}
          onChange={e => setWarehouseFilter(e.target.value as 'all' | 'ocoa' | 'local')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">Todas las bodegas</option>
          <option value="ocoa">Solo Bodega Ocoa</option>
          <option value="local">Solo Local 21</option>
        </select>
        <span className="self-center text-sm text-gray-500 whitespace-nowrap">{filtered.length} productos</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando inventario...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Producto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">SKU</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Costo</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-blue-600">Ocoa</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-purple-600">Local 21</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Val. Ocoa</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Val. Local 21</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.image_url && (
                        <img src={p.image_url} alt="" className="w-8 h-8 object-cover rounded" />
                      )}
                      <div>
                        <p className="font-medium text-gray-800 truncate max-w-[200px]">{p.name}</p>
                        {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell font-mono text-xs">{p.sku || 'â'}</td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden lg:table-cell">
                    {p.cost_price ? formatCLP(p.cost_price) : <span className="text-gray-300">â</span>}
                  </td>

                  {editingId === p.id ? (
                    <>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={editOcoa}
                          onChange={e => setEditOcoa(Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-blue-300 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={editLocal}
                          onChange={e => setEditLocal(Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-purple-300 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{editOcoa + editLocal}</td>
                      <td className="px-4 py-3 text-right hidden xl:table-cell text-blue-600 text-xs">
                        {p.cost_price ? formatCLP(p.cost_price * editOcoa) : 'â'}
                      </td>
                      <td className="px-4 py-3 text-right hidden xl:table-cell text-purple-600 text-xs">
                        {p.cost_price ? formatCLP(p.cost_price * editLocal) : 'â'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => saveStock(p.id)}
                            disabled={saving}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                          >
                            {saving ? '...' : 'Guardar'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${(p.stock_ocoa || 0) > 0 ? 'text-blue-700' : 'text-gray-300'}`}>
                          {p.stock_ocoa || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${(p.stock_local || 0) > 0 ? 'text-purple-700' : 'text-gray-300'}`}>
                          {p.stock_local || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${(p.stock || 0) > 0 ? 'text-gray-800' : 'text-red-400'}`}>
                          {(p.stock_ocoa || 0) + (p.stock_local || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden xl:table-cell text-blue-600 text-xs">
                        {p.cost_price && (p.stock_ocoa || 0) > 0 ? formatCLP(p.cost_price * (p.stock_ocoa || 0)) : <span className="text-gray-300">â</span>}
                      </td>
                      <td className="px-4 py-3 text-right hidden xl:table-cell text-purple-600 text-xs">
                        {p.cost_price && (p.stock_local || 0) > 0 ? formatCLP(p.cost_price * (p.stock_local || 0)) : <span className="text-gray-300">â</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => startEdit(p)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Editar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-400 text-center">
        ð¡ El valor de inventario se calcula usando el <strong>costo de compra</strong> de cada producto.
        Para actualizar costos, ve a{' '}
        <Link href="/admin/products" className="text-blue-500 hover:underline">GestiÃ³n de Productos</Link>.
      </div>
    </div>
  );
}
