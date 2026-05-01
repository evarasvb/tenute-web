'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  brand: string | null;
  price: number;
  cost_price: number | null;
  active: boolean;
  categories?: { name: string };
}

type MarginFilter = 'all' | 'negative' | 'low' | 'ok' | 'no_cost';

function formatCLP(n: number) {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

function calcMargin(price: number, cost: number | null): number | null {
  if (!cost || cost <= 0 || price <= 0) return null;
  return ((price - cost) / price) * 100;
}

function suggestedPrice(cost: number | null, targetMargin: number): number | null {
  if (!cost || cost <= 0) return null;
  return cost / (1 - targetMargin / 100);
}

function MarginBadge({ margin }: { margin: number | null }) {
  if (margin === null) return <span className="text-xs text-gray-400 italic">sin costo</span>;
  if (margin < 0)
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">↓ {margin.toFixed(1)}%</span>;
  if (margin < 20)
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">{margin.toFixed(1)}%</span>;
  if (margin < 35)
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{margin.toFixed(1)}%</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{margin.toFixed(1)}%</span>;
}

export default function PreciosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [marginFilter, setMarginFilter] = useState<MarginFilter>('all');
  const [targetMargin, setTargetMargin] = useState(30);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editCost, setEditCost] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [applyingBulk, setApplyingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState('');
  const [sortBy, setSortBy] = useState<'margin' | 'name' | 'price' | 'cost'>('margin');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/products?limit=9999&page=1');
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let items = products.filter(p => {
      const margin = calcMargin(p.price, p.cost_price);
      const q = search.toLowerCase();
      const matchSearch = !search ||
        p.name.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q);

      const matchMargin =
        marginFilter === 'all' ? true :
        marginFilter === 'negative' ? (margin !== null && margin < 0) :
        marginFilter === 'low' ? (margin !== null && margin >= 0 && margin < 30) :
        marginFilter === 'ok' ? (margin !== null && margin >= 30) :
        marginFilter === 'no_cost' ? (margin === null) :
        true;

      return matchSearch && matchMargin;
    });

    items.sort((a, b) => {
      let va: number, vb: number;
      if (sortBy === 'margin') {
        va = calcMargin(a.price, a.cost_price) ?? -9999;
        vb = calcMargin(b.price, b.cost_price) ?? -9999;
      } else if (sortBy === 'price') {
        va = a.price; vb = b.price;
      } else if (sortBy === 'cost') {
        va = a.cost_price ?? 0; vb = b.cost_price ?? 0;
      } else {
        return sortDir === 'asc'
          ? a.name.localeCompare(b.name, 'es')
          : b.name.localeCompare(a.name, 'es');
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });

    return items;
  }, [products, search, marginFilter, sortBy, sortDir]);

  // Summary stats
  const stats = useMemo(() => {
    const withCost = products.filter(p => p.cost_price && p.cost_price > 0 && p.price > 0);
    const negative = withCost.filter(p => calcMargin(p.price, p.cost_price)! < 0);
    const low = withCost.filter(p => { const m = calcMargin(p.price, p.cost_price)!; return m >= 0 && m < 30; });
    const good = withCost.filter(p => calcMargin(p.price, p.cost_price)! >= 30);
    const noCost = products.filter(p => !p.cost_price || p.cost_price <= 0);
    return { total: products.length, negative: negative.length, low: low.length, good: good.length, noCost: noCost.length };
  }, [products]);

  function startEdit(p: Product) {
    setEditingId(p.id);
    setEditPrice(String(p.price));
    setEditCost(String(p.cost_price ?? ''));
  }

  function cancelEdit() { setEditingId(null); }

  async function saveEdit(id: string) {
    const price = parseFloat(editPrice);
    const cost = parseFloat(editCost) || null;
    if (isNaN(price) || price < 0) return;
    setSaving(id);
    await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price, cost_price: cost }),
    });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, price, cost_price: cost } : p));
    setSaved(prev => new Set([...prev, id]));
    setTimeout(() => setSaved(prev => { const s = new Set(prev); s.delete(id); return s; }), 2500);
    setSaving(null);
    setEditingId(null);
  }

  async function applySuggested(p: Product) {
    const suggested = suggestedPrice(p.cost_price, targetMargin);
    if (!suggested) return;
    setSaving(p.id);
    await fetch(`/api/admin/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: Math.ceil(suggested) }),
    });
    setProducts(prev => prev.map(item => item.id === p.id ? { ...item, price: Math.ceil(suggested) } : item));
    setSaved(prev => new Set([...prev, p.id]));
    setTimeout(() => setSaved(prev => { const s = new Set(prev); s.delete(p.id); return s; }), 2500);
    setSaving(null);
  }

  async function applyBulkSuggested() {
    const targets = filtered.filter(p => selectedIds.has(p.id) && p.cost_price && p.cost_price > 0);
    if (targets.length === 0) return;
    setApplyingBulk(true);
    setBulkResult('');
    let ok = 0;
    for (const p of targets) {
      const suggested = Math.ceil(suggestedPrice(p.cost_price, targetMargin)!);
      await fetch(`/api/admin/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: suggested }),
      });
      setProducts(prev => prev.map(item => item.id === p.id ? { ...item, price: suggested } : item));
      ok++;
    }
    setSelectedIds(new Set());
    setBulkResult(`${ok} precios actualizados`);
    setApplyingBulk(false);
    setTimeout(() => setBulkResult(''), 4000);
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  }

  function handleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  }

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col
      ? <span className="ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>
      : <span className="ml-0.5 text-gray-300">↕</span>;

  const FILTERS: { value: MarginFilter; label: string; color: string }[] = [
    { value: 'all', label: `Todos (${products.length})`, color: 'bg-gray-100 text-gray-700' },
    { value: 'negative', label: `Negativo (${stats.negative})`, color: 'bg-red-100 text-red-700' },
    { value: 'low', label: `Bajo <30% (${stats.low})`, color: 'bg-orange-100 text-orange-700' },
    { value: 'ok', label: `OK ≥30% (${stats.good})`, color: 'bg-green-100 text-green-700' },
    { value: 'no_cost', label: `Sin costo (${stats.noCost})`, color: 'bg-gray-100 text-gray-500' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revisión de precios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} productos · edición inline · margen objetivo configurable</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">Margen objetivo:</span>
          {[20, 25, 30, 35, 40].map(m => (
            <button key={m} onClick={() => setTargetMargin(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${targetMargin === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {m}%
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 cursor-pointer hover:shadow-sm" onClick={() => setMarginFilter('negative')}>
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Precio &lt; Costo</p>
          <p className="text-3xl font-bold text-red-700 mt-1">{stats.negative}</p>
          <p className="text-xs text-red-500 mt-0.5">pérdida en cada venta</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 cursor-pointer hover:shadow-sm" onClick={() => setMarginFilter('low')}>
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Margen bajo &lt;30%</p>
          <p className="text-3xl font-bold text-orange-700 mt-1">{stats.low}</p>
          <p className="text-xs text-orange-500 mt-0.5">por debajo del objetivo</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 cursor-pointer hover:shadow-sm" onClick={() => setMarginFilter('ok')}>
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Margen OK ≥30%</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{stats.good}</p>
          <p className="text-xs text-green-500 mt-0.5">dentro del objetivo</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-sm" onClick={() => setMarginFilter('no_cost')}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sin precio costo</p>
          <p className="text-3xl font-bold text-gray-600 mt-1">{stats.noCost}</p>
          <p className="text-xs text-gray-400 mt-0.5">no se puede calcular margen</p>
        </div>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, SKU o marca..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setMarginFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${marginFilter === f.value ? f.color + ' ring-2 ring-offset-1 ring-blue-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <span className="text-sm font-semibold text-blue-800">{selectedIds.size} seleccionado{selectedIds.size > 1 ? 's' : ''}</span>
          <button onClick={applyBulkSuggested} disabled={applyingBulk}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {applyingBulk ? 'Aplicando...' : `Aplicar precio sugerido (${targetMargin}%) a todos`}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-sm text-blue-600 hover:underline">Cancelar</button>
          {bulkResult && <span className="text-sm font-medium text-green-700 ml-2">✓ {bulkResult}</span>}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando productos...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No hay productos con ese filtro</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-3 text-left w-8">
                    <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll} className="rounded" />
                  </th>
                  <th className="px-3 py-3 text-left cursor-pointer select-none" onClick={() => handleSort('name')}>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto <SortIcon col="name" /></span>
                  </th>
                  <th className="px-3 py-3 text-right cursor-pointer select-none" onClick={() => handleSort('cost')}>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Costo <SortIcon col="cost" /></span>
                  </th>
                  <th className="px-3 py-3 text-right cursor-pointer select-none" onClick={() => handleSort('price')}>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio actual <SortIcon col="price" /></span>
                  </th>
                  <th className="px-3 py-3 text-center cursor-pointer select-none" onClick={() => handleSort('margin')}>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Margen <SortIcon col="margin" /></span>
                  </th>
                  <th className="px-3 py-3 text-right">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sugerido ({targetMargin}%)</span>
                  </th>
                  <th className="px-3 py-3 text-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => {
                  const margin = calcMargin(p.price, p.cost_price);
                  const suggested = suggestedPrice(p.cost_price, targetMargin);
                  const isEditing = editingId === p.id;
                  const isSaving = saving === p.id;
                  const wasSaved = saved.has(p.id);
                  const rowBg =
                    margin !== null && margin < 0 ? 'bg-red-50 hover:bg-red-100' :
                    margin !== null && margin < 30 ? 'bg-orange-50 hover:bg-orange-100' :
                    'hover:bg-gray-50';

                  return (
                    <tr key={p.id} className={`transition-colors ${rowBg}`}>
                      {/* Checkbox */}
                      <td className="px-3 py-2.5">
                        <input type="checkbox" checked={selectedIds.has(p.id)}
                          onChange={() => toggleSelect(p.id)} className="rounded" />
                      </td>

                      {/* Product info */}
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-900 truncate max-w-[260px]">{p.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {p.sku && <span className="font-mono mr-2">{p.sku}</span>}
                          {p.brand && <span>{p.brand}</span>}
                          {p.categories?.name && <span className="ml-2 text-gray-300">· {p.categories.name}</span>}
                        </p>
                      </td>

                      {/* Cost */}
                      <td className="px-3 py-2.5 text-right">
                        {isEditing ? (
                          <input
                            type="number" min="0" value={editCost} onChange={e => setEditCost(e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0"
                          />
                        ) : (
                          <span className={p.cost_price ? 'text-gray-700' : 'text-gray-300 italic'}>
                            {p.cost_price ? formatCLP(p.cost_price) : '—'}
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-3 py-2.5 text-right">
                        {isEditing ? (
                          <input
                            type="number" min="0" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                            className="w-28 px-2 py-1 border border-blue-300 rounded text-right text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <span className={`font-semibold ${margin !== null && margin < 0 ? 'text-red-700' : 'text-gray-900'}`}>
                            {formatCLP(p.price)}
                          </span>
                        )}
                      </td>

                      {/* Margin */}
                      <td className="px-3 py-2.5 text-center">
                        <MarginBadge margin={isEditing
                          ? calcMargin(parseFloat(editPrice) || p.price, parseFloat(editCost) || p.cost_price)
                          : margin}
                        />
                      </td>

                      {/* Suggested */}
                      <td className="px-3 py-2.5 text-right">
                        {suggested ? (
                          <span className={`font-medium ${suggested > p.price ? 'text-blue-700' : 'text-green-600'}`}>
                            {formatCLP(Math.ceil(suggested))}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {wasSaved && !isEditing && (
                            <span className="text-green-600 text-xs font-semibold">✓ guardado</span>
                          )}
                          {isEditing ? (
                            <>
                              <button onClick={() => saveEdit(p.id)} disabled={isSaving}
                                className="px-2.5 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
                                {isSaving ? '...' : 'Guardar'}
                              </button>
                              <button onClick={cancelEdit}
                                className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 transition-colors">
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(p)}
                                className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors">
                                Editar
                              </button>
                              {suggested && (
                                <button onClick={() => applySuggested(p)} disabled={isSaving}
                                  title={`Aplicar ${formatCLP(Math.ceil(suggested))}`}
                                  className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium hover:bg-blue-100 disabled:opacity-50 transition-colors">
                                  {isSaving ? '...' : 'Aplicar'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              Mostrando {filtered.length} de {products.length} productos
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 pb-2">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-200 inline-block" /> Margen negativo — precio menor al costo</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-200 inline-block" /> Margen bajo — por debajo del objetivo</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-200 inline-block" /> Margen OK — dentro del objetivo</span>
        <span className="flex items-center gap-1.5"><strong>Sugerido</strong> = costo ÷ (1 − margen objetivo)</span>
      </div>
    </div>
  );
}
