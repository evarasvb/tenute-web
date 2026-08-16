'use client';

import { useCallback, useRef, useState } from 'react';

// ============================================================
// Subidor masivo de fotos de productos
// ------------------------------------------------------------
// Flujo: se arrastran/seleccionan muchas fotos (nombres genericos IMG_xxxx).
// Para cada foto se busca el producto y se asigna. Al pulsar "Subir todas",
// cada foto se sube a Supabase Storage (por SKU) via /api/admin/upload y
// luego se enlaza al producto via /api/admin/images/replace. Solo la persona
// puede decir que foto es que producto, asi que la app resuelve todo lo demas.
// ============================================================

interface PickedProduct {
  id: string;
  name: string;
  sku: string;
  image_url?: string | null;
}

type RowStatus = 'idle' | 'uploading' | 'done' | 'error';

interface PhotoRow {
  id: string;
  file: File;
  previewUrl: string;
  product: PickedProduct | null;
  status: RowStatus;
  message: string;
}

function ProductPicker({
  selected,
  onSelect,
}: {
  selected: PickedProduct | null;
  onSelect: (p: PickedProduct | null) => void;
}) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<PickedProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((value: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/products?search=${encodeURIComponent(value)}&limit=8`
        );
        const data = await res.json();
        setResults((data.data || data.products || []) as PickedProduct[]);
        setOpen(true);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);
  }, []);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{selected.name}</p>
          <p className="text-xs text-gray-500">SKU: {selected.sku}</p>
        </div>
        <button
          onClick={() => onSelect(null)}
          className="flex-shrink-0 text-xs text-gray-500 underline hover:text-gray-800"
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          search(e.target.value);
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Buscar producto por nombre o SKU…"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {loading && (
        <span className="absolute right-3 top-2.5 text-xs text-gray-400">…</span>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => {
                  onSelect(p);
                  setOpen(false);
                  setTerm('');
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-blue-50"
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100 text-xs text-gray-400">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    '—'
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-gray-900">{p.name}</span>
                  <span className="block text-xs text-gray-500">SKU: {p.sku}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function BulkPhotosPage() {
  const [rows, setRows] = useState<PhotoRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next: PhotoRow[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        product: null,
        status: 'idle' as RowStatus,
        message: '',
      }));
    setRows((prev) => [...prev, ...next]);
  }

  function updateRow(id: string, patch: Partial<PhotoRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => {
      const row = prev.find((r) => r.id === id);
      if (row) URL.revokeObjectURL(row.previewUrl);
      return prev.filter((r) => r.id !== id);
    });
  }

  async function uploadOne(row: PhotoRow): Promise<void> {
    if (!row.product) return;
    updateRow(row.id, { status: 'uploading', message: '' });

    try {
      // 1) Subir el archivo a Storage (se guarda por SKU) -> devuelve URL publica
      const form = new FormData();
      form.append('file', row.file);
      form.append('sku', row.product.sku);
      const upRes = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error || 'Error subiendo la imagen');

      // 2) Enlazar la URL al producto
      const linkRes = await fetch('/api/admin/images/replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: row.product.id, newUrl: upData.url }),
      });
      const linkData = await linkRes.json();
      if (!linkRes.ok) throw new Error(linkData.error || 'Error enlazando la imagen');

      updateRow(row.id, { status: 'done', message: 'Subida y enlazada' });
    } catch (err) {
      updateRow(row.id, {
        status: 'error',
        message: err instanceof Error ? err.message : 'Error desconocido',
      });
    }
  }

  async function uploadAll() {
    setUploading(true);
    // Secuencial para no saturar el storage y ver progreso claro.
    for (const row of rows) {
      if (row.product && row.status !== 'done') {
        await uploadOne(row);
      }
    }
    setUploading(false);
  }

  const assignedCount = rows.filter((r) => r.product).length;
  const doneCount = rows.filter((r) => r.status === 'done').length;
  const pendingAssigned = rows.filter((r) => r.product && r.status !== 'done').length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Subir fotos en masa</h1>
        <p className="mt-1 text-sm text-gray-600">
          Arrastra o selecciona muchas fotos, asigna cada una a su producto y subelas
          todas de una vez. La foto se guarda por SKU y se enlaza automaticamente.
        </p>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInput.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-white px-6 py-10 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/40"
      >
        <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="mt-2 text-sm font-medium text-gray-700">
          Haz clic o arrastra tus fotos aqui
        </p>
        <p className="text-xs text-gray-400">JPG, PNG o WEBP · hasta 5MB c/u</p>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {rows.length > 0 && (
        <>
          {/* Barra de acciones */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="text-sm text-gray-600">
              {rows.length} foto{rows.length !== 1 ? 's' : ''} · {assignedCount} asignada
              {assignedCount !== 1 ? 's' : ''} · {doneCount} subida{doneCount !== 1 ? 's' : ''}
            </p>
            <button
              onClick={uploadAll}
              disabled={uploading || pendingAssigned === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading
                ? 'Subiendo…'
                : `Subir ${pendingAssigned} foto${pendingAssigned !== 1 ? 's' : ''}`}
            </button>
          </div>

          {/* Filas */}
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-center"
              >
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.previewUrl} alt={row.file.name} className="h-full w-full object-cover" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-gray-400">{row.file.name}</p>
                  <div className="mt-1">
                    <ProductPicker
                      selected={row.product}
                      onSelect={(p) => updateRow(row.id, { product: p, status: 'idle', message: '' })}
                    />
                  </div>
                  {row.message && (
                    <p
                      className={`mt-1 text-xs ${
                        row.status === 'error' ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {row.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-shrink-0 items-center gap-3 self-end sm:self-center">
                  {row.status === 'uploading' && (
                    <span className="text-xs text-blue-600">Subiendo…</span>
                  )}
                  {row.status === 'done' && (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Listo
                    </span>
                  )}
                  {row.status !== 'uploading' && row.status !== 'done' && (
                    <button
                      onClick={() => removeRow(row.id)}
                      className="text-xs text-gray-400 underline hover:text-red-500"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
