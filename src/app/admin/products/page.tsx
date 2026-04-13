'use client';

import Link from 'next/link';
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
  brand: string;
  image_url: string;
  category_id: string;
  active: boolean;
  metadata?: Record<string, unknown>;
  categories?: { name: string; slug: string };
}

interface Category {
  id: string;
  name: string;
}

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

function getMargin(price: number, costPrice: number): number | null {
  if (!costPrice || costPrice <= 0 || !price || price <= 0) return null;
  return ((price - costPrice) / price) * 100;
}

function MarginBadge({ price, costPrice }: { price: number; costPrice: number }) {
  const margin = getMargin(price, costPrice);
  if (margin === null) return <span className="text-gray-400 text-xs">—</span>;
  const rounded = margin.toFixed(1);
  let colorClass = 'text-green-700 bg-green-50';
  if (margin < 10) colorClass = 'text-red-700 bg-red-50';
  else if (margin < 25) colorClass = 'text-orange-700 bg-orange-50';
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {rounded}%
    </span>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [hasImage, setHasImage] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [minCost, setMinCost] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [minMargin, setMinMargin] = useState('');
  const [maxMargin, setMaxMargin] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const limit = 50;

  useEffect(() => {
    fetch('/api/admin/categories').then(r => r.json()).then(setCategories);
    fetch('/api/admin/brands').then(r => r.json()).then(setBrands);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort_by: sortBy,
      sort_dir: sortDir,
    });
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (brand) params.set('brand', brand);
    if (hasImage) params.set('has_image', hasImage);
    if (activeFilter) params.set('active', activeFilter);
    if (minCost) params.set('min_cost', minCost);
    if (maxCost) params.set('max_cost', maxCost);

    const res = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();
    let filtered = data.data || [];

    // Client-side margin filtering (margin is computed, not a DB column)
    if (minMargin || maxMargin) {
      const minM = minMargin ? parseFloat(minMargin) : -Infinity;
      const maxM = maxMargin ? parseFloat(maxMargin) : Infinity;
      filtered = filtered.filter((p: Product) => {
        const margin = getMargin(p.price, p.cost_price);
        if (margin === null) return false;
        return margin >= minM && margin <= maxM;
      });
    }

    setProducts(filtered);
    setTotal(minMargin || maxMargin ? filtered.length : (data.count || 0));
    setLoading(false);
  }, [page, search, category, brand, hasImage, activeFilter, minCost, maxCost, minMargin, maxMargin, sortBy, sortDir]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handleSort(col: string) {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
    setPage(1);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteId(null);
      fetchProducts();
    }
  }

  async function handleToggleActive(product: Product) {
    setTogglingId(product.id);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !product.active }),
      });
      if (res.ok) {
        setProducts(prev => prev.map(p =>
          p.id === product.id ? { ...p, active: !p.active } : p
        ));
      }
    } catch { /* ignore */ }
    setTogglingId(null);
  }

  function clearFilters() {
    setSearch(''); setCategory(''); setBrand(''); setHasImage('');
    setActiveFilter(''); setMinCost(''); setMaxCost('');
    setMinMargin(''); setMaxMargin(''); setPage(1);
  }

  const totalPages = Math.ceil(total / limit);

  function SortIcon({ col }: { col: string }) {
    if (sortBy !== col) return <span className="text-gray-300 ml-1">&#8597;</span>;
    return <span className="text-blue-600 ml-1">{sortDir === 'asc' ? '&#8593;' : '&#8595;'}</span>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
          <p className="text-sm text-gray-500">{total} productos en total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Agregar producto
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={brand}
              onChange={(e) => { setBrand(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todas las marcas</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={hasImage}
              onChange={(e) => { setHasImage(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todas (imagen)</option>
              <option value="true">Con imagen</option>
              <option value="false">Sin imagen</option>
            </select>
          </div>
          <div>
            <select
              value={activeFilter}
              onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todos (estado)</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {showAdvanced ? 'Menos' : 'Más filtros'}
            </button>
            <button
              onClick={clearFilters}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              title="Limpiar filtros"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Costo mín.</label>
              <input
                type="number"
                value={minCost}
                onChange={(e) => { setMinCost(e.target.value); setPage(1); }}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Costo máx.</label>
              <input
                type="number"
                value={maxCost}
                onChange={(e) => { setMaxCost(e.target.value); setPage(1); }}
                placeholder="999999"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Margen mín. %</label>
              <input
                type="number"
                value={minMargin}
                onChange={(e) => { setMinMargin(e.target.value); setPage(1); }}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Margen máx. %</label>
              <input
                type="number"
                value={maxMargin}
                onChange={(e) => { setMaxMargin(e.target.value); setPage(1); }}
                placeholder="999"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-12">Img</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 cursor-pointer select-none" onClick={() => handleSort('name')}>
                  Nombre <SortIcon col="name" />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 hidden lg:table-cell cursor-pointer select-none" onClick={() => handleSort('brand')}>
                  Marca <SortIcon col="brand" />
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 cursor-pointer select-none" onClick={() => handleSort('price')}>
                  Precio <SortIcon col="price" />
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 hidden md:table-cell">Margen</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 hidden lg:table-cell">Ocoa</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 hidden lg:table-cell">Local 21</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 cursor-pointer select-none" onClick={() => handleSort('stock')}>
                  Total <SortIcon col="stock" />
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 w-16">Activo</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    <td className="px-4 py-3"><div className="w-8 h-8 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16 ml-auto" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-gray-200 rounded w-12 ml-auto" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 bg-gray-200 rounded w-8 ml-auto" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 bg-gray-200 rounded w-8 ml-auto" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-12 ml-auto" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-8 mx-auto" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-400">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const ws = getWarehouseStock(p as unknown as Record<string, unknown>);
                  return (
                    <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!p.active ? 'opacity-50 bg-gray-50' : ''}`}>
                      <td className="px-4 py-2">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">--</div>
                        )}
                      </td>
                      <td className="px-4 py-2 font-medium text-gray-900 max-w-xs truncate">
                        {p.name}
                        {!p.active && <span className="ml-2 text-xs text-gray-400">(inactivo)</span>}
                      </td>
                      <td className="px-4 py-2 text-gray-500 hidden md:table-cell font-mono text-xs">{p.sku || '-'}</td>
                      <td className="px-4 py-2 text-gray-500 hidden lg:table-cell">{p.brand || '-'}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatCLP(p.price)}</td>
                      <td className="px-4 py-2 text-right hidden md:table-cell">
                        <MarginBadge price={p.price} costPrice={p.cost_price} />
                      </td>
                      <td className="px-4 py-2 text-right hidden lg:table-cell text-gray-600">{ws.ocoa}</td>
                      <td className="px-4 py-2 text-right hidden lg:table-cell text-gray-600">{ws.local21}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={p.stock <= 0 ? 'text-red-600 font-semibold' : p.stock < 10 ? 'text-orange-600' : 'text-gray-700'}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleToggleActive(p)}
                          disabled={togglingId === p.id}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            p.active ? 'bg-green-500' : 'bg-gray-300'
                          } ${togglingId === p.id ? 'opacity-50' : ''}`}
                          title={p.active ? 'Desactivar' : 'Activar'}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            p.active ? 'translate-x-[18px]' : 'translate-x-[3px]'
                          }`} />
                        </button>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => setDeleteId(p.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Mostrando {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} de {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1.5 text-sm border rounded-lg ${
                      page === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar producto</h3>
            <p className="text-sm text-gray-500 mb-4">
              ¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
