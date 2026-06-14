'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createBarcodeDetector } from '@/lib/barcode-detector';
import { normalizeBarcodeDigits, validateBarcode } from '@/lib/validators';

interface Category { id: string; name: string; }

interface SuggestedData {
  name: string;
  brand: string;
  description: string;
  category: string;
  image_url: string;
  price_ref: number | null;
}

interface LookupResult {
  ean: string;
  found: boolean;
  source: string;
  existing_product?: { id: string; name: string; slug: string; image_url: string | null };
  suggested?: SuggestedData;
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function NewFromBarcodePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: '', at: 0 });
  const manualInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'scan' | 'review' | 'saved'>('scan');
  const [scannerMode, setScannerMode] = useState<'camera' | 'manual'>('camera');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('');
  const [scannerError, setScannerError] = useState('');
  const [manualEan, setManualEan] = useState('');

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
    fetch('/api/admin/categories').then(r => r.json()).then(setCategories);
  }, []);

  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    scanLoopRef.current = null;
    streamRef.current = null;
    setScannerOpen(false);
    setScannerStatus('');
  }, []);

  const handleLookup = useCallback(async (code: string) => {
    const digits = normalizeBarcodeDigits(code);
    if (!digits) return;
    setEan(digits);
    setLookupLoading(true);
    setLookupError('');
    setScannerStatus('Buscando ' + digits + '...');
    try {
      const res = await fetch('/api/admin/barcode-lookup?ean=' + digits);
      const data: LookupResult = await res.json();
      setLookupResult(data);
      if (data.existing_product) {
        setStep('saved');
        setSavedProduct({ id: data.existing_product.id, name: data.existing_product.name });
      } else if (data.suggested) {
        setName(data.suggested.name);
        setBrand(data.suggested.brand);
        setDescription(data.suggested.description);
        setImageUrl(data.suggested.image_url);
        if (data.suggested.price_ref) setPrice(String(Math.round(data.suggested.price_ref)));
        setStep('review');
      } else {
        setName(''); setBrand(''); setDescription(''); setImageUrl('');
        setStep('review');
      }
    } catch {
      setLookupError('Error al buscar el codigo. Intenta nuevamente.');
    }
    setLookupLoading(false);
    setScannerStatus('');
  }, []);

  const startCamera = useCallback(async () => {
    setScannerError('');
    setScannerStatus('Iniciando camara...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScannerOpen(true);
      setScannerStatus('Apunta al codigo de barras');
      const detector = createBarcodeDetector();
      const loop = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          for (const b of barcodes) {
            const now = Date.now();
            const raw = normalizeBarcodeDigits(b.rawValue);
            if (raw === lastScanRef.current.code && now - lastScanRef.current.at < 3000) continue;
            if (!validateBarcode(raw)) continue;
            lastScanRef.current = { code: raw, at: now };
            stopCamera();
            handleLookup(raw);
            return;
          }
        } catch { /* ignore */ }
        scanLoopRef.current = requestAnimationFrame(loop);
      };
      scanLoopRef.current = requestAnimationFrame(loop);
    } catch {
      setScannerError('No se pudo acceder a la camara. Usa el modo manual.');
      setScannerStatus('');
      setScannerMode('manual');
    }
  }, [stopCamera, handleLookup]);

  useEffect(() => {
    if (scannerMode === 'camera' && step === 'scan') startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [scannerMode, step, startCamera, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = normalizeBarcodeDigits(manualEan);
    if (!digits) return;
    handleLookup(digits);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setSaveError('El nombre es requerido'); return; }
    setSaving(true);
    setSaveError('');
    const slug = slugify(name) + '-' + Date.now().toString(36);
    const payload = {
      name: name.trim(), slug,
      brand: brand.trim(),
      description: description.trim(),
      image_url: imageUrl.trim() || null,
      price: parseFloat(price) || 0,
      ean: ean || null,
      category_id: categoryId || null,
      active: true, stock: 0,
    };
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setSavedProduct({ id: data.id || data.product?.id, name });
      setStep('saved');
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar');
    }
    setSaving(false);
  };

  const reset = () => {
    setStep('scan'); setLookupResult(null); setLookupError('');
    setManualEan(''); setEan('');
    setName(''); setBrand(''); setDescription(''); setImageUrl(''); setPrice(''); setCategoryId('');
    setSavedProduct(null); setSaveError('');
  };

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
          <div className="flex gap-2">
            <button onClick={() => setScannerMode('camera')}
              className={'flex-1 py-2 rounded-lg text-sm font-medium border transition ' + (scannerMode === 'camera' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400')}>
              Camara
            </button>
            <button onClick={() => { setScannerMode('manual'); stopCamera(); }}
              className={'flex-1 py-2 rounded-lg text-sm font-medium border transition ' + (scannerMode === 'manual' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400')}>
              Manual / Pistola USB
            </button>
          </div>

          {scannerMode === 'camera' && (
            <div className="rounded-xl overflow-hidden bg-black relative aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-yellow-400 rounded-lg w-3/4 h-16 opacity-70" />
              </div>
              {scannerStatus && (
                <div className="absolute bottom-2 inset-x-0 flex justify-center">
                  <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full">{scannerStatus}</span>
                </div>
              )}
            </div>
          )}
          {scannerError && <p className="text-sm text-red-600">{scannerError}</p>}

          {scannerMode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                ref={manualInputRef}
                type="text" inputMode="numeric" value={manualEan}
                onChange={e => setManualEan(e.target.value)}
                placeholder="Escanea o escribe el EAN/UPC..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button type="submit" disabled={!manualEan.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700">
                Buscar
              </button>
            </form>
          )}

          {lookupLoading && (
            <div className="flex items-center gap-2 text-sm text-blue-600 animate-pulse">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Consultando bases de datos...
            </div>
          )}
          {lookupError && <p className="text-sm text-red-600">{lookupError}</p>}
        </div>
      )}

      {step === 'review' && (
        <form onSubmit={handleSave} className="space-y-4">
          {lookupResult && (
            <div className={'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ' + (lookupResult.found ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
              {lookupResult.found ? 'Encontrado en ' + lookupResult.source : 'No encontrado: rellena manualmente'}
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
              Volver a escanear
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
          {lookupResult?.existing_product ? (
            <div>
              <p className="font-semibold text-gray-900">Este producto ya existe</p>
              <p className="text-sm text-gray-500 mt-1">{savedProduct.name}</p>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-gray-900">Producto guardado</p>
              <p className="text-sm text-gray-500 mt-1">{savedProduct.name}</p>
            </div>
          )}
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
