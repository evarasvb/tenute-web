'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  image_url: string | null;
  stock_ocoa: number;
  stock_local21: number;
}

interface Prize {
  tempId: string;
  title: string;
  description: string;
  image_url: string;
  product_id: string | null;
  product?: Product;
  position: number;
}

let tempIdCounter = 0;

export default function NuevaRifaPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Rifa fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalTickets, setTotalTickets] = useState('100');
  const [ticketPrice, setTicketPrice] = useState('');
  const [maxPerPerson, setMaxPerPerson] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [drawDate, setDrawDate] = useState('');

  // Prizes
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [prizeMode, setPrizeMode] = useState<'inventory' | 'new' | null>(null);

  // Inventory search
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // New prize form
  const [newPrizeTitle, setNewPrizeTitle] = useState('');
  const [newPrizeDesc, setNewPrizeDesc] = useState('');
  const [newPrizeImage, setNewPrizeImage] = useState('');

  const searchProducts = useCallback(async (q: string) => {
    if (q.length < 2) { setProductResults([]); return; }
    setSearchLoading(true);
    const res = await fetch(`/api/admin/products?search=${encodeURIComponent(q)}&limit=10`);
    const data = await res.json();
    setProductResults(data.products || []);
    setSearchLoading(false);
  }, []);

  function addInventoryPrize(product: Product) {
    setPrizes((prev) => [...prev, {
      tempId: String(++tempIdCounter),
      title: product.name,
      description: '',
      image_url: product.image_url || '',
      product_id: product.id,
      product,
      position: prev.length + 1,
    }]);
    setProductSearch('');
    setProductResults([]);
    setPrizeMode(null);
  }

  function addNewPrize() {
    if (!newPrizeTitle.trim()) return;
    setPrizes((prev) => [...prev, {
      tempId: String(++tempIdCounter),
      title: newPrizeTitle.trim(),
      description: newPrizeDesc.trim(),
      image_url: newPrizeImage.trim(),
      product_id: null,
      position: prev.length + 1,
    }]);
    setNewPrizeTitle('');
    setNewPrizeDesc('');
    setNewPrizeImage('');
    setPrizeMode(null);
  }

  function removePrize(tempId: string) {
    setPrizes((prev) => prev.filter((p) => p.tempId !== tempId).map((p, i) => ({ ...p, position: i + 1 })));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('El título es requerido'); return; }
    if (!whatsappNumber.trim()) { setError('El número de WhatsApp es requerido'); return; }
    setSaving(true);

    // Create rifa
    const rifaRes = await fetch('/api/admin/rifas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, total_tickets: totalTickets, ticket_price: ticketPrice, max_per_person: maxPerPerson || null, whatsapp_number: whatsappNumber, bank_info: bankInfo, draw_date: drawDate || null }),
    });
    const rifaData = await rifaRes.json();
    if (!rifaRes.ok) { setError(rifaData.error || 'Error al crear la rifa'); setSaving(false); return; }

    const rifaId = rifaData.rifa.id;

    // Add prizes sequentially
    for (const prize of prizes) {
      await fetch(`/api/admin/rifas/${rifaId}/prizes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: prize.title, description: prize.description, image_url: prize.image_url, product_id: prize.product_id, position: prize.position }),
      });
    }

    router.push(`/admin/rifas/${rifaId}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Rifa</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Información general</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Gran Rifa de Navidad"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Descripción de la rifa, condiciones, etc."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total números</label>
              <input type="number" value={totalTickets} onChange={(e) => setTotalTickets(e.target.value)} min="1" max="1000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio por número ($)</label>
              <input type="number" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} min="0"
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Máx. números por persona</label>
              <input type="number" value={maxPerPerson} onChange={(e) => setMaxPerPerson(e.target.value)} min="1"
                placeholder="Sin límite"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del sorteo</label>
              <input type="date" value={drawDate} onChange={(e) => setDrawDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Contacto y pago</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp de contacto *</label>
            <input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="Ej: 56912345678 (sin + ni espacios)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datos para transferencia</label>
            <textarea value={bankInfo} onChange={(e) => setBankInfo(e.target.value)} rows={3}
              placeholder="Banco: BancoEstado&#10;Cuenta: 123456789&#10;RUT: 12.345.678-9&#10;Nombre: Juan Pérez"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Prizes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Premios ({prizes.length})</h2>
            {prizeMode === null && (
              <div className="flex gap-2">
                <button type="button" onClick={() => setPrizeMode('inventory')}
                  className="px-3 py-1.5 border border-blue-300 text-blue-600 rounded-lg text-xs hover:bg-blue-50 transition-colors">
                  + Desde inventario
                </button>
                <button type="button" onClick={() => setPrizeMode('new')}
                  className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50 transition-colors">
                  + Premio nuevo
                </button>
              </div>
            )}
          </div>

          {prizes.length > 0 && (
            <div className="space-y-2 mb-4">
              {prizes.map((prize, i) => (
                <div key={prize.tempId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {prize.image_url ? (
                    <img src={prize.image_url} alt="" className="w-10 h-10 rounded object-cover bg-gray-200" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-lg">🏆</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      <span className="text-gray-400 mr-1">{i + 1}°</span>{prize.title}
                    </p>
                    {prize.product_id && <p className="text-xs text-blue-600">Del inventario</p>}
                  </div>
                  <button type="button" onClick={() => removePrize(prize.tempId)}
                    className="text-red-400 hover:text-red-600 text-xs">Quitar</button>
                </div>
              ))}
            </div>
          )}

          {prizeMode === 'inventory' && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-3">
              <p className="text-sm font-medium text-blue-800">Buscar producto del inventario</p>
              <input
                autoFocus
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); searchProducts(e.target.value); }}
                placeholder="Nombre o SKU del producto..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {searchLoading && <p className="text-xs text-gray-400">Buscando...</p>}
              {productResults.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {productResults.map((p) => (
                    <button type="button" key={p.id} onClick={() => addInventoryPrize(p)}
                      className="w-full flex items-center gap-3 p-2 bg-white rounded hover:bg-blue-100 transition-colors text-left">
                      {p.image_url
                        ? <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                        : <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs">sin img</div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">Stock: {(p.stock_ocoa || 0) + (p.stock_local21 || 0)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => { setPrizeMode(null); setProductSearch(''); setProductResults([]); }}
                className="text-xs text-gray-500 hover:text-gray-700">Cancelar</button>
            </div>
          )}

          {prizeMode === 'new' && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-gray-800">Nuevo premio</p>
              <input autoFocus value={newPrizeTitle} onChange={(e) => setNewPrizeTitle(e.target.value)}
                placeholder="Nombre del premio *"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea value={newPrizeDesc} onChange={(e) => setNewPrizeDesc(e.target.value)}
                placeholder="Descripción (opcional)" rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={newPrizeImage} onChange={(e) => setNewPrizeImage(e.target.value)}
                placeholder="URL de la foto (opcional)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-2">
                <button type="button" onClick={addNewPrize}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                  Agregar
                </button>
                <button type="button" onClick={() => setPrizeMode(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

        <div className="flex gap-3 pb-8">
          <button type="submit" disabled={saving}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Creando...' : 'Crear Rifa'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
