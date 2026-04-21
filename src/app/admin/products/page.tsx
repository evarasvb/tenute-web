'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';

interface Product {
  id: string;
  name: string;
  sku: string;
    barcode: string | null;
  price: number;
  cost_price: number;
  stock: number;
  stock_ocoa: number;
  stock_local21: number;
  brand: string;
  image_url: string;
  category_id: string;
  active: boolean;
  categories?: { name: string; slug: string };
}

interface Category { id: string; name: string; }

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}
function calcMargin(price: number, cost: number) {
  if (!price || price === 0) return null;
  return ((price - (cost || 0)) / price) * 100;
}
function marginColor(pct: number | null) {
  if (pct === null) return 'text-gray-400';
  if (pct < 0) return 'text-red-600 font-bold';
  if (pct < 20) return 'text-orange-500';
  if (pct < 40) return 'text-yellow-600';
  return 'text-green-600 font-semibold';
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
  const [costMin, setCostMin] = useState('');
  const [costMax, setCostMax] = useState('');
  const [marginMin, setMarginMin] = useState('');
  const [marginMax, setMarginMax] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ inserted: number; errors: string[] } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const limit = 50;
  const hasCostMarginFilter = !!(costMin || costMax || marginMin || marginMax);

  useEffect(() => {
    fetch('/api/admin/categories').then(r => r.json()).then(setCategories);
    fetch('/api/admin/brands').then(r => r.json()).then(setBrands);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort_by: sortBy, sort_dir: sortDir });
    if (hasCostMarginFilter) { params.set('page', '1'); params.set('limit', '9999'); }
    else { params.set('page', page.toString()); params.set('limit', limit.toString()); }
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (brand) params.set('brand', brand);
    if (hasImage) params.set('has_image', hasImage);
    if (activeFilter) params.set('active', activeFilter);
    const res = await fetch('/api/admin/products?' + params);
    const data = await res.json();
    let items: Product[] = data.products || [];
    if (hasCostMarginFilter) {
      if (costMin) items = items.filter(p => (p.cost_price || 0) >= Number(costMin));
      if (costMax) items = items.filter(p => (p.cost_price || 0) <= Number(costMax));
      if (marginMin) items = items.filter(p => { const m = calcMargin(p.price, p.cost_price); return m !== null && m >= Number(marginMin); });
      if (marginMax) items = items.filter(p => { const m = calcMargin(p.price, p.cost_price); return m !== null && m <= Number(marginMax); });
      setTotal(items.length);
      const from = (page - 1) * limit;
      setProducts(items.slice(from, from + limit));
    } else {
      setProducts(items);
      setTotal(data.count || 0);
    }
    setLoading(false);
  }, [page, search, category, brand, hasImage, activeFilter, costMin, costMax, marginMin, marginMax, sortBy, sortDir, hasCostMarginFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  function handleSort(col: string) {
    if (sortBy === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
    setPage(1);
  }

  async function handleDelete(id: string) {
    const res = await fetch('/api/admin/products/' + id, { method: 'DELETE' });
    if (res.ok) { setDeleteId(null); fetchProducts(); }
  }

  async function handleToggleActive(p: Product) {
    setTogglingId(p.id);
    setToggleError(null);
    try {
      const res = await fetch('/api/admin/products/' + p.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !p.active }),
      });
      if (res.ok) {
        setProducts(prev => prev.map(item => item.id === p.id ? { ...item, active: !item.active } : item));
      } else {
        const err = await res.json().catch(() => ({}));
        setToggleError('Error al cambiar estado: ' + (err.error || res.status));
        setTimeout(() => setToggleError(null), 4000);
      }
    } catch {
      setToggleError('Error de conexiÃ³n al cambiar estado');
      setTimeout(() => setToggleError(null), 4000);
    }
    setTogglingId(null);
  }

  async function handleBulkActive(active: boolean) {
    if (!confirm(active ? 'Â¿Activar TODOS los productos visibles?' : 'Â¿Desactivar TODOS los productos visibles?')) return;
    setBulkLoading(true);
    setToggleError(null);
    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => ({ ...p, active })));
        await fetchProducts();
      } else {
        const err = await res.json().catch(() => ({}));
        setToggleError('Error: ' + (err.error || res.status));
        setTimeout(() => setToggleError(null), 4000);
      }
    } catch {
      setToggleError('Error de conexiÃ³n');
      setTimeout(() => setToggleError(null), 4000);
    }
    setBulkLoading(false);
  }

  async function handleExport() {
    setExporting(true);
    const params = new URLSearchParams({ limit: '9999', sort_by: sortBy, sort_dir: sortDir });
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (brand) params.set('brand', brand);
    if (hasImage) params.set('has_image', hasImage);
    if (activeFilter) params.set('active', activeFilter);
    const res = await fetch('/api/admin/products/export?' + params);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tenute-productos-' + new Date().toISOString().slice(0, 10) + '.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true); setImportResult(null);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/products/import', { method: 'POST', body: formData });
    const data = await res.json();
    setImportResult(data); setImporting(false);
    if (data.inserted > 0) fetchProducts();
    if (importFileRef.current) importFileRef.current.value = '';
  }

  function clearAll() {
    setSearch(''); setCategory(''); setBrand(''); setHasImage('');
    setActiveFilter(''); setCostMin(''); setCostMax(''); setMarginMin(''); setMarginMax(''); setPage(1);
  }

  const totalPages = Math.ceil(total / limit);
  function SortIcon({ col }: { col: string }) {
    if (sortBy !== col) return <span className="text-gray-300 ml-1">â</span>;
    return <span className="text-blue-600 ml-1">{sortDir === 'asc' ? 'â' : 'â'}</span>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
          <p className="text-sm text-gray-500">{total} productos en total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => handleBulkActive(true)} disabled={bulkLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-green-500 text-green-700 text-sm font-medium rounded-lg hover:bg-green-50 disabled:opacity-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            {bulkLoading ? '...' : 'Activar todo'}
          </button>
          <button onClick={() => handleBulkActive(false)} disabled={bulkLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-400 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            {bulkLoading ? '...' : 'Desactivar todo'}
          </button>
          <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
  Buscar nombre, SKU o codigo de barras...          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>
            Importar
          </button>
          <button onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-2 px-4 py-2 border border-green-600 text-green-700 text-sm font-medium rounded-lg hover:bg-green-50 disabled:opacity-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            {exporting ? 'Exportando...' : 'Excel'}
          </button>
          <Link href="/admin/products/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Agregar
          </Link>
        </div>
      </div>

      {toggleError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {toggleError}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <input type="text" placeholder="Buscar nombre, SKU o codigo de barras..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Todas las categorÃ­as</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={brand} onChange={e => { setBrand(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Todas las marcas</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Todos (estado)</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
          <select value={hasImage} onChange={e => { setHasImage(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Todas (imagen)</option>
            <option value="true">Con imagen</option>
            <option value="false">Sin imagen</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Filtrar por:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 whitespace-nowrap">Costo $</span>
            <input type="number" placeholder="MÃ­n" value={costMin} onChange={e => { setCostMin(e.target.value); setPage(1); }}
              className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-gray-300">â</span>
            <input type="number" placeholder="MÃ¡x" value={costMax} onChange={e => { setCostMax(e.target.value); setPage(1); }}
              className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 whitespace-nowrap">Margen %</span>
            <input type="number" placeholder="MÃ­n" value={marginMin} onChange={e => { setMarginMin(e.target.value); setPage(1); }}
              className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-gray-300">â</span>
            <input type="number" placeholder="MÃ¡x" value={marginMax} onChange={e => { setMarginMax(e.target.value); setPage(1); }}
              className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {(search || category || brand || hasImage || activeFilter || costMin || costMax || marginMin || marginMax) && (
            <button onClick={clearAll} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">â Limpiar todo</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-3 text-left font-medium text-gray-500 w-10">Img</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500 cursor-pointer select-none" onClick={() => handleSort('name')}>Nombre <SortIcon col="name" /></th>
                <th className="px-3 py-3 text-left font-medium text-gray-500 hidden md:table-cell">SKU</th>
                <th className="px-3 py-3 text-right font-medium text-gray-500 cursor-pointer select-none" onClick={() => handleSort('price')}>Precio <SortIcon col="price" /></th>
                <th className="px-3 py-3 text-right font-medium text-gray-500 hidden lg:table-cell cursor-pointer" onClick={() => handleSort('cost_price')}>Costo <SortIcon col="cost_price" /></th>
                <th className="px-3 py-3 text-right font-medium text-gray-500 hidden lg:table-cell">Margen</th>
                <th className="px-3 py-3 text-center font-medium text-blue-500 hidden xl:table-cell">Ocoa</th>
                <th className="px-3 py-3 text-center font-medium text-purple-500 hidden xl:table-cell">Local 21</th>
                <th className="px-3 py-3 text-right font-medium text-gray-500 cursor-pointer select-none" onClick={() => handleSort('stock')}>Total <SortIcon col="stock" /></th>
                <th className="px-3 py-3 text-center font-medium text-gray-500 w-20">Estado</th>
                <th className="px-3 py-3 text-right font-medium text-gray-500 w-20">AcciÃ³n</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    {Array.from({ length: 11 }).map((__, j) => (
                      <td key={j} className="px-3 py-3"><div className="h-4 bg-gray-200 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-gray-400">No se encontraron productos</td></tr>
              ) : (
                products.map(p => {
                  const margin = calcMargin(p.price, p.cost_price);
                  const totalStock = (p.stock_ocoa || 0) + (p.stock_local || 0) || p.stock || 0;
                  return (
                    <tr key={p.id} className={'border-b border-gray-100 hover:bg-gray-50 transition-colors' + (!p.active ? ' opacity-50' : '')}>
                      <td className="px-3 py-2">
                        {p.image_url ? <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">--</div>}
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900 max-w-[180px] truncate">{p.name}</td>
                      <td className="px-3 py-2 text-gray-500 hidden md:table-cell font-mono text-xs">{p.sku || '-'}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCLP(p.price)}</td>
                      <td className="px-3 py-2 text-right text-gray-500 hidden lg:table-cell">{p.cost_price ? formatCLP(p.cost_price) : <span className="text-gray-300">â</span>}</td>
                      <td className={'px-3 py-2 text-right hidden lg:table-cell ' + marginColor(margin)}>
                        {margin !== null ? margin.toFixed(1) + '%' : <span className="text-gray-300">â</span>}
                      </td>
                      <td className="px-3 py-2 text-center hidden xl:table-cell">
                        <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{p.stock_ocoa || 0}</span>
                      </td>
                      <td className="px-3 py-2 text-center hidden xl:table-cell">
                        <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">{p.stock_local || 0}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className={totalStock <= 0 ? 'text-red-600 font-bold' : totalStock < 5 ? 'text-orange-500 font-semibold' : 'text-gray-700'}>
                          {totalStock}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => handleToggleActive(p)} disabled={togglingId === p.id}
                          title={p.active ? 'Deshabilitar' : 'Habilitar'}
                          className={'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ' + (p.active ? 'bg-green-500' : 'bg-gray-300')}>
                          <span className={'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ' + (p.active ? 'translate-x-4' : 'translate-x-1')} />
                        </button>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={'/admin/products/' + p.id} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="Editar">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </Link>
                          <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400 transition-colors" title="Eliminar">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">Mostrando {((page - 1) * limit) + 1}â{Math.min(page * limit, total)} de {total}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">Anterior</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let n = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return <button key={n} onClick={() => setPage(n)} className={'px-3 py-1.5 text-sm border rounded-lg ' + (page === n ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50')}>{n}</button>;
              })}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Eliminar producto</h3>
            <p className="text-sm text-gray-500 mb-4">Â¿EstÃ¡s seguro? Esta acciÃ³n no se puede deshacer.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-1">Importar productos masivamente</h3>
            <p className="text-xs text-gray-400 mb-4">Columnas: <span className="font-mono bg-gray-100 px-1 rounded">name, sku, price, cost_price, stock_ocoa, stock_local, brand, description, image_url, active</span></p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              <span className="text-sm font-medium text-gray-600">{importing ? 'Importando...' : 'Seleccionar archivo Excel o CSV'}</span>
              <input ref={importFileRef} type="file" accept=".xlsx,.csv" onChange={handleImport} disabled={importing} className="hidden" />
            </label>
            {importResult && (
              <div className={'mt-3 p-3 rounded-lg text-sm ' + (importResult.inserted > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200')}>
                {importResult.inserted > 0 && <p className="text-green-700 font-semibold">â {importResult.inserted} productos importados</p>}
                {importResult.errors?.length > 0 && <div className="mt-1 text-red-700 text-xs"><p className="font-medium">Errores:</p><ul className="list-disc list-inside mt-1">{importResult.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}</ul></div>}
              </div>
            )}
            <div className="flex items-center justify-between mt-4">
              <a href="/api/admin/products/import" className="text-sm text-blue-600 hover:underline">Descargar plantilla</a>
              <button onClick={() => { setShowImport(false); setImportResult(null); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
