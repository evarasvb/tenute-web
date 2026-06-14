'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { normalizeBarcode } from '@/lib/validators';
import { isValidGtinDigits, normalizeBarcodeDigits } from '@/lib/ean';

// iOS Safari no soporta la BarcodeDetector API nativa.
// Soluciones:
//   - Modo Foto: input[capture=environment] -> canvas -> ZXing WASM via CDN (cero dependencias npm)
//   - Modo Camara continua: usa BarcodeDetector nativo si existe (Chrome/Android),
//     o ZXing desde CDN como fallback
// ZXing se carga desde unpkg solo si es necesario, sin bloquear el build.

declare global {
  interface Window {
    ZXingBrowser?: {
      BrowserMultiFormatReader: new () => {
        decodeFromCanvas(canvas: HTMLCanvasElement): Promise<{ getText(): string }>;
        decodeFromVideoElement(
          el: HTMLVideoElement,
          cb: (result: { getText(): string } | null, err: Error | undefined) => void
        ): void;
        reset(): void;
      };
    };
  }
}

interface Category { id: string; name: string; }
interface SuggestedData {
  name: string; brand: string; description: string;
  category: string; image_url: string; price_ref: number | null;
}
interface LookupResult {
  ean: string; found: boolean; source: string;
  existing_product?: { id: string; name: string; slug: string; image_url: string | null };
  suggested?: SuggestedData;
}

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Load ZXing from CDN if not already present
async function loadZXing(): Promise<typeof window.ZXingBrowser | null> {
  if (window.ZXingBrowser) return window.ZXingBrowser;
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@zxing/browser@0.1.4/umd/index.min.js';
    script.onload = () => resolve(window.ZXingBrowser || null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

export default function NewFromBarcodePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<{ reset(): void } | null>(null);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: '', at: 0 });
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [step, setStep] = useState<'scan' | 'review' | 'saved'>('scan');
  const [scannerMode, setScannerMode] = useState<'camera' | 'manual' | 'photo'>('camera');
  const [scannerStatus, setScannerStatus] = useState('');
  const [scannerError, setScannerError] = useState('');
  const [manualEan, setManualEan] = useState('');
  const [cameraReady, setCameraReady] = useState(false);

  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [ean, setEan] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedProduct, setSavedProduct] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (isIOS()) setScannerMode('photo');
    fetch('/api/admin/categories').then(r => r.json()).then(setCategories);
  }, []);

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current) { clearTimeout(scanTimerRef.current); scanTimerRef.current = null; }
    if (readerRef.current) { try { readerRef.current.reset(); } catch { /* ok */ } readerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraReady(false);
    setScannerStatus('');
  }, []);

  const handleLookup = useCallback(async (code: string) => {
    const digits = normalizeBarcodeDigits(code);
    if (!digits || !isValidGtinDigits(digits)) {
      setLookupError('Codigo invalido (' + code.substring(0,20) + '). Se esperan 8-14 digitos EAN/UPC.');
      return;
    }
    setEan(digits);
    setLookupLoading(true);
    setLookupError('');
    setScannerStatus('Buscando ' + digits + '...');
    try {
      const res = await fetch('/api/admin/barcode-lookup?ean=' + encodeURIComponent(digits));
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error((e as {error?:string}).error || 'Error ' + res.status); }
      const data: LookupResult = await res.json();
      setLookupResult(data);
      if (data.existing_product) {
        setStep('saved');
        setSavedProduct({ id: data.existing_product.id, name: data.existing_product.name });
      } else if (data.suggested) {
        setName(data.suggested.name); setBrand(data.suggested.brand);
        setDescription(data.suggested.description); setImageUrl(data.suggested.image_url);
        if (data.suggested.price_ref) setPrice(String(Math.round(data.suggested.price_ref)));
        setStep('review');
      } else {
        setName(''); setBrand(''); setDescription(''); setImageUrl('');
        setStep('review');
      }
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : 'Error al buscar');
    }
    setLookupLoading(false);
    setScannerStatus('');
  }, []);

  const startCamera = useCallback(async () => {
    setScannerError('');
    setScannerStatus('Iniciando camara...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraReady(true);
      setScannerStatus('Apunta al codigo de barras');

      // Try native BarcodeDetector (Chrome, Android, desktop)
      const win = window as Window & {
        BarcodeDetector?: new (o?: object) => { detect(s: CanvasImageSource): Promise<{rawValue: string}[]> }
      };
      if (win.BarcodeDetector) {
        const detector = new win.BarcodeDetector({ formats: ['ean_13','ean_8','upc_a','upc_e','code_128','code_39','qr_code'] });
        const loop = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            for (const b of barcodes) {
              const now = Date.now();
              const raw = normalizeBarcode(b.rawValue);
              if (raw === lastScanRef.current.code && now - lastScanRef.current.at < 3000) continue;
              lastScanRef.current = { code: raw, at: now };
              stopCamera(); handleLookup(raw); return;
            }
          } catch { /* ignore frame errors */ }
          scanTimerRef.current = setTimeout(loop, 200);
        };
        scanTimerRef.current = setTimeout(loop, 200);
        return;
      }

      // Fallback: ZXing from CDN
      setScannerStatus('Cargando decoder...');
      const ZXing = await loadZXing();
      if (!ZXing) {
        stopCamera();
        setScannerError('Camara no soportada en este navegador. Usa el modo Foto.');
        setScannerMode('photo');
        return;
      }
      const reader = new ZXing.BrowserMultiFormatReader();
      readerRef.current = reader;
      if (videoRef.current) {
        setScannerStatus('Apunta al codigo de barras');
        reader.decodeFromVideoElement(videoRef.current, (result, _err) => {
          if (result) {
            const raw = result.getText();
            const now = Date.now();
            if (raw === lastScanRef.current.code && now - lastScanRef.current.at < 3000) return;
            lastScanRef.current = { code: raw, at: now };
            stopCamera(); handleLookup(raw);
          }
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setScannerError('No se pudo acceder a la camara' + (msg ? ': ' + msg : '') + '. Usa el modo Foto.');
      setScannerStatus('');
      setScannerMode('photo');
    }
  }, [stopCamera, handleLookup]);

  useEffect(() => {
    if (scannerMode === 'camera' && step === 'scan') startCamera();
    else stopCamera();
    return () => { stopCamera(); };
  }, [scannerMode, step, startCamera, stopCamera]);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScannerStatus('Analizando imagen...');
    setLookupError('');
    try {
      const img = document.createElement('img');
      const url = URL.createObjectURL(file);
      img.src = url;
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; });
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // Try native BarcodeDetector first
      const win = window as Window & {
        BarcodeDetector?: new (o?: object) => { detect(s: CanvasImageSource): Promise<{rawValue: string}[]> }
      };
      if (win.BarcodeDetector) {
        const detector = new win.BarcodeDetector({ formats: ['ean_13','ean_8','upc_a','upc_e','code_128','code_39','qr_code'] });
        const results = await detector.detect(canvas);
        if (results[0]?.rawValue) {
          setScannerStatus(''); handleLookup(results[0].rawValue);
          if (photoInputRef.current) photoInputRef.current.value = '';
          return;
        }
      }

      // ZXing from CDN
      const ZXing = await loadZXing();
      if (ZXing) {
        try {
          const reader = new ZXing.BrowserMultiFormatReader();
          const result = await reader.decodeFromCanvas(canvas);
          if (result) {
            setScannerStatus(''); handleLookup(result.getText());
            if (photoInputRef.current) photoInputRef.current.value = '';
            return;
          }
        } catch { /* not found */ }
      }

      setScannerStatus('');
      setLookupError('No se pudo leer el codigo. Intenta mas cerca con buena luz, o usa el modo Manual.');
    } catch {
      setScannerStatus('');
      setLookupError('Error al procesar la imagen.');
    }
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = manualEan.trim();
    if (!val) return;
    handleLookup(val);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setSaveError('El nombre es requerido'); return; }
    setSaving(true); setSaveError('');
    const slug = slugify(name) + '-' + Date.now().toString(36);
    const payload = {
      name: name.trim(), slug, brand: brand.trim() || null,
      description: description.trim() || null, image_url: imageUrl.trim() || null,
      price: parseFloat(price) || 0, ean: ean || null,
      category_id: categoryId || null, active: true, stock: 0,
    };
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { id?: string; product?: { id: string }; error?: string };
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setSavedProduct({ id: data.id || data.product?.id || '', name: name.trim() });
      setStep('saved');
    } catch (err: unknown) { setSaveError(err instanceof Error ? err.message : 'Error'); }
    setSaving(false);
  };

  const reset = () => {
    setStep('scan'); setLookupResult(null); setLookupError('');
    setManualEan(''); setEan('');
    setName(''); setBrand(''); setDescription(''); setImageUrl(''); setPrice(''); setCategoryId('');
    setSavedProduct(null); setSaveError('');
  };

  const modeLabel = (m: typeof scannerMode) =>
    ({ camera: 'Camara', manual: 'Manual / USB', photo: 'Foto (iOS)' }[m]);

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/products')} className="text-gray-500 hover:text-gray-800">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nuevo producto desde codigo</h1>
          <p className="text-sm text-gray-500">Escanea o ingresa un EAN/UPC para autocompletar</p>
        </div>
      </div>

      {step === 'scan' && (
        <div className="space-y-4">
          <div className="flex gap-1.5">
            {(['camera','photo','manual'] as const).map(m => (
              <button key={m} onClick={() => { setScannerMode(m); stopCamera(); }}
                className={'flex-1 py-2 rounded-lg text-xs font-medium border transition ' +
                  (scannerMode === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400')}>
                {modeLabel(m)}
              </button>
            ))}
          </div>

          {scannerMode === 'camera' && (
            <div className="rounded-xl overflow-hidden bg-black relative aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              {cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-yellow-400 rounded-lg w-3/4 h-16 opacity-80" />
                </div>
              )}
              {scannerStatus && (
                <div className="absolute bottom-2 inset-x-0 flex justify-center">
                  <span className="bg-black/70 text-white text-xs px-3 py-1 rounded-full">{scannerStatus}</span>
                </div>
              )}
            </div>
          )}

          {scannerMode === 'photo' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                Toca el boton, apunta al codigo de barras y toma la foto.
              </p>
              <label className="block">
                <input ref={photoInputRef} type="file" accept="image/*" capture="environment"
                  onChange={handlePhotoCapture} className="hidden" />
                <span className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 cursor-pointer active:bg-blue-800">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Tomar foto del codigo
                </span>
              </label>
            </div>
          )}

          {scannerError && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700 flex justify-between">
              <span>{scannerError}</span>
              <button onClick={() => setScannerError('')} className="ml-2 text-orange-500">x</button>
            </div>
          )}

          {scannerMode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input ref={manualInputRef} type="text" value={manualEan}
                onChange={e => setManualEan(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleManualSubmit(e as unknown as React.FormEvent); }}}
                placeholder="Escribe o escanea con pistola USB..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus inputMode="numeric" />
              <button type="submit" disabled={!manualEan.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700">
                Buscar
              </button>
            </form>
          )}

          {(lookupLoading || (scannerMode === 'photo' && scannerStatus)) && (
            <div className="flex items-center gap-2 text-sm text-blue-600 animate-pulse">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              {lookupLoading ? 'Consultando bases de datos...' : scannerStatus}
            </div>
          )}
          {lookupError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex justify-between">
              <span>{lookupError}</span>
              <button onClick={() => setLookupError('')} className="ml-2 text-red-500">x</button>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {step === 'review' && (
        <form onSubmit={handleSave} className="space-y-4">
          {lookupResult ? (
            <div className={'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ' +
              (lookupResult.found ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
              {lookupResult.found ? 'Encontrado en ' + lookupResult.source : 'No encontrado: rellena manualmente'}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
              No encontrado: rellena manualmente
            </div>
          )}
          {imageUrl && (
            <div className="flex justify-center">
              <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <Image src={imageUrl} alt="Producto" fill className="object-contain p-2" unoptimized />
              </div>
            </div>
          )}
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 font-mono">EAN: {ean}</div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
            <input value={brand} onChange={e => setBrand(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sin categoria</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio (CLP)</label>
            <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL imagen</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={reset}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              Volver
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar en catalogo'}
            </button>
          </div>
        </form>
      )}

      {step === 'saved' && savedProduct && (
        <div className="text-center space-y-4 py-8">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{lookupResult?.existing_product ? 'Este producto ya existe' : 'Producto guardado'}</p>
            <p className="text-sm text-gray-500 mt-1">{savedProduct.name}</p>
          </div>
          <div className="flex gap-2 justify-center">
            <button onClick={reset} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              Escanear otro
            </button>
            <button onClick={() => router.push('/admin/products/' + savedProduct.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Ver producto
            </button>
          </div>
        </div>
      )}
    </div>
  );
                                                   }
