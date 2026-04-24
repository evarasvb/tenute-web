'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type TabKey = 'general' | 'premios' | 'media' | 'bases' | 'sorteo' | 'participantes';
type DrawMethod = 'random_seed' | 'manual' | 'external';
type RaffleStatus = 'draft' | 'published' | 'closed';
type MediaKind = 'image' | 'video';

interface ProductOption {
  id: string;
  name: string;
  sku: string | null;
  image_url: string | null;
}

interface PrizeRow {
  id: string;
  raffle_id: string;
  product_id: string | null;
  position: number;
  title: string;
  description: string | null;
  declared_value: number | null;
  quantity: number;
  reserve_stock: boolean;
  created_at: string;
  product?: ProductOption | null;
}

interface MediaRow {
  id: string;
  raffle_id: string;
  prize_id: string | null;
  kind: MediaKind;
  url: string;
  alt: string | null;
  sort_order: number;
  created_at: string;
}

interface DrawRow {
  id: string;
  raffle_id: string;
  seed: string | null;
  method: string | null;
  winner_entry_id: string | null;
  executed_at: string | null;
  executed_by: string | null;
}

interface EntryRow {
  id: string;
  raffle_id: string;
  order_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  created_at: string;
  order?: {
    order_number: string | null;
    status: string | null;
    payment_status: string | null;
  } | null;
}

interface RaffleDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  hero_image_url: string | null;
  promo_headline: string | null;
  hashtag: string | null;
  draw_method: DrawMethod;
  draw_date: string | null;
  draw_place: string | null;
  min_sold_to_draw: number;
  status: RaffleStatus;
  terms_md: string | null;
  winner_entry_id: string | null;
  created_at: string;
  raffle_prizes: PrizeRow[];
  raffle_media: MediaRow[];
  raffle_draws: DrawRow[];
}

interface RafflePageProps {
  params: { id: string };
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'premios', label: 'Premios' },
  { key: 'media', label: 'Media' },
  { key: 'bases', label: 'Bases' },
  { key: 'sorteo', label: 'Sorteo' },
  { key: 'participantes', label: 'Participantes' },
];

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function formatDate(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
}

function toDatetimeLocal(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMinutes = date.getTimezoneOffset();
  const corrected = new Date(date.getTime() - offsetMinutes * 60000);
  return corrected.toISOString().slice(0, 16);
}

