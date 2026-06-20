'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBarcodeDetector } from '@/lib/barcode-detector';
import { normalizeBarcode } from '@/lib/validators';

type Warehouse = 'ocoa' | 'local21';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  image_url: string | null;
  stock_ocoa: number;
  stock_local21: number;
}

interface CountRow {
  product: Product;
  count: number;
}

const WAREHOUSE_LABEL: Record<Warehouse, string> = { ocoa: 'Bodega Ocoa', local21: 'Local 21' };

export default function InventarioScanPage() {
  const router = useRouter();
  const [warehouse, setWarehouse] = useState<Warehouse>('ocoa');
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');

  const [rows, setRows] = useState<CountRow[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState('');

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: '', at: 0 });
  const manualRef = useRef<HTMLInputElement | null>(null);

  // Suma 1 al conteo del producto (o lo agrega con conteo 1).
  const addCount = useCallback((product: Product, delta = 1) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.product.id === product.id);
      if (idx === -1) return [{ product, count: Math.max(0, delta) }, ...prev];
      const next = [...prev];
      next[idx] = { ...next[idx], count: Math.max(0, next[idx].count + delta) };
      return next;
    });
  }, []);

  const lookupAndAdd = useCallback(async (raw: string) => {
    const code = normalizeBarcode(raw);
    if (!code) return;
    setError('');
    setStatus(`Buscando ${code}…`);
    try {
      // Buscar por barcode y, si no, por SKU.
      let res = await fetch(`/api/admin/products?barcode=${encodeURIComponent(code)}&limit=1`);
      let data = await res.json();
      let product: Product | undefined = (data.data || data.products || [])[0];
      if (!product) {
        res = await fetch(`/api/admin/products?search=${encodeURIComponent(code)}&limit=1`);
        data = await res.json();
        const list: Product[] = data.data || data.products || [];
        product = list.find((p) => (p.sku || '').toLowerCase() === code.toLowerCase());
      }
      if (!product) {
        setError(`Sin producto para el código ${code}. ¿Crearlo?`);
        setStatus('');
        return;
      }
      addCount(product, 1);
      setStatus(`+1 ${product.name}`);
    } catch {
      setError('Error consultando el producto');
      setStatus('');
    }
  }, [addCount]);

  // ── Cámara ──────────────────────────────────────────────
  const stopScanner = useCallback(() => {
    if (scanLoopRef.current) { cancelAnimationFrame(scanLoopRef.current); scanLoopRef.current = null; }
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setScannerOpen(false);
  }, []);

  const startScanner = useCallback(async () => {
    setScannerError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerError('Tu navegador no soporta cámara. Usa el modo Manual / lector USB.');
      return;
    }
    let detector;
    try {
      detector = await createBarcodeDetector();
    } catch {
      setScannerError('No se pudo inicializar el lector en este navegador. Usa Manual.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScannerOpen(true);
      const scan = async () => {
        if (!videoRef.current) return;
        try {
          const detections = await detector.detect(videoRef.current);
          const rawValue = detections?.[0]?.rawValue?.trim();
          if (rawValue) {
            const normalized = normalizeBarcode(rawValue);
            const now = Date.now();
            if (lastScanRef.current.code !== normalized || now - lastScanRef.current.at > 1200) {
              lastScanRef.current = { code: normalized, at: now };
              lookupAndAdd(normalized);
            }
          }
        } catch { /* ignorar fallos intermitentes */ }
        scanLoopRef.current = requestAnimationFrame(scan);
      };
      scanLoopRef.current = requestAnimationFrame(scan);
    } catch {
      setScannerError('No se pudo iniciar la cámara.');
      stopScanner();
    }
  }, [lookupAndAdd, stopScanner]);

  useEffect(() => () => stopScanner(), [stopScanner]);
  useEffect(() => { if (mode !== 'camera') stopScanner(); }, [mode, stopScanner]);

  const setRowCount = (productId: string, value: number) => {
    setRows((prev) => prev.map((r) => (r.product.id === productId ? { ...r, count: Math.max(0, value) } : r)));
  };
  const removeRow = (productId: string) => setRows((prev) => prev.filter((r) => r.product.id !== productId));

  const totalUnidades = rows.reduce((s, r) => s + r.count, 0);

  const saveInventory = async () => {
    if (rows.length === 0) return;
    setSaving(true);
    setSaveResult('');
    let ok = 0, fail = 0;
    const movements: Array<{ product_id: string; warehouse: Warehouse; delta: number; stock_after: number; reason: string }> = [];
    for (const r of rows) {
      const ocoa = warehouse === 'ocoa' ? r.count : r.product.stock_ocoa || 0;
      const local21 = warehouse === 'local21' ? r.count : r.product.stock_local21 || 0;
      const actual = warehouse === 'ocoa' ? (r.product.stock_ocoa || 0) : (r.product.stock_local21 || 0);
      try {
        const res = await fetch(`/api/admin/products/${r.product.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock_ocoa: ocoa, stock_local21: local21, stock: ocoa + local21 }),
        });
        if (res.ok) {
          ok++;
          movements.push({ product_id: r.product.id, warehouse, delta: r.count - actual, stock_after: r.count, reason: 'inventario' });
        } else fail++;
      } catch { fail++; }
    }
    // Registrar el historial (best-effort: si la tabla no existe, no pasa nada).
    if (movements.length > 0) {
      try {
        await fetch('/api/admin/stock/movements', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movements }),
        });
      } catch { /* no fatal */ }
    }
    setSaving(false);
    setSaveResult(`Inventario guardado en ${WAREHOUSE_LABEL[warehouse]}: ${ok} productos actualizados${fail ? `, ${fail} con error` : ''}.`);
    if (fail === 0) setRows([]);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 pb-24">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/stock')} className="text-gray-500 hover:text-gray-800" aria-label="Volver">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventario por escaneo</h1>
          <p className="text-sm text-gray-500">Escanea cada unidad; al guardar se fija el stock de la bodega.</p>
        </div>
      </div>

      {/* Bodega */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Bodega a inventariar</label>
        <div className="flex gap-1.5">
          {(['ocoa', 'local21'] as const).map((w) => (
            <button key={w} onClick={() => setWarehouse(w)}
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${warehouse === w ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {WAREHOUSE_LABEL[w]}
            </button>
          ))}
        </div>
      </div>

      {/* Modo de escaneo */}
      <div className="flex gap-1.5">
        {(['manual', 'camera'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${mode === m ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {m === 'manual' ? 'Manual / Lector USB' : 'Cámara'}
          </button>
        ))}
      </div>

      {mode === 'manual' && (
        <form onSubmit={(e) => { e.preventDefault(); if (manualCode.trim()) { lookupAndAdd(manualCode); setManualCode(''); manualRef.current?.focus(); } }}>
          <input ref={manualRef} autoFocus inputMode="numeric" value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Escanea o escribe el EAN y Enter"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </form>
      )}

      {mode === 'camera' && (
        <div className="space-y-2">
          <button onClick={() => (scannerOpen ? stopScanner() : startScanner())}
            className={`w-full py-3 rounded-xl font-semibold text-white ${scannerOpen ? 'bg-red-500' : 'bg-blue-600'}`}>
            {scannerOpen ? 'Detener cámara' : 'Abrir cámara'}
          </button>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} className={`w-full rounded-xl bg-black ${scannerOpen ? '' : 'hidden'}`} playsInline muted />
          {scannerError && <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2">{scannerError}</p>}
        </div>
      )}

      {status && <p className="text-sm text-green-700">{status}</p>}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 flex items-center justify-between gap-2">
          <span>{error}</span>
          <Link href="/admin/products/new-from-barcode" className="text-red-600 underline shrink-0">Crear</Link>
        </div>
      )}

      {/* Conteo en curso */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-sm">
          <span className="font-medium text-gray-700">{rows.length} productos · {totalUnidades} unidades</span>
          {rows.length > 0 && <button onClick={() => setRows([])} className="text-xs text-gray-400 hover:text-red-600">Vaciar</button>}
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-gray-400 text-sm">Escanea productos para empezar a contar.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {rows.map((r) => {
              const actual = warehouse === 'ocoa' ? (r.product.stock_ocoa || 0) : (r.product.stock_local21 || 0);
              const diff = r.count - actual;
              return (
                <li key={r.product.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.product.name}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">
                      {r.product.barcode || r.product.sku || '—'} · actual {actual}
                      {diff !== 0 && <span className={diff > 0 ? 'text-green-600' : 'text-red-500'}> ({diff > 0 ? '+' : ''}{diff})</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setRowCount(r.product.id, r.count - 1)} className="w-7 h-7 rounded bg-gray-100 text-gray-600 hover:bg-gray-200">−</button>
                    <input type="number" min={0} value={r.count}
                      onChange={(e) => setRowCount(r.product.id, Number(e.target.value))}
                      className="w-14 text-center border border-gray-300 rounded py-1 text-sm" />
                    <button onClick={() => addCount(r.product, 1)} className="w-7 h-7 rounded bg-gray-100 text-gray-600 hover:bg-gray-200">+</button>
                    <button onClick={() => removeRow(r.product.id)} className="ml-1 text-gray-300 hover:text-red-500" aria-label="Quitar">✕</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {saveResult && <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">{saveResult}</p>}

      {/* Acción fija abajo */}
      {rows.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3">
          <div className="max-w-2xl mx-auto">
            <button onClick={saveInventory} disabled={saving}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-50">
              {saving ? 'Guardando…' : `Guardar inventario en ${WAREHOUSE_LABEL[warehouse]} (${rows.length})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
