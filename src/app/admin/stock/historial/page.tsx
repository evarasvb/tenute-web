'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Movement {
  id: number;
  product_id: string;
  warehouse: string | null;
  delta: number;
  stock_after: number | null;
  reason: string | null;
  note: string | null;
  created_at: string;
  products?: { name: string; sku: string | null; barcode: string | null } | null;
}

const WAREHOUSE_LABEL: Record<string, string> = { ocoa: 'Ocoa', local21: 'Local 21' };
const REASON_LABEL: Record<string, string> = {
  inventario: 'Inventario', edicion: 'Edición', compra: 'Compra', venta: 'Venta', ajuste: 'Ajuste',
};

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

export default function StockHistoryPage() {
  const router = useRouter();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stock/movements?limit=500');
      const data = await res.json();
      setMovements(data.movements || []);
      setAvailable(data.available !== false);
    } catch {
      setAvailable(false);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return movements;
    return movements.filter((m) =>
      (m.products?.name || '').toLowerCase().includes(q) ||
      (m.products?.sku || '').toLowerCase().includes(q) ||
      (m.products?.barcode || '').toLowerCase().includes(q)
    );
  }, [movements, search]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/stock')} className="text-gray-500 hover:text-gray-800" aria-label="Volver">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Historial de stock</h1>
          <p className="text-sm text-gray-500">Movimientos de inventario más recientes</p>
        </div>
      </div>

      {!available && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          El historial aún no está activo. Ejecuta <code className="font-mono bg-yellow-100 px-1 rounded">supabase-migration-stock-movements.sql</code> en Supabase → SQL Editor para crear la tabla. Desde ahí se registrarán los movimientos.
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filtrar por producto, SKU o código…"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="px-4 py-10 text-center text-gray-400 text-sm">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-gray-400 text-sm">Sin movimientos registrados.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {filtered.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className={`shrink-0 w-12 text-right font-bold ${m.delta > 0 ? 'text-green-600' : m.delta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {m.delta > 0 ? '+' : ''}{m.delta}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.products?.name || m.product_id}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {REASON_LABEL[m.reason || ''] || m.reason || '—'}
                    {m.warehouse ? ` · ${WAREHOUSE_LABEL[m.warehouse] || m.warehouse}` : ''}
                    {m.stock_after != null ? ` · queda ${m.stock_after}` : ''}
                    {m.note ? ` · ${m.note}` : ''}
                  </p>
                </div>
                <div className="shrink-0 text-xs text-gray-400 whitespace-nowrap">{fmtDate(m.created_at)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
