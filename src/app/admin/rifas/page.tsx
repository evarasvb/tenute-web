'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

interface Raffle {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  hero_image_url: string | null;
  social_hashtag: string | null;
  draw_place: string | null;
  draw_date: string | null;
  number_price: number;
  total_numbers: number;
  available_numbers: number;
  status: 'draft' | 'published';
  featured_products: string[] | null;
  winner_number?: number | null;
  winner_customer_name?: string | null;
  winner_announced_at?: string | null;
  created_at: string;
}

interface RaffleEntry {
  id: string;
  raffle_id: string;
  number: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled' | 'expired';
  reservation_code: string;
  created_at: string;
}

interface InventoryProduct {
  id: string;
  name: string;
  sku: string | null;
  image_url: string | null;
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  description: '',
  hero_image_url: '',
  social_hashtag: '',
  draw_place: '',
  draw_date: '',
  number_price: 1000,
  total_numbers: 100,
  available_numbers: 100,
  status: 'draft',
  featured_products_text: '',
};

type RaffleFormState = typeof EMPTY_FORM;

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function AdminRifasPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [entriesOpenFor, setEntriesOpenFor] = useState<string | null>(null);
  const [entries, setEntries] = useState<RaffleEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [drawingFor, setDrawingFor] = useState<string | null>(null);
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');

  const soldNumbers = useMemo(
    () => Math.max(0, Number(form.total_numbers || 0) - Number(form.available_numbers || 0)),
    [form.total_numbers, form.available_numbers]
  );

  async function loadRaffles() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/rifas');
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudieron cargar las rifas');
      setLoading(false);
      return;
    }
    setRaffles(data.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadRaffles();
  }, []);

  useEffect(() => {
    fetch('/api/admin/products?limit=400&page=1&active=true')
      .then((res) => res.json())
      .then((data) => {
        setInventoryProducts(data.data || data.products || []);
      })
      .catch(() => {
        setInventoryProducts([]);
      });
  }, []);

  const selectedFeaturedProducts = useMemo(() => {
    const names = form.featured_products_text
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);
    const selectedByName = new Set(names.map((x) => x.toLowerCase()));
    return inventoryProducts.filter((product) => selectedByName.has(product.name.toLowerCase()));
  }, [form.featured_products_text, inventoryProducts]);

  const filteredInventoryProducts = useMemo(() => {
    const selectedNames = new Set(
      form.featured_products_text
        .split('\n')
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
    );
    const q = inventorySearch.trim().toLowerCase();
    return inventoryProducts
      .filter((product) => {
        if (selectedNames.has(product.name.toLowerCase())) return false;
        if (!q) return true;
        return (
          product.name.toLowerCase().includes(q) ||
          (product.sku || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 25);
  }, [form.featured_products_text, inventoryProducts, inventorySearch]);

  function setFormField<K extends keyof RaffleFormState>(field: K, value: RaffleFormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addFeaturedProductFromInventory(product: InventoryProduct) {
    const current = form.featured_products_text
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);
    if (current.some((entry) => entry.toLowerCase() === product.name.toLowerCase())) return;
    const next = [...current, product.name];
    setFormField('featured_products_text', next.join('\n'));
    if (!form.hero_image_url && product.image_url) {
      setFormField('hero_image_url', product.image_url);
    }
  }

  function removeFeaturedProduct(name: string) {
    const next = form.featured_products_text
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean)
      .filter((entry) => entry.toLowerCase() !== name.toLowerCase());
    setFormField('featured_products_text', next.join('\n'));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function startEdit(raffle: Raffle) {
    setEditingId(raffle.id);
    setForm({
      title: raffle.title || '',
      slug: raffle.slug || '',
      description: raffle.description || '',
      hero_image_url: raffle.hero_image_url || '',
      social_hashtag: raffle.social_hashtag || '',
      draw_place: raffle.draw_place || '',
      draw_date: raffle.draw_date ? String(raffle.draw_date).slice(0, 16) : '',
      number_price: raffle.number_price || 1000,
      total_numbers: raffle.total_numbers || 100,
      available_numbers: raffle.available_numbers || 0,
      status: raffle.status || 'draft',
      featured_products_text: Array.isArray(raffle.featured_products) ? raffle.featured_products.join('\n') : '',
    });
    setMessage('');
    setError('');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const payload = {
      ...form,
      featured_products: form.featured_products_text
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean),
      slug: form.slug ? slugify(form.slug) : slugify(form.title),
    };

    const url = editingId ? `/api/admin/rifas/${editingId}` : '/api/admin/rifas';
    const method = editingId ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'No se pudo guardar la rifa');
      setSaving(false);
      return;
    }

    setMessage(editingId ? 'Rifa actualizada' : 'Rifa creada');
    resetForm();
    await loadRaffles();
    setSaving(false);
  }

  async function removeRaffle(id: string) {
    if (!confirm('¿Eliminar esta rifa?')) return;
    setError('');
    setMessage('');
    const res = await fetch(`/api/admin/rifas/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudo eliminar');
      return;
    }
    setMessage('Rifa eliminada');
    loadRaffles();
  }

  async function loadEntries(raffleId: string) {
    setEntriesOpenFor(raffleId);
    setEntriesLoading(true);
    const res = await fetch(`/api/admin/rifas/${raffleId}/entries`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudieron cargar participantes');
      setEntries([]);
      setEntriesLoading(false);
      return;
    }
    setEntries(data.data || []);
    setEntriesLoading(false);
  }

  async function runDraw(raffleId: string) {
    if (!confirm('¿Sortear ganador ahora? Solo usa números pagados.')) return;
    setDrawingFor(raffleId);
    setError('');
    setMessage('');
    const res = await fetch(`/api/admin/rifas/${raffleId}/draw`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudo sortear');
      setDrawingFor(null);
      return;
    }
    const winner = data.winner;
    setMessage(`Ganador: #${String(winner.number).padStart(3, '0')} - ${winner.customer_name}`);
    await loadRaffles();
    await loadEntries(raffleId);
    setDrawingFor(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Rifas online</h2>
        <p className="text-sm text-gray-500 mt-1">Configura sorteos, productos y difusión en redes sociales.</p>
      </div>

      {message && <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">{message}</div>}
      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      <form onSubmit={onSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{editingId ? 'Editar rifa' : 'Nueva rifa'}</h3>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar edición
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Título</label>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value, slug: prev.slug || slugify(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Rifa iPhone + Gift Box"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="rifa-iphone-gift-box"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Imagen principal (URL)</label>
            <input
              value={form.hero_image_url}
              onChange={(e) => setForm((prev) => ({ ...prev, hero_image_url: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hashtag social</label>
            <input
              value={form.social_hashtag}
              onChange={(e) => setForm((prev) => ({ ...prev, social_hashtag: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="#RifaTenute"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Explica el premio, dinámica y condiciones..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lugar del sorteo</label>
            <input
              value={form.draw_place}
              onChange={(e) => setForm((prev) => ({ ...prev, draw_place: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Instagram Live + Local 21"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha/hora sorteo</label>
            <input
              type="datetime-local"
              value={form.draw_date}
              onChange={(e) => setForm((prev) => ({ ...prev, draw_date: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicada</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Precio por número (CLP)</label>
            <input
              type="number"
              min={100}
              value={form.number_price}
              onChange={(e) => setForm((prev) => ({ ...prev, number_price: Number(e.target.value) || 0 }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Total de números</label>
            <input
              type="number"
              min={1}
              value={form.total_numbers}
              onChange={(e) => setForm((prev) => ({ ...prev, total_numbers: Number(e.target.value) || 0 }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Números disponibles</label>
            <input
              type="number"
              min={0}
              value={form.available_numbers}
              onChange={(e) => setForm((prev) => ({ ...prev, available_numbers: Number(e.target.value) || 0 }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Números vendidos</label>
            <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700">
              {soldNumbers}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Productos de la rifa (uno por línea)</label>
          <textarea
            rows={4}
            value={form.featured_products_text}
            onChange={(e) => setForm((prev) => ({ ...prev, featured_products_text: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder={'iPhone 15 Pro Max\nAirPods Pro\nGift Box de papelería premium'}
          />
          <p className="text-xs text-gray-500 mt-2">
            Puedes escribir manualmente o elegir productos desde inventario para usar su foto automáticamente.
          </p>
          <div className="mt-3 border border-gray-200 rounded-xl p-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                placeholder="Buscar en inventario por nombre o SKU..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <div className="text-xs text-gray-500 flex items-center">
                Seleccionados desde inventario: {selectedFeaturedProducts.length}
              </div>
            </div>
            {selectedFeaturedProducts.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Productos seleccionados</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedFeaturedProducts.map((product) => (
                    <div key={`selected-${product.id}`} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={40}
                          height={40}
                          unoptimized
                          className="w-10 h-10 rounded object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-200" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sku || 'Sin SKU'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFeaturedProduct(product.name)}
                        className="text-xs px-2 py-1 border border-red-200 text-red-700 rounded hover:bg-red-50"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Agregar desde inventario</p>
              {filteredInventoryProducts.length === 0 ? (
                <p className="text-xs text-gray-400">No hay más productos para agregar con ese filtro.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {filteredInventoryProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addFeaturedProductFromInventory(product)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center gap-2"
                    >
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={36}
                          height={36}
                          unoptimized
                          className="w-9 h-9 rounded object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded bg-gray-200" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sku || 'Sin SKU'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">
          {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear rifa'}
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Rifas registradas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Rifa</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Sorteo</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Precio</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Disponibles</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Ganador</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
              ) : raffles.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Aún no hay rifas</td></tr>
              ) : (
                raffles.map((raffle) => (
                  <tr key={raffle.id} className="border-b border-gray-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{raffle.title}</p>
                      <p className="text-xs text-gray-500 font-mono">/{raffle.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${raffle.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {raffle.status === 'published' ? 'Publicada' : 'Borrador'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{raffle.draw_place || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">${raffle.number_price.toLocaleString('es-CL')}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{raffle.available_numbers} / {raffle.total_numbers}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-700">
                      {raffle.winner_number
                        ? `#${String(raffle.winner_number).padStart(3, '0')} ${raffle.winner_customer_name || ''}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => loadEntries(raffle.id)} className="px-2.5 py-1 text-xs border border-purple-200 text-purple-700 rounded hover:bg-purple-50">
                        Participantes
                      </button>
                      <button onClick={() => runDraw(raffle.id)} disabled={drawingFor === raffle.id} className="px-2.5 py-1 text-xs border border-emerald-200 text-emerald-700 rounded hover:bg-emerald-50 disabled:opacity-60">
                        {drawingFor === raffle.id ? 'Sorteando...' : 'Sortear'}
                      </button>
                      <button onClick={() => startEdit(raffle)} className="px-2.5 py-1 text-xs border border-blue-200 text-blue-700 rounded hover:bg-blue-50">
                        Editar
                      </button>
                      <button onClick={() => removeRaffle(raffle.id)} className="px-2.5 py-1 text-xs border border-red-200 text-red-700 rounded hover:bg-red-50">
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

      {entriesOpenFor && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Participantes de la rifa</h3>
            <button onClick={() => { setEntriesOpenFor(null); setEntries([]); }} className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cerrar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Número</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Teléfono</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Estado pago</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Monto</th>
                </tr>
              </thead>
              <tbody>
                {entriesLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cargando participantes...</td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin participantes aún</td></tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-100">
                      <td className="px-4 py-3 font-mono text-gray-800">#{String(entry.number).padStart(3, '0')}</td>
                      <td className="px-4 py-3 text-gray-800">{entry.customer_name}</td>
                      <td className="px-4 py-3 text-gray-600">{entry.customer_phone}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          entry.payment_status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : entry.payment_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {entry.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">${entry.amount.toLocaleString('es-CL')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
