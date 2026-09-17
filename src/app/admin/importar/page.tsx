'use client';

import { useRef, useState } from 'react';

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

/* ---- Sección: subir lista de precios (CSV) ---- */
function PriceListUploader() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [margin, setMargin] = useState(60);
  const [mode, setMode] = useState<'margen_venta' | 'recargo'>('margen_venta');
  const [publish, setPublish] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  async function send(commit: boolean) {
    if (!file) { setError('Elige un archivo CSV'); return; }
    setBusy(true); setError(null); if (commit) setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('margin', String(margin));
      fd.append('mode', mode);
      fd.append('publish', String(publish));
      fd.append('commit', String(commit));
      const r = await fetch('/api/admin/import-price-list', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Error');
      if (commit) { setResult(d); setPreview(null); }
      else setPreview(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Subir lista de precios (CSV)</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Columnas: <code className="text-xs bg-gray-100 px-1 rounded">sku, name, neto</code>. Actualiza precio y costo de los que ya tienes (sin tocar el stock) y agrega los nuevos como “bajo pedido”.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-gray-500">Archivo CSV</span>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={(e) => { setFile(e.target.files?.[0] || null); setPreview(null); setResult(null); }}
            className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-blue-600" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-500">Margen %</span>
          <input type="number" min={0} max={99} value={margin} onChange={(e) => setMargin(Number(e.target.value))}
            className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-500">Tipo de margen</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as any)}
            className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-2 py-2 bg-white">
            <option value="margen_venta">Sobre precio de venta (÷)</option>
            <option value="recargo">Recargo sobre costo (×)</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="accent-blue-600" />
          Publicar los nuevos de inmediato
        </label>
        <button onClick={() => send(false)} disabled={busy || !file}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {busy ? 'Procesando…' : 'Previsualizar'}
        </button>
        {preview && (
          <button onClick={() => send(true)} disabled={busy}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
            Confirmar: actualizar {preview.actualizar} y agregar {preview.insertar}
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

      {preview && (
        <div className="text-sm text-gray-600">
          <p className="mb-2">{preview.total} filas · <span className="text-blue-600">{preview.actualizar} a actualizar</span> · <span className="text-green-600">{preview.insertar} nuevos</span> · margen {preview.margin}% ({preview.mode === 'margen_venta' ? 'sobre venta' : 'recargo'}).</p>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead><tr className="text-gray-400 text-left"><th className="p-1">SKU</th><th className="p-1">Producto</th><th className="p-1 text-right">Neto</th><th className="p-1 text-right">Precio venta</th><th className="p-1">Estado</th></tr></thead>
              <tbody>
                {preview.sample.map((s: any) => (
                  <tr key={s.sku} className="border-t border-gray-100">
                    <td className="p-1 text-gray-500">{s.sku}</td>
                    <td className="p-1 text-gray-700 truncate max-w-[220px]">{s.name}</td>
                    <td className="p-1 text-right tabular-nums text-gray-500">{formatCLP(s.neto)}</td>
                    <td className="p-1 text-right tabular-nums font-semibold">{formatCLP(s.price)}</td>
                    <td className="p-1">{s.nuevo ? <span className="text-green-600">nuevo</span> : <span className="text-blue-600">actualiza</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
          ✅ Listo: <b>{result.updated}</b> actualizados, <b>{result.inserted}</b> nuevos agregados.
          {result.errorCount > 0 && <> · {result.errorCount} con error.</>}
        </div>
      )}
    </div>
  );
}

interface Row {
  supplierSku: string; name: string; brand: string | null; ean: string | null;
  description: string | null; imageUrl: string | null; cost: number; url: string | null;
  category: string | null; price: number; margin: number; duplicate: boolean;
}

export default function ImportarPage() {
  const [supplier, setSupplier] = useState('dimerc');
  const [query, setQuery] = useState('');
  const [margin, setMargin] = useState(40);
  const [limit, setLimit] = useState(20);
  const [publish, setPublish] = useState(false);

  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number; errorCount: number; published: boolean } | null>(null);
  const [summary, setSummary] = useState<{ supplier: string; count: number; newCount: number; dupCount: number } | null>(null);

  async function preview() {
    setLoading(true); setError(null); setResult(null); setRows([]); setSummary(null);
    try {
      const r = await fetch('/api/admin/import-supplier', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', supplier, query, margin, limit }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Error');
      setRows(d.items);
      setSummary({ supplier: d.supplier, count: d.count, newCount: d.newCount, dupCount: d.dupCount });
      // Preseleccionar los nuevos (no duplicados).
      setSelected(new Set(d.items.filter((i: Row) => !i.duplicate).map((i: Row) => i.supplierSku)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo consultar');
    } finally {
      setLoading(false);
    }
  }

  async function commit() {
    const items = rows.filter((r) => selected.has(r.supplierSku));
    if (items.length === 0) { setError('Selecciona al menos un producto'); return; }
    setCommitting(true); setError(null); setResult(null);
    try {
      const r = await fetch('/api/admin/import-supplier', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'commit', supplier, margin, publish, items }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Error');
      setResult(d);
      // Quitar los importados de la tabla.
      setRows((prev) => prev.filter((p) => !selected.has(p.supplierSku)));
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo importar');
    } finally {
      setCommitting(false);
    }
  }

  function toggle(sku: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(sku) ? n.delete(sku) : n.add(sku); return n; });
  }
  const allSelectable = rows.filter((r) => !r.duplicate);
  const allSelected = allSelectable.length > 0 && allSelectable.every((r) => selected.has(r.supplierSku));

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Importar catálogo de proveedor</h2>
        <p className="text-sm text-gray-500 mt-1">
          Trae productos de tus proveedores y publícalos <span className="font-medium">bajo pedido</span>, con precio calculado automáticamente por margen. No necesitas tenerlos en bodega.
        </p>
      </div>

      {/* Subir lista de precios (CSV) — Vanni, etc. */}
      <PriceListUploader />

      <div className="border-t border-gray-200 pt-2">
        <h3 className="text-base font-semibold text-gray-900">Buscar en proveedor online</h3>
        <p className="text-sm text-gray-500 mt-0.5 mb-3">Dimerc / Prisa por su catálogo web.</p>
      </div>

      {/* Formulario de búsqueda */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-gray-500">Proveedor</span>
            <select value={supplier} onChange={(e) => setSupplier(e.target.value)}
              className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
              <option value="dimerc">Dimerc</option>
              <option value="prisa">Prisa</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-gray-500">Buscar</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && preview()}
              placeholder="ej: lápiz pasta, resma, cinta embalaje…"
              className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-500">Margen %</span>
            <input type="number" min={0} max={500} value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-xs font-medium text-gray-500">Cantidad</span>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white">
              {[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button onClick={preview} disabled={loading || !query.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Buscando…' : 'Previsualizar'}
          </button>
          <span className="text-xs text-gray-400">Precio venta = costo proveedor × (1 + margen), redondeado.</span>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
          ✅ Importados <b>{result.inserted}</b> productos {result.published ? 'publicados (bajo pedido)' : 'como borrador'}.
          {result.skipped > 0 && <> · {result.skipped} omitidos (ya existían).</>}
          {result.errorCount > 0 && <> · {result.errorCount} con error.</>}
          {' '}Puedes verlos en <a href="/admin/products" className="underline font-medium">Productos</a>.
        </div>
      )}

      {/* Resultados */}
      {summary && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-100">
            <div className="text-sm text-gray-600">
              {summary.count} resultados de <b>{summary.supplier}</b> · <span className="text-green-600">{summary.newCount} nuevos</span> · <span className="text-gray-400">{summary.dupCount} ya en catálogo</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="accent-blue-600" />
                Publicar de inmediato
              </label>
              <button onClick={commit} disabled={committing || selected.size === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {committing ? 'Importando…' : `Importar ${selected.size} seleccionados`}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 text-left border-b border-gray-100">
                  <th className="p-3 w-8">
                    <input type="checkbox" checked={allSelected} className="accent-blue-600"
                      onChange={(e) => setSelected(e.target.checked ? new Set(allSelectable.map((r) => r.supplierSku)) : new Set())} />
                  </th>
                  <th className="p-3">Producto</th>
                  <th className="p-3 text-right">Costo prov.</th>
                  <th className="p-3 text-right">Precio venta</th>
                  <th className="p-3 text-right">Utilidad</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.supplierSku} className={`border-b border-gray-50 ${r.duplicate ? 'opacity-50' : ''}`}>
                    <td className="p-3">
                      <input type="checkbox" disabled={r.duplicate} checked={selected.has(r.supplierSku)}
                        onChange={() => toggle(r.supplierSku)} className="accent-blue-600" />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {r.imageUrl ? <img src={r.imageUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-gray-300">📦</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-800 truncate max-w-[280px]">{r.name}</p>
                          <p className="text-xs text-gray-400">{[r.brand, r.category, r.ean].filter(Boolean).join(' · ') || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right tabular-nums text-gray-500">{formatCLP(r.cost)}</td>
                    <td className="p-3 text-right tabular-nums font-semibold text-gray-900">{formatCLP(r.price)}</td>
                    <td className="p-3 text-right tabular-nums text-green-600">{formatCLP(r.price - r.cost)}</td>
                    <td className="p-3">
                      {r.duplicate
                        ? <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Ya existe</span>
                        : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Nuevo</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!summary && !loading && (
        <div className="text-center text-gray-400 text-sm py-10 border border-dashed border-gray-200 rounded-xl">
          Busca un producto para ver el catálogo del proveedor con su precio de venta calculado.
        </div>
      )}
    </div>
  );
}
