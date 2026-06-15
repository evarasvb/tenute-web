'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { isValidGtinDigits, normalizeBarcodeDigits } from '@/lib/ean';

// ─── Typings for html5-qrcode UMD loaded from CDN ───────────────────────────
declare global {
  interface Window {
    Html5Qrcode?: new (elementId: string) => {
      start(
        cameraIdOrConfig: { facingMode: string },
        config: { fps: number; qrbox: number },
        onSuccess: (text: string) => void,
        onError?: (err: unknown) => void
      ): Promise<void>;
      stop(): Promise<void>;
      clear(): void;
    };
    Html5QrcodeScanner?: new (
      elementId: string,
      config: { fps: number; qrbox: number; rememberLastUsedCamera: boolean },
      verbose: boolean
    ) => {
      render(onSuccess: (text: string) => void, onError?: (err: unknown) => void): void;
      clear(): Promise<void>;
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

async function loadHtml5Qrcode(): Promise<boolean> {
  if (window.Html5Qrcode) return true;
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js';
    script.onload = () => resolve(!!window.Html5Qrcode);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export default function NewFromBarcodePage() {
  const router = useRouter();
  const scannerRef = useRef<{ stop(): Promise<void>; clear(): void } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'scan' | 'review' | 'saved'>('scan');
  const [scannerMode, setScannerMode] = useState<'camera' | 'manual' | 'photo'>('camera');
  const [scannerStatus, setScannerStatus] = useState('');
  const [scannerError, setScannerError] = useState('');
  const [manualEan, setManualEan] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

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
    fetch('/api/admin/categories').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setCategories(d);
    }).catch(() => {});
  }, []);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch { /* ok */ }
      try { scannerRef.current.clear(); } catch { /* ok */ }
      scannerRef.current = null;
    }
    setCameraActive(false);
    setScannerStatus('');
  }, []);

  const handleLookup = useCallback(async (code: string) => {
    const digits = normalizeBarcodeDigits(code);
    if (!digits || digits.length < 8) {
      setLookupError('Codigo muy corto. Se esperan al menos 8 digitos.');
      return;
    }
    if (!isValidGtinDigits(digits)) {
      setLookupError('Codigo invalido: ' + digits + '. Se esperan 8-14 digitos EAN/UPC.');
      return;
    }
    setEan(digits);
    setLookupLoading(true);
    setLookupError('');
    setScannerStatus('Buscando ' + digits + '...');
    try {
      const res = await fetch('/api/admin/barcode-lookup?ean=' + encodeURIComponent(digits));
      if (res.status === 401) {
        setLookupError('No autorizado. Por favor inicia sesion en /admin/login primero.');
        setLookupLoading(false);
        setScannerStatus('');
        return;
      }
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error || 'Error HTTP ' + res.status);
      }
      const data: LookupResult = await res.json();
      setLookupResult(data);
      if (data.existing_product) {
          setSavedProduct({
            id: data.existing_product.id,
            name: data.existing_product.name,
            slug: data.existing_product.slug,
            image_url: data.existing_product.image_url,
            ...(data.existing_product as any),
          });
          setStep('saved');
        setName(data.suggested.name || '');
        setBrand(data.suggested.brand || '');
        setDescription(data.suggested.description || '');
        setImageUrl(data.suggested.image_url || '');
        if (data.suggested.price_ref) setPrice(String(data.suggested.price_ref));
        setStep('review');
      } else {
        setName('');
        setBrand('');
        setDescription('');
        setImageUrl('');
        setStep('review');
      }
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : 'Error al buscar');
    } finally {
      setLookupLoading(false);
      setScannerStatus('');
    }
  }, []);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setScannerError('');
    setScannerStatus('Cargando escaner...');
    const loaded = await loadHtml5Qrcode();
    if (!loaded || !window.Html5Qrcode) {
      setScannerError('No se pudo cargar el escaner. Usa el modo Manual o Foto.');
      setScannerStatus('');
      return;
    }
    try {
      const scanner = new window.Html5Qrcode('qr-reader');
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (text) => { stopCamera(); handleLookup(text); },
        () => { /* ignore decode errors */ }
      );
      scannerRef.current = scanner;
      setCameraActive(true);
      setScannerStatus('Apunta al codigo de barras');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setScannerError('Camara no disponible: ' + msg + '. Usa Foto o Manual.');
      setScannerStatus('');
    }
  }, [stopCamera, handleLookup]);

  useEffect(() => {
    if (scannerMode !== 'camera') {
      stopCamera();
    }
  }, [scannerMode, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = manualEan.trim();
    if (!val) return;
    handleLookup(val);
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScannerStatus('Analizando imagen...');
    setLookupError('');

    // Try native BarcodeDetector first (Chrome/Android)
    const win = window as Window & {
      BarcodeDetector?: new (o: object) => { detect(s: ImageBitmapSource): Promise<Array<{rawValue: string}>> };
    };
    if (win.BarcodeDetector) {
      try {
        const bitmap = await createImageBitmap(file);
        const detector = new win.BarcodeDetector({ formats: ['ean_13','ean_8','upc_a','upc_e','code_128','code_39'] });
        const results = await detector.detect(bitmap);
        if (results[0]?.rawValue) {
          setScannerStatus('');
          if (photoInputRef.current) photoInputRef.current.value = '';
          handleLookup(results[0].rawValue);
          return;
        }
      } catch { /* fall through to ZXing */ }
    }

    // Load html5-qrcode for image scanning
    const loaded = await loadHtml5Qrcode();
    if (loaded && window.Html5Qrcode) {
      try {
        // Create a temporary hidden div for html5-qrcode file scan
        let div = document.getElementById('qr-photo-reader');
        if (!div) {
          div = document.createElement('div');
          div.id = 'qr-photo-reader';
          div.style.display = 'none';
          document.body.appendChild(div);
        }
        const scanner = new window.Html5Qrcode('qr-photo-reader');
        // html5-qrcode can scan files directly
        const scanFile = (scanner as unknown as { scanFile(f: File, showImage: boolean): Promise<string> }).scanFile;
        if (typeof scanFile === 'function') {
          const text = await scanFile.call(scanner, file, false);
          scanner.clear();
          setScannerStatus('');
          if (photoInputRef.current) photoInputRef.current.value = '';
          handleLookup(text);
          return;
        }
        scanner.clear();
      } catch { /* no barcode found */ }
    }

    setScannerStatus('');
    setScannerError('No se pudo leer el codigo. Intenta mas cerca o usa modo Manual para ingresarlo.');
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleSaveProduct = async () => {
    if (!name.trim()) { setSaveError('El nombre es obligatorio'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        name: name.trim(),
        slug: slugify(name.trim()),
        brand: brand.trim(),
        description: description.trim(),
        category_id: categoryId || null,
        image_url: imageUrl.trim() || null,
        price: price ? parseFloat(price) : 0,
        stock: 0,
        ean: ean || null,
        created_from_barcode: true,
      };
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { id?: string; product?: { id: string }; error?: string };
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setSavedProduct({ id: data.id || data.product?.id || '', name: name.trim() });
      setStep('saved');
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep('scan'); setLookupResult(null); setLookupError('');
    setManualEan(''); setEan('');
    setName(''); setBrand(''); setDescription(''); setImageUrl(''); setPrice('');
    setSavedProduct(null); setSaveError(''); setScannerError(''); setScannerStatus('');
    stopCamera();
  };

  const modeLabel = (m: typeof scannerMode) =>
    ({ camera: 'Camara', manual: 'Manual / USB', photo: 'Foto' })[m];

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/products')} className="text-gray-500 hover:text-gray-800">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nuevo producto desde codigo</h1>
          <p className="text-sm text-gray-500">Escanea o ingresa un EAN/UPC para autocompletar</p>
        </div>
      </div>

      {step === 'scan' && (
        <div className="space-y-4">
          {/* Mode selector */}
          <div className="flex gap-1.5">
            {(['camera','photo','manual'] as const).map(m => (
              <button
                key={m}
                onClick={() => setScannerMode(m)}
                className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
                  scannerMode === m
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {modeLabel(m)}
              </button>
            ))}
          </div>

          {/* Camera mode */}
          {scannerMode === 'camera' && (
            <div className="space-y-3">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg"
                >
                  Abrir camara
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold"
                >
                  Detener camara
                </button>
              )}
              {/* html5-qrcode renders into this div */}
              <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />
            </div>
          )}

          {/* Photo mode */}
          {scannerMode === 'photo' && (
            <div className="space-y-3">
              <label className="block w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg text-center cursor-pointer">
                Tomar foto del codigo
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
              </label>
              <p className="text-xs text-gray-500 text-center">
                Toma una foto clara del codigo de barras
              </p>
            </div>
          )}

          {/* Manual mode */}
          {scannerMode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Codigo EAN / UPC
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={manualEan}
                  onChange={e => setManualEan(e.target.value)}
                  placeholder="Ej: 809516800865"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!manualEan.trim() || lookupLoading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {lookupLoading ? 'Buscando...' : 'Buscar'}
              </button>
            </form>
          )}

          {/* Status / errors */}
          {scannerStatus && (
            <p className="text-sm text-blue-600 text-center">{scannerStatus}</p>
          )}
          {scannerError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">{scannerError}</p>
            </div>
          )}
          {lookupError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{lookupError}</p>
            </div>
          )}
          {lookupLoading && (
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-600">Consultando base de datos...</span>
            </div>
          )}
        </div>
      )}

      {step === 'review' && lookupResult && (
        <div className="space-y-4">
          {/* Status banner */}
          <div className={`rounded-lg p-3 ${
            lookupResult.found ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{lookupResult.found ? '✅' : '⚠️'}</span>
              <div>
                <p className="text-sm font-medium">
                  {lookupResult.found
                    ? 'Datos encontrados desde ' + lookupResult.source
                    : 'Producto no encontrado - completa los datos manualmente'}
                </p>
                <p className="text-xs text-gray-500">EAN: {lookupResult.ean}</p>
              </div>
            </div>
          </div>

          {/* Product image preview */}
          {imageUrl && (
            <div className="flex justify-center">
              <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                <Image src={imageUrl} alt="Producto" fill className="object-contain" unoptimized />
              </div>
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del producto" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input value={brand} onChange={e => setBrand(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Marca" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripcion del producto" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL imagen</label>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sin categoria</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{saveError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold">
              Cancelar
            </button>
            <button
              onClick={handleSaveProduct}
              disabled={saving || !name.trim()}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar producto'}
            </button>
          </div>
        </div>
      )}

        {step === 'saved' && (
          <div className="space-y-4">
            {/* Card estado */}
            <div className={`rounded-xl p-5 border text-center ${lookupResult?.existing_product ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="text-4xl mb-2">{lookupResult?.existing_product ? '✅' : '🎉'}</div>
              <h2 className={`text-lg font-bold mb-1 ${lookupResult?.existing_product ? 'text-green-800' : 'text-blue-800'}`}>
                {lookupResult?.existing_product ? 'Producto ya existe' : 'Producto guardado'}
              </h2>
              <p className={`text-sm font-semibold ${lookupResult?.existing_product ? 'text-green-700' : 'text-blue-700'}`}>
                {savedProduct?.name || '—'}
              </p>
            </div>
            {/* Detalle del producto */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {savedProduct?.image_url && (
                <div className="flex justify-center bg-gray-50 p-4 border-b border-gray-100">
                  <img src={savedProduct.image_url} alt={savedProduct.name || 'Producto'} className="h-32 w-32 object-contain rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <div className="divide-y divide-gray-100 text-sm">
                <div className="flex px-4 py-2.5 gap-3"><span className="text-gray-400 w-20 shrink-0">EAN</span><span className="font-mono text-gray-700 break-all">{lookupResult?.ean}</span></div>
                {savedProduct?.name && (<div className="flex px-4 py-2.5 gap-3"><span className="text-gray-400 w-20 shrink-0">Nombre</span><span className="font-medium text-gray-900">{savedProduct.name}</span></div>)}
                {(savedProduct as any)?.brand && (<div className="flex px-4 py-2.5 gap-3"><span className="text-gray-400 w-20 shrink-0">Marca</span><span className="text-gray-800">{(savedProduct as any).brand}</span></div>)}
                {(savedProduct as any)?.description && (<div className="flex px-4 py-2.5 gap-3"><span className="text-gray-400 w-20 shrink-0">Descripción</span><span className="text-gray-700">{(savedProduct as any).description}</span></div>)}
                {(savedProduct as any)?.category_name && (<div className="flex px-4 py-2.5 gap-3"><span className="text-gray-400 w-20 shrink-0">Categoría</span><span className="text-gray-800">{(savedProduct as any).category_name}</span></div>)}
                {(savedProduct as any)?.price && (<div className="flex px-4 py-2.5 gap-3"><span className="text-gray-400 w-20 shrink-0">Precio</span><span className="font-semibold">${(savedProduct as any).price?.toLocaleString('es-CL')}</span></div>)}
                {lookupResult?.source && lookupResult.source !== 'tenute' && (<div className="flex px-4 py-2.5 gap-3"><span className="text-gray-400 w-20 shrink-0">Fuente</span><span className="text-gray-400 italic text-xs">{lookupResult.source.replace(/_/g, ' ')}</span></div>)}
              </div>
            </div>
            {/* Acciones */}
            <div className="flex flex-col gap-2">
              {savedProduct?.id && (
                <button onClick={() => router.push('/admin/products/' + savedProduct!.id)} className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold">
                  {lookupResult?.existing_product ? '✏️ Editar producto' : '👁 Ver producto'}
                </button>
              )}
              <button onClick={reset} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold">Escanear otro</button>
            </div>
          </div>
        )}
    </div>
  );
}