export default function AdminRaffleDetailPage({ params }: RafflePageProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [raffle, setRaffle] = useState<RaffleDetail | null>(null);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [entriesSummary, setEntriesSummary] = useState<{ total: number; with_order: number; without_order: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingTerms, setSavingTerms] = useState(false);
  const [creatingPrize, setCreatingPrize] = useState(false);
  const [creatingMedia, setCreatingMedia] = useState(false);
  const [runningDraw, setRunningDraw] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [generalForm, setGeneralForm] = useState({
    title: '',
    slug: '',
    description: '',
    hero_image_url: '',
    promo_headline: '',
    hashtag: '',
    draw_method: 'random_seed' as DrawMethod,
    draw_date: '',
    draw_place: '',
    min_sold_to_draw: 0,
    status: 'draft' as RaffleStatus,
  });

  const [termsForm, setTermsForm] = useState('');

  const [prizeForm, setPrizeForm] = useState({
    productSearch: '',
    product_id: '',
    title: '',
    description: '',
    position: 1,
    declared_value: 0,
    quantity: 1,
    reserve_stock: false,
  });
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  const [mediaForm, setMediaForm] = useState({
    prize_id: '',
    kind: 'image' as MediaKind,
    url: '',
    alt: '',
    sort_order: 0,
  });

  const [drawSeed, setDrawSeed] = useState('');

  const loadRaffle = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/admin/rifas/${params.id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudo cargar la rifa');
      setLoading(false);
      return;
    }

    const mapped: RaffleDetail = {
      ...data,
      raffle_prizes: data.raffle_prizes || [],
      raffle_media: data.raffle_media || [],
      raffle_draws: data.raffle_draws || [],
    };
    setRaffle(mapped);
    setGeneralForm({
      title: mapped.title || '',
      slug: mapped.slug || '',
      description: mapped.description || '',
      hero_image_url: mapped.hero_image_url || '',
      promo_headline: mapped.promo_headline || '',
      hashtag: mapped.hashtag || '',
      draw_method: mapped.draw_method || 'random_seed',
      draw_date: toDatetimeLocal(mapped.draw_date),
      draw_place: mapped.draw_place || '',
      min_sold_to_draw: mapped.min_sold_to_draw || 0,
      status: mapped.status || 'draft',
    });
    setTermsForm(mapped.terms_md || '');
    setPrizeForm((prev) => ({
      ...prev,
      position: Math.max(1, ...(mapped.raffle_prizes || []).map((prize) => Number(prize.position || 1))) + 1,
    }));
    setLoading(false);
  }, [params.id]);

  const loadEntries = useCallback(async () => {
    const res = await fetch(`/api/admin/rifas/${params.id}/entries`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudieron cargar los participantes');
      return;
    }
    setEntries(data.data || []);
    setEntriesSummary(data.summary || null);
  }, [params.id]);

  useEffect(() => {
    loadRaffle();
  }, [loadRaffle]);

  useEffect(() => {
    if (activeTab === 'participantes') {
      loadEntries();
    }
  }, [activeTab, loadEntries]);

  useEffect(() => {
    const query = prizeForm.productSearch.trim();
    if (query.length < 2) {
      setProductOptions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const paramsQuery = new URLSearchParams({ search: query, limit: '8', page: '1' });
        const res = await fetch(`/api/admin/products?${paramsQuery.toString()}`, { signal: controller.signal });
        const data = await res.json();
        if (res.ok) {
          const options = (data.data || []).map((product: ProductOption) => ({
            id: product.id,
            name: product.name,
            sku: product.sku || null,
            image_url: product.image_url || null,
          }));
          setProductOptions(options);
        }
      } catch {
        // Ignore aborted searches
      } finally {
        setSearchingProducts(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [prizeForm.productSearch]);

  const prizesById = useMemo(() => {
    const map = new Map<string, PrizeRow>();
    (raffle?.raffle_prizes || []).forEach((prize) => map.set(prize.id, prize));
    return map;
  }, [raffle]);

  async function saveGeneral() {
    if (!raffle) return;
    setSavingGeneral(true);
    setError('');
    setMessage('');
    const payload = {
      ...generalForm,
      slug: slugify(generalForm.slug || generalForm.title),
      draw_date: generalForm.draw_date || null,
    };
    const res = await fetch(`/api/admin/rifas/${raffle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudo guardar la rifa');
      setSavingGeneral(false);
      return;
    }
    setMessage('General actualizado');
    await loadRaffle();
    setSavingGeneral(false);
  }

  async function saveTerms() {
    if (!raffle) return;
    setSavingTerms(true);
    setError('');
    setMessage('');
    const res = await fetch(`/api/admin/rifas/${raffle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terms_md: termsForm }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudieron guardar las bases');
      setSavingTerms(false);
      return;
    }
    setMessage('Bases guardadas');
    await loadRaffle();
    setSavingTerms(false);
  }

  async function createPrize(e: React.FormEvent) {
    e.preventDefault();
    if (!raffle) return;
    setCreatingPrize(true);
    setError('');
    setMessage('');
    const payload = {
      product_id: prizeForm.product_id || null,
      title: prizeForm.title,
      description: prizeForm.description || null,
      position: Number(prizeForm.position) || 1,
      declared_value: Number(prizeForm.declared_value) || 0,
      quantity: Number(prizeForm.quantity) || 1,
      reserve_stock: prizeForm.reserve_stock,
    };

    const res = await fetch(`/api/admin/rifas/${raffle.id}/prizes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudo crear el premio');
      setCreatingPrize(false);
      return;
    }
    setMessage('Premio agregado');
    setPrizeForm({
      productSearch: '',
      product_id: '',
      title: '',
      description: '',
      position: Number(prizeForm.position) + 1,
      declared_value: 0,
      quantity: 1,
      reserve_stock: false,
    });
    setProductOptions([]);
    await loadRaffle();
    setCreatingPrize(false);
  }

  async function updatePrize(prizeId: string, patch: Record<string, unknown>) {
    if (!raffle) return;
    setError('');
    setMessage('');
    const res = await fetch(`/api/admin/rifas/${raffle.id}/prizes/${prizeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudo actualizar el premio');
      return;
    }
    setMessage('Premio actualizado');
    await loadRaffle();
  }

  async function removePrize(prizeId: string) {
    if (!raffle) return;
    if (!confirm('¿Eliminar este premio?')) return;
    const res = await fetch(`/api/admin/rifas/${raffle.id}/prizes/${prizeId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudo eliminar el premio');
      return;
    }
    setMessage('Premio eliminado');
    await loadRaffle();
  }

  async function uploadMediaFile(file: File) {
    if (!raffle) return;
    setUploadingFile(true);
    setError('');
    setMessage('');
    try {
      const signedRes = await fetch(`/api/admin/rifas/${raffle.id}/media/signed-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          kind: mediaForm.kind,
        }),
      });
      const signedData = await signedRes.json();
      if (!signedRes.ok) {
        setError(signedData.error || 'No se pudo generar URL firmada');
        setUploadingFile(false);
        return;
      }

      const uploadRes = await fetch(signedData.signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });
      if (!uploadRes.ok) {
        setError('No se pudo subir el archivo al bucket');
        setUploadingFile(false);
        return;
      }

      setMediaForm((prev) => ({ ...prev, url: signedData.publicUrl || prev.url }));
      setMessage('Archivo subido. Ahora guarda el registro de media.');
    } catch {
      setError('Falló la subida de archivo');
    } finally {
      setUploadingFile(false);
    }
  }

  async function createMedia(e: React.FormEvent) {
    e.preventDefault();
    if (!raffle) return;
    setCreatingMedia(true);
    setError('');
    setMessage('');
    const payload = {
      prize_id: mediaForm.prize_id || null,
      kind: mediaForm.kind,
      url: mediaForm.url,
      alt: mediaForm.alt || null,
      sort_order: Number(mediaForm.sort_order) || 0,
    };
    const res = await fetch(`/api/admin/rifas/${raffle.id}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudo guardar el media');
      setCreatingMedia(false);
      return;
    }
    setMediaForm({
      prize_id: '',
      kind: 'image',
      url: '',
      alt: '',
      sort_order: Number(mediaForm.sort_order) + 1,
    });
    setMessage('Media agregado');
    await loadRaffle();
    setCreatingMedia(false);
  }

  async function removeMedia(mediaId: string) {
    if (!raffle) return;
    if (!confirm('¿Eliminar este media?')) return;
    const res = await fetch(`/api/admin/rifas/${raffle.id}/media?id=${encodeURIComponent(mediaId)}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudo eliminar media');
      return;
    }
    setMessage('Media eliminado');
    await loadRaffle();
  }

  async function runDraw() {
    if (!raffle) return;
    if (!confirm('¿Ejecutar el sorteo ahora?')) return;
    setRunningDraw(true);
    setError('');
    setMessage('');
    const res = await fetch(`/api/admin/rifas/${raffle.id}/draw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed: drawSeed || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudo ejecutar el sorteo');
      setRunningDraw(false);
      return;
    }
    setMessage('Sorteo ejecutado correctamente');
    await loadRaffle();
    await loadEntries();
    setRunningDraw(false);
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        Cargando rifa...
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error || 'No se encontró la rifa'}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{raffle.title}</h2>
          <p className="text-sm text-gray-500 font-mono">/{raffle.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/rifas"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Volver al listado
          </Link>
          <Link
            href={`/rifas/${raffle.slug}`}
            target="_blank"
            className="px-3 py-2 text-sm border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50"
          >
            Ver pública
          </Link>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Título</label>
                  <input
                    value={generalForm.title}
                    onChange={(e) =>
                      setGeneralForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                        slug: prev.slug || slugify(e.target.value),
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
                  <input
                    value={generalForm.slug}
                    onChange={(e) => setGeneralForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={generalForm.description}
                  onChange={(e) => setGeneralForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hero image URL</label>
                  <input
                    value={generalForm.hero_image_url}
                    onChange={(e) => setGeneralForm((prev) => ({ ...prev, hero_image_url: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Promo headline</label>
                  <input
                    value={generalForm.promo_headline}
                    onChange={(e) => setGeneralForm((prev) => ({ ...prev, promo_headline: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hashtag</label>
                  <input
                    value={generalForm.hashtag}
                    onChange={(e) => setGeneralForm((prev) => ({ ...prev, hashtag: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="#RifaTenute"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Draw method</label>
                  <select
                    value={generalForm.draw_method}
                    onChange={(e) =>
                      setGeneralForm((prev) => ({ ...prev, draw_method: e.target.value as DrawMethod }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="random_seed">random_seed</option>
                    <option value="manual">manual</option>
                    <option value="external">external</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                  <select
                    value={generalForm.status}
                    onChange={(e) => setGeneralForm((prev) => ({ ...prev, status: e.target.value as RaffleStatus }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                    <option value="closed">closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min sold to draw</label>
                  <input
                    type="number"
                    min={0}
                    value={generalForm.min_sold_to_draw}
                    onChange={(e) =>
                      setGeneralForm((prev) => ({ ...prev, min_sold_to_draw: Math.max(0, Number(e.target.value) || 0) }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha del sorteo</label>
                  <input
                    type="datetime-local"
                    value={generalForm.draw_date}
                    onChange={(e) => setGeneralForm((prev) => ({ ...prev, draw_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Lugar del sorteo</label>
                  <input
                    value={generalForm.draw_place}
                    onChange={(e) => setGeneralForm((prev) => ({ ...prev, draw_place: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={savingGeneral}
                onClick={saveGeneral}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {savingGeneral ? 'Guardando...' : 'Guardar general'}
              </button>
            </div>
          )}

          {activeTab === 'premios' && (
            <div className="space-y-5">
              <form onSubmit={createPrize} className="rounded-lg border border-gray-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Agregar premio</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Buscar producto (autocomplete)</label>
                  <input
                    value={prizeForm.productSearch}
                    onChange={(e) => setPrizeForm((prev) => ({ ...prev, productSearch: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Nombre o SKU"
                  />
                  {searchingProducts && <p className="text-xs text-gray-400 mt-1">Buscando productos...</p>}
                  {productOptions.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                      {productOptions.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() =>
                            setPrizeForm((prev) => ({
                              ...prev,
                              product_id: product.id,
                              title: prev.title || product.name,
                              productSearch: `${product.name}${product.sku ? ` (${product.sku})` : ''}`,
                            }))
                          }
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          {product.name}
                          {product.sku ? <span className="text-gray-500 ml-2 font-mono text-xs">{product.sku}</span> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={prizeForm.title}
                    onChange={(e) => setPrizeForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Título del premio"
                    required
                  />
                  <input
                    value={prizeForm.description}
                    onChange={(e) => setPrizeForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Descripción"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <input
                    type="number"
                    min={1}
                    value={prizeForm.position}
                    onChange={(e) => setPrizeForm((prev) => ({ ...prev, position: Math.max(1, Number(e.target.value) || 1) }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Posición"
                  />
                  <input
                    type="number"
                    min={0}
                    value={prizeForm.declared_value}
                    onChange={(e) =>
                      setPrizeForm((prev) => ({ ...prev, declared_value: Math.max(0, Number(e.target.value) || 0) }))
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Valor declarado"
                  />
                  <input
                    type="number"
                    min={1}
                    value={prizeForm.quantity}
                    onChange={(e) => setPrizeForm((prev) => ({ ...prev, quantity: Math.max(1, Number(e.target.value) || 1) }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Cantidad"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={prizeForm.reserve_stock}
                      onChange={(e) => setPrizeForm((prev) => ({ ...prev, reserve_stock: e.target.checked }))}
                    />
                    Reservar stock
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={creatingPrize}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  {creatingPrize ? 'Creando...' : 'Agregar premio'}
                </button>
              </form>

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Pos</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Premio</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Producto</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Valor</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raffle.raffle_prizes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                          Sin premios aún
                        </td>
                      </tr>
                    ) : (
                      raffle.raffle_prizes.map((prize) => (
                        <tr key={prize.id} className="border-b border-gray-100">
                          <td className="px-3 py-2">{prize.position}</td>
                          <td className="px-3 py-2">
                            <p className="font-medium text-gray-900">{prize.title}</p>
                            {prize.description ? <p className="text-xs text-gray-500">{prize.description}</p> : null}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {prize.product ? `${prize.product.name}${prize.product.sku ? ` (${prize.product.sku})` : ''}` : '-'}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">
                            ${(Number(prize.declared_value || 0) || 0).toLocaleString('es-CL')}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">{prize.quantity}</td>
                          <td className="px-3 py-2 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => updatePrize(prize.id, { position: Math.max(1, prize.position - 1) })}
                              className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
                              title="Subir posición"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => updatePrize(prize.id, { position: prize.position + 1 })}
                              className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
                              title="Bajar posición"
                            >
                              ▼
                            </button>
                            <button
                              type="button"
                              onClick={() => removePrize(prize.id)}
                              className="px-2 py-1 border border-red-200 text-red-700 rounded text-xs hover:bg-red-50"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-5">
              <form onSubmit={createMedia} className="rounded-lg border border-gray-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Agregar media</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    value={mediaForm.kind}
                    onChange={(e) => setMediaForm((prev) => ({ ...prev, kind: e.target.value as MediaKind }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="image">image</option>
                    <option value="video">video</option>
                  </select>
                  <select
                    value={mediaForm.prize_id}
                    onChange={(e) => setMediaForm((prev) => ({ ...prev, prize_id: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Sin premio asociado</option>
                    {raffle.raffle_prizes.map((prize) => (
                      <option key={prize.id} value={prize.id}>
                        #{prize.position} · {prize.title}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={mediaForm.sort_order}
                    onChange={(e) => setMediaForm((prev) => ({ ...prev, sort_order: Math.max(0, Number(e.target.value) || 0) }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="sort_order"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={mediaForm.url}
                    onChange={(e) => setMediaForm((prev) => ({ ...prev, url: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="URL pública"
                    required
                  />
                  <input
                    value={mediaForm.alt}
                    onChange={(e) => setMediaForm((prev) => ({ ...prev, alt: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Texto alternativo"
                  />
                </div>

                <div className="rounded-lg border border-dashed border-gray-300 p-3">
                  <p className="text-xs text-gray-500 mb-2">Upload a bucket `raffle-media` vía signed URL</p>
                  <input
                    type="file"
                    accept={mediaForm.kind === 'video' ? 'video/*' : 'image/*'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        uploadMediaFile(file);
                      }
                    }}
                    className="block w-full text-sm text-gray-600"
                  />
                  {uploadingFile && <p className="text-xs text-blue-600 mt-2">Subiendo archivo...</p>}
                </div>

                <button
                  type="submit"
                  disabled={creatingMedia}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  {creatingMedia ? 'Guardando...' : 'Guardar media'}
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {raffle.raffle_media.length === 0 ? (
                  <div className="text-sm text-gray-400">Sin media cargado aún</div>
                ) : (
                  raffle.raffle_media
                    .slice()
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((media) => (
                      <article key={media.id} className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                        <div className="aspect-video bg-gray-100 relative">
                          {media.kind === 'image' ? (
                            <Image src={media.url} alt={media.alt || 'media'} fill unoptimized className="object-cover" />
                          ) : (
                            <video src={media.url} controls className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="p-3 space-y-1">
                          <p className="text-xs text-gray-500">
                            {media.kind} · sort {media.sort_order}
                          </p>
                          <p className="text-xs text-gray-700 truncate">{media.alt || 'Sin alt'}</p>
                          {media.prize_id ? (
                            <p className="text-xs text-gray-500">
                              Premio: {prizesById.get(media.prize_id)?.title || media.prize_id}
                            </p>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => removeMedia(media.id)}
                            className="mt-2 px-2 py-1 border border-red-200 text-red-700 rounded text-xs hover:bg-red-50"
                          >
                            Eliminar
                          </button>
                        </div>
                      </article>
                    ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'bases' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Guarda markdown en `terms_md`. Largo actual: {termsForm.length} caracteres.
              </p>
              <textarea
                rows={20}
                value={termsForm}
                onChange={(e) => setTermsForm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                placeholder="## Bases del sorteo..."
              />
              <button
                type="button"
                onClick={saveTerms}
                disabled={savingTerms}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {savingTerms ? 'Guardando...' : 'Guardar bases'}
              </button>
            </div>
          )}

          {activeTab === 'sorteo' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Ejecutar RPC `execute_raffle_draw`</h3>
                <p className="text-xs text-gray-500">
                  Método configurado: <strong>{raffle.draw_method}</strong> · Ganador actual:{' '}
                  <strong>{raffle.winner_entry_id || 'Sin ganador'}</strong>
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <input
                    value={drawSeed}
                    onChange={(e) => setDrawSeed(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Seed opcional"
                  />
                  <button
                    type="button"
                    onClick={runDraw}
                    disabled={runningDraw}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {runningDraw ? 'Ejecutando...' : 'Ejecutar sorteo'}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Fecha</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Método</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Seed</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Winner entry</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Ejecutado por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raffle.raffle_draws.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                          Aún no hay ejecuciones de sorteo
                        </td>
                      </tr>
                    ) : (
                      raffle.raffle_draws
                        .slice()
                        .sort((a, b) => (a.executed_at || '').localeCompare(b.executed_at || ''))
                        .reverse()
                        .map((draw) => (
                          <tr key={draw.id} className="border-b border-gray-100">
                            <td className="px-3 py-2">{formatDate(draw.executed_at)}</td>
                            <td className="px-3 py-2">{draw.method || '-'}</td>
                            <td className="px-3 py-2 font-mono text-xs">{draw.seed || '-'}</td>
                            <td className="px-3 py-2 font-mono text-xs">{draw.winner_entry_id || '-'}</td>
                            <td className="px-3 py-2">{draw.executed_by || '-'}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'participantes' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Total: <strong>{entriesSummary?.total ?? entries.length}</strong> · Con order:{' '}
                  <strong>{entriesSummary?.with_order ?? entries.filter((entry) => entry.order).length}</strong> · Sin order:{' '}
                  <strong>{entriesSummary?.without_order ?? entries.filter((entry) => !entry.order).length}</strong>
                </div>
                <button
                  type="button"
                  onClick={loadEntries}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Refrescar
                </button>
              </div>

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Cliente</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Contacto</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Order</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Estado order</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                          Sin participantes aún
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => (
                        <tr key={entry.id} className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-800">{entry.customer_name}</td>
                          <td className="px-3 py-2 text-xs text-gray-600">
                            <div>{entry.customer_email || '-'}</div>
                            <div>{entry.customer_phone || '-'}</div>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">{entry.order?.order_number || entry.order_id || '-'}</td>
                          <td className="px-3 py-2 text-xs text-gray-600">
                            {entry.order?.status || '-'}
                            {entry.order?.payment_status ? ` / ${entry.order.payment_status}` : ''}
                          </td>
                          <td className="px-3 py-2">{formatDate(entry.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
