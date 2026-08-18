'use client';

import { useEffect, useMemo, useState } from 'react';

/* ----------------------------- helpers ----------------------------- */

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}
function formatCompact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toLocaleString('es-CL', { maximumFractionDigits: 1 })} MM`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toLocaleString('es-CL', { maximumFractionDigits: 1 })} M`;
  if (abs >= 1_000) return `$${(n / 1_000).toLocaleString('es-CL', { maximumFractionDigits: 0 })} K`;
  return formatCLP(n);
}
function formatInt(n: number) {
  return n.toLocaleString('es-CL');
}

const PALETTE = ['#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#db2777', '#ca8a04', '#4f46e5', '#dc2626', '#059669'];

interface P {
  n: string; c: string; price: number; cost: number; stock: number;
  ocoa: number; l21: number; img: 0 | 1; offer: 0 | 1; margin: number | null;
}
interface Sales {
  revenue30d: number; orders30d: number; revenueTotal: number; ordersTotal: number;
  monthly: Array<{ ym: string; revenue: number; orders: number }>;
  topSold: Array<{ name: string; qty: number; revenue: number }>;
}
interface Payload { generatedAt: string; products: P[]; sales: Sales; }

/* ----------------------------- UI atoms ----------------------------- */

function Card({ title, subtitle, children, className = '' }: { title?: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 sm:p-5 ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function Kpi({ label, value, sub, accent = '#2563eb' }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: accent }} />
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/** Barras horizontales, con click opcional para slicing. */
function BarsH({ items, format, onClick, active }: {
  items: Array<{ label: string; value: number; color?: string }>;
  format: (n: number) => string;
  onClick?: (label: string) => void;
  active?: string | null;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2.5">
      {items.map((it, idx) => {
        const pct = (it.value / max) * 100;
        const isActive = active === it.label;
        return (
          <button
            key={it.label}
            onClick={onClick ? () => onClick(it.label) : undefined}
            className={`w-full text-left group ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className="flex justify-between text-xs mb-1">
              <span className={`truncate pr-2 ${isActive ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{it.label}</span>
              <span className="text-gray-500 font-medium tabular-nums flex-shrink-0">{format(it.value)}</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: it.color || PALETTE[idx % PALETTE.length], opacity: active && !isActive ? 0.45 : 1 }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

/** Histograma de barras verticales. */
function VBars({ items }: { items: Array<{ label: string; value: number; color?: string }> }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex items-end gap-2 h-40">
      {items.map((it, idx) => {
        const h = (it.value / max) * 100;
        return (
          <div key={it.label} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
            <span className="text-[11px] font-semibold text-gray-700 tabular-nums">{it.value}</span>
            <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(h, 2)}%`, background: it.color || PALETTE[idx % PALETTE.length] }} />
            <span className="text-[10px] text-gray-400 text-center leading-tight">{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Donut SVG con leyenda. */
function Donut({ items, format }: { items: Array<{ label: string; value: number; color: string }>; format: (n: number) => string }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const R = 60, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <svg viewBox="0 0 160 160" className="w-36 h-36 flex-shrink-0 -rotate-90">
        {items.map((it) => {
          const frac = it.value / total;
          const dash = frac * C;
          const seg = (
            <circle key={it.label} cx="80" cy="80" r={R} fill="none" stroke={it.color} strokeWidth="22"
              strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-offset} />
          );
          offset += dash;
          return seg;
        })}
        <circle cx="80" cy="80" r="38" fill="white" />
      </svg>
      <div className="space-y-1.5 w-full">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: it.color }} />
              <span className="truncate text-gray-600">{it.label}</span>
            </span>
            <span className="text-gray-500 font-medium tabular-nums flex-shrink-0">
              {format(it.value)} · {Math.round((it.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- page ----------------------------- */

export default function AnaliticaPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Slicers
  const [category, setCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'out'>('all');
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [search, setSearch] = useState('');
  const [valueMode, setValueMode] = useState<'venta' | 'costo'>('venta');

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(async (r) => { if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || 'Error'); return r.json(); })
      .then((d: Payload) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message || 'No se pudo cargar'); setLoading(false); });
  }, []);

  const products = useMemo(() => data?.products || [], [data]);

  const categories = useMemo(() => {
    const set = new Map<string, number>();
    for (const p of products) set.set(p.c, (set.get(p.c) || 0) + 1);
    return Array.from(set.entries()).sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [products]);

  // Filtro base sin categoría (para gráficos por categoría clickeables)
  const baseFiltered = useMemo(() => products.filter((p) => {
    if (stockFilter === 'in' && p.stock <= 0) return false;
    if (stockFilter === 'out' && p.stock > 0) return false;
    if (onlyOffers && !p.offer) return false;
    if (search && !p.n.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [products, stockFilter, onlyOffers, search]);

  const filtered = useMemo(
    () => (category === 'all' ? baseFiltered : baseFiltered.filter((p) => p.c === category)),
    [baseFiltered, category]
  );

  const kpis = useMemo(() => {
    const totalProducts = filtered.length;
    const withStock = filtered.filter((p) => p.stock > 0).length;
    const invSale = filtered.reduce((s, p) => s + p.price * p.stock, 0);
    const invCost = filtered.reduce((s, p) => s + p.cost * p.stock, 0);
    const withImg = filtered.filter((p) => p.img).length;
    const margins = filtered.map((p) => p.margin).filter((m): m is number => m != null && m > -100 && m < 100);
    const avgMargin = margins.length ? margins.reduce((s, m) => s + m, 0) / margins.length : null;
    const offers = filtered.filter((p) => p.offer).length;
    return {
      totalProducts, withStock, invSale, invCost, profit: invSale - invCost,
      avgMargin, imgPct: totalProducts ? Math.round((withImg / totalProducts) * 100) : 0,
      offers, noImg: totalProducts - withImg, noStock: totalProducts - withStock,
    };
  }, [filtered]);

  // Valor por categoría (respeta filtros excepto categoría → clickeable)
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of baseFiltered) map.set(p.c, (map.get(p.c) || 0) + (valueMode === 'venta' ? p.price : p.cost) * p.stock);
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [baseFiltered, valueMode]);

  const mixByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of baseFiltered) map.set(p.c, (map.get(p.c) || 0) + 1);
    return Array.from(map.entries())
      .map(([label, value], i) => ({ label, value, color: PALETTE[i % PALETTE.length] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [baseFiltered]);

  const marginBuckets = useMemo(() => {
    const buckets = [
      { label: 'Pérdida', min: -Infinity, max: 0, color: '#dc2626' },
      { label: '0–15%', min: 0, max: 15, color: '#ea580c' },
      { label: '15–30%', min: 15, max: 30, color: '#ca8a04' },
      { label: '30–45%', min: 30, max: 45, color: '#16a34a' },
      { label: '45–60%', min: 45, max: 60, color: '#0891b2' },
      { label: '60%+', min: 60, max: Infinity, color: '#2563eb' },
    ];
    return buckets.map((b) => ({
      label: b.label,
      color: b.color,
      value: filtered.filter((p) => p.margin != null && p.margin >= b.min && p.margin < b.max).length,
    }));
  }, [filtered]);

  const warehouse = useMemo(() => ([
    { label: 'Ocoa', value: filtered.reduce((s, p) => s + p.ocoa, 0), color: PALETTE[0] },
    { label: 'Local 21', value: filtered.reduce((s, p) => s + p.l21, 0), color: PALETTE[1] },
  ]), [filtered]);

  const topByValue = useMemo(() =>
    [...filtered]
      .map((p) => ({ ...p, v: (valueMode === 'venta' ? p.price : p.cost) * p.stock }))
      .sort((a, b) => b.v - a.v).slice(0, 10),
  [filtered, valueMode]);

  const topByMargin = useMemo(() =>
    filtered.filter((p) => p.margin != null && p.margin < 100).sort((a, b) => (b.margin! - a.margin!)).slice(0, 10),
  [filtered]);

  function exportCsv() {
    const headers = ['Producto', 'Categoria', 'Precio', 'Costo', 'Margen%', 'Stock', 'Ocoa', 'Local21', 'ValorVenta', 'ValorCosto'];
    const esc = (v: any) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = filtered.map((p) => [p.n, p.c, p.price, p.cost, p.margin ?? '', p.stock, p.ocoa, p.l21, p.price * p.stock, p.cost * p.stock].map(esc).join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `analitica-tenute-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const anySlicer = category !== 'all' || stockFilter !== 'all' || onlyOffers || search !== '';

  if (loading) return <div className="text-gray-500 py-20 text-center">Cargando analítica…</div>;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700">{error}</div>;

  const sales = data!.sales;

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analítica</h2>
          <p className="text-sm text-gray-500 mt-1">
            Tablero interactivo del catálogo e inventario · {formatInt(products.length)} productos activos
          </p>
        </div>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Exportar CSV
        </button>
      </div>

      {/* Slicers */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 sticky top-0 z-10">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="all">Todas las categorías</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            {(['all', 'in', 'out'] as const).map((v) => (
              <button key={v} onClick={() => setStockFilter(v)}
                className={`px-3 py-2 transition-colors ${stockFilter === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {v === 'all' ? 'Todo stock' : v === 'in' ? 'Con stock' : 'Sin stock'}
              </button>
            ))}
          </div>

          <label className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border cursor-pointer transition-colors ${onlyOffers ? 'bg-orange-50 border-orange-300 text-orange-700' : 'border-gray-300 text-gray-600'}`}>
            <input type="checkbox" checked={onlyOffers} onChange={(e) => setOnlyOffers(e.target.checked)} className="accent-orange-500" />
            Solo ofertas
          </label>

          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto…"
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 flex-1 min-w-[140px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />

          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm ml-auto">
            {(['venta', 'costo'] as const).map((v) => (
              <button key={v} onClick={() => setValueMode(v)}
                className={`px-3 py-2 transition-colors ${valueMode === v ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                Valor {v}
              </button>
            ))}
          </div>

          {anySlicer && (
            <button onClick={() => { setCategory('all'); setStockFilter('all'); setOnlyOffers(false); setSearch(''); }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium px-2">Limpiar filtros</button>
          )}
        </div>
        {category !== 'all' && (
          <p className="text-xs text-gray-500 mt-2">Filtrando por <span className="font-semibold text-gray-700">{category}</span> · haz clic en otra categoría de los gráficos para cambiar.</p>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Kpi label="Productos" value={formatInt(kpis.totalProducts)} sub={`${formatInt(kpis.withStock)} con stock`} accent={PALETTE[0]} />
        <Kpi label={`Inventario ${valueMode}`} value={formatCompact(valueMode === 'venta' ? kpis.invSale : kpis.invCost)} sub={`Venta ${formatCompact(kpis.invSale)} · Costo ${formatCompact(kpis.invCost)}`} accent={PALETTE[1]} />
        <Kpi label="Utilidad potencial" value={formatCompact(kpis.profit)} sub="Venta − costo del stock" accent={PALETTE[3]} />
        <Kpi label="Margen promedio" value={kpis.avgMargin != null ? `${kpis.avgMargin.toFixed(1)}%` : '—'} sub="Calculado precio vs costo" accent={PALETTE[2]} />
        <Kpi label="Con imagen" value={`${kpis.imgPct}%`} sub={`${formatInt(kpis.noImg)} sin foto`} accent={PALETTE[4]} />
        <Kpi label="Sin stock" value={formatInt(kpis.noStock)} sub="Productos en cero" accent={PALETTE[8]} />
        <Kpi label="En oferta" value={formatInt(kpis.offers)} sub="Marcados como oferta" accent={PALETTE[5]} />
        <Kpi label="Unidades" value={formatInt(filtered.reduce((s, p) => s + p.stock, 0))} sub="Stock total (Ocoa + Local 21)" accent={PALETTE[7]} />
      </div>

      {/* Fila de gráficos 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={`Valor de inventario por categoría (${valueMode})`} subtitle="Haz clic en una barra para filtrar todo el tablero">
          <BarsH items={byCategory} format={formatCompact} onClick={(l) => setCategory(category === l ? 'all' : l)} active={category === 'all' ? null : category} />
        </Card>
        <Card title="Distribución de margen" subtitle="N.º de productos por rango de margen (precio vs costo)">
          <VBars items={marginBuckets} />
        </Card>
      </div>

      {/* Fila de gráficos 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Mix de productos por categoría" subtitle="Cantidad de productos">
          <Donut items={mixByCategory} format={(n) => formatInt(n)} />
        </Card>
        <Card title="Inventario por bodega" subtitle="Unidades de stock">
          <Donut items={warehouse} format={(n) => `${formatInt(n)} u`} />
        </Card>
      </div>

      {/* Top productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Top 10 por valor de inventario" subtitle={`Precio ${valueMode} × stock`}>
          <div className="space-y-2">
            {topByValue.map((p, i) => {
              const max = topByValue[0]?.v || 1;
              return (
                <div key={p.n + i} className="text-xs">
                  <div className="flex justify-between gap-2 mb-0.5">
                    <span className="truncate text-gray-700">{i + 1}. {p.n}</span>
                    <span className="text-gray-500 font-medium tabular-nums flex-shrink-0">{formatCompact(p.v)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(p.v / max) * 100}%`, background: PALETTE[0] }} />
                  </div>
                </div>
              );
            })}
            {topByValue.length === 0 && <p className="text-sm text-gray-400">Sin datos.</p>}
          </div>
        </Card>
        <Card title="Top 10 por margen" subtitle="Mayor margen calculado">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 text-left">
                  <th className="font-medium py-1 px-1">Producto</th>
                  <th className="font-medium py-1 px-1 text-right">Precio</th>
                  <th className="font-medium py-1 px-1 text-right">Costo</th>
                  <th className="font-medium py-1 px-1 text-right">Margen</th>
                </tr>
              </thead>
              <tbody>
                {topByMargin.map((p, i) => (
                  <tr key={p.n + i} className="border-t border-gray-100">
                    <td className="py-1.5 px-1 text-gray-700 truncate max-w-[160px]">{p.n}</td>
                    <td className="py-1.5 px-1 text-right tabular-nums text-gray-600">{formatCLP(p.price)}</td>
                    <td className="py-1.5 px-1 text-right tabular-nums text-gray-500">{formatCLP(p.cost)}</td>
                    <td className="py-1.5 px-1 text-right tabular-nums font-semibold text-green-600">{p.margin!.toFixed(0)}%</td>
                  </tr>
                ))}
                {topByMargin.length === 0 && <tr><td colSpan={4} className="py-3 text-gray-400">Sin datos de costo.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Ventas online */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ventas online</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <Kpi label="Ingresos 30 días" value={formatCompact(sales.revenue30d)} sub={`${formatInt(sales.orders30d)} pedidos`} accent={PALETTE[1]} />
          <Kpi label="Pedidos 30 días" value={formatInt(sales.orders30d)} accent={PALETTE[0]} />
          <Kpi label="Ingresos totales" value={formatCompact(sales.revenueTotal)} sub="Histórico tienda" accent={PALETTE[2]} />
          <Kpi label="Pedidos totales" value={formatInt(sales.ordersTotal)} accent={PALETTE[7]} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Ingresos por mes" subtitle="Últimos 6 meses">
            <VBars items={sales.monthly.map((m) => ({ label: m.ym.slice(2), value: Math.round(m.revenue) }))} />
            <p className="text-[11px] text-gray-400 mt-3 text-center">Montos en pesos · el eje se llena a medida que registres ventas.</p>
          </Card>
          <Card title="Productos más vendidos" subtitle="Por unidades (pedidos web)">
            {sales.topSold.length > 0 ? (
              <div className="space-y-2">
                {sales.topSold.map((t, i) => {
                  const max = sales.topSold[0]?.qty || 1;
                  return (
                    <div key={t.name + i} className="text-xs">
                      <div className="flex justify-between gap-2 mb-0.5">
                        <span className="truncate text-gray-700">{i + 1}. {t.name}</span>
                        <span className="text-gray-500 font-medium flex-shrink-0">{t.qty} u · {formatCompact(t.revenue)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(t.qty / max) * 100}%`, background: PALETTE[1] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-6 text-center">Aún no hay ventas registradas en la tienda online.</p>
            )}
          </Card>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 text-center pt-2">
        Actualizado {new Date(data!.generatedAt).toLocaleString('es-CL')} · los filtros afectan todos los indicadores del catálogo.
      </p>
    </div>
  );
}
