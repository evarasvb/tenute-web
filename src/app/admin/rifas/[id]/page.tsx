'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Prize {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  product_id: string | null;
  position: number;
  product?: { id: string; name: string; image_url: string | null } | null;
}

interface Ticket {
  id: string;
  ticket_number: number;
  status: 'available' | 'pending' | 'reserved' | 'winner';
  buyer_name: string | null;
  buyer_phone: string | null;
  reserved_at: string | null;
  payment_confirmed_at: string | null;
}

interface Rifa {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'active' | 'closed' | 'completed';
  total_tickets: number;
  ticket_price: number;
  max_per_person: number | null;
  whatsapp_number: string;
  bank_info: string | null;
  draw_date: string | null;
  prizes: Prize[];
}

const STATUS_LABEL: Record<string, string> = { draft: 'Borrador', active: 'Activa', closed: 'Cerrada', completed: 'Completada' };
const STATUS_COLOR: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', active: 'bg-green-100 text-green-700', closed: 'bg-orange-100 text-orange-700', completed: 'bg-blue-100 text-blue-700' };
const TICKET_COLOR: Record<string, string> = {
  available: 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer',
  pending: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  reserved: 'bg-green-100 text-green-700 border border-green-300',
  winner: 'bg-purple-100 text-purple-700 border border-purple-300',
};

export default function ManageRifaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rifa, setRifa] = useState<Rifa | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'premios' | 'numeros' | 'pendientes' | 'reservados'>('numeros');
  const [selectedPending, setSelectedPending] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);

  // Add prize state
  const [showAddPrize, setShowAddPrize] = useState(false);
  const [prizeMode, setPrizeMode] = useState<'inventory' | 'new'>('new');
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<{ id: string; name: string; image_url: string | null; stock_ocoa: number; stock_local21: number }[]>([]);
  const [newPrizeTitle, setNewPrizeTitle] = useState('');
  const [newPrizeDesc, setNewPrizeDesc] = useState('');
  const [newPrizeImage, setNewPrizeImage] = useState('');
  const [addingPrize, setAddingPrize] = useState(false);

  const load = useCallback(async () => {
    const [rifaRes, ticketsRes] = await Promise.all([
      fetch(`/api/admin/rifas/${id}`),
      fetch(`/api/admin/rifas/${id}/tickets`),
    ]);
    const rifaData = await rifaRes.json();
    const ticketsData = await ticketsRes.json();
    if (rifaData.rifa) setRifa(rifaData.rifa);
    if (ticketsData.tickets) setTickets(ticketsData.tickets);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(status: string) {
    await fetch(`/api/admin/rifas/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    setRifa((r) => r ? { ...r, status: status as Rifa['status'] } : r);
  }

  async function removePrize(prizeId: string) {
    if (!confirm('¿Quitar este premio? Si era del inventario, se restaurará su stock.')) return;
    await fetch(`/api/admin/rifas/${id}/prizes/${prizeId}`, { method: 'DELETE' });
    setRifa((r) => r ? { ...r, prizes: r.prizes.filter((p) => p.id !== prizeId) } : r);
  }

  async function searchProducts(q: string) {
    if (q.length < 2) { setProductResults([]); return; }
    const res = await fetch(`/api/admin/products?search=${encodeURIComponent(q)}&limit=10`);
    const data = await res.json();
    setProductResults(data.products || []);
  }

  async function addInventoryPrize(product: { id: string; name: string; image_url: string | null }) {
    setAddingPrize(true);
    const res = await fetch(`/api/admin/rifas/${id}/prizes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: product.name, image_url: product.image_url, product_id: product.id, position: (rifa?.prizes.length || 0) + 1 }),
    });
    const data = await res.json();
    if (data.prize) {
      setRifa((r) => r ? { ...r, prizes: [...r.prizes, data.prize] } : r);
      setShowAddPrize(false); setProductSearch(''); setProductResults([]);
    }
    setAddingPrize(false);
  }

  async function addNewPrize() {
    if (!newPrizeTitle.trim()) return;
    setAddingPrize(true);
    const res = await fetch(`/api/admin/rifas/${id}/prizes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newPrizeTitle.trim(), description: newPrizeDesc.trim(), image_url: newPrizeImage.trim(), position: (rifa?.prizes.length || 0) + 1 }),
    });
    const data = await res.json();
    if (data.prize) {
      setRifa((r) => r ? { ...r, prizes: [...r.prizes, data.prize] } : r);
      setShowAddPrize(false); setNewPrizeTitle(''); setNewPrizeDesc(''); setNewPrizeImage('');
    }
    setAddingPrize(false);
  }

  async function confirmPayments() {
    if (selectedPending.size === 0) return;
    setConfirming(true);
    await fetch(`/api/admin/rifas/${id}/tickets`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_ids: Array.from(selectedPending), action: 'confirm' }),
    });
    setSelectedPending(new Set());
    await load();
    setConfirming(false);
  }

  async function releaseTickets(ids: string[]) {
    if (!confirm('¿Liberar estos números y dejarlos disponibles de nuevo?')) return;
    await fetch(`/api/admin/rifas/${id}/tickets`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_ids: ids, action: 'release' }),
    });
    await load();
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Cargando...</div>;
  if (!rifa) return <div className="text-center py-16 text-gray-400">Rifa no encontrada</div>;

  const pending = tickets.filter((t) => t.status === 'pending');
  const reserved = tickets.filter((t) => t.status === 'reserved');
  const available = tickets.filter((t) => t.status === 'available').length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button onClick={() => router.push('/admin/rifas')} className="mt-1 text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{rifa.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[rifa.status]}`}>{STATUS_LABEL[rifa.status]}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {rifa.total_tickets} números · ${(rifa.ticket_price).toLocaleString('es-CL')} c/u
            {rifa.draw_date && ` · Sorteo: ${new Date(rifa.draw_date + 'T12:00:00').toLocaleDateString('es-CL')}`}
          </p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
          <Link href={`/rifas/${rifa.id}`} target="_blank"
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
            Ver pública
          </Link>
          {rifa.status === 'draft' && (
            <button onClick={() => updateStatus('active')}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
              Activar
            </button>
          )}
          {rifa.status === 'active' && (
            <button onClick={() => updateStatus('closed')}
              className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600">
              Cerrar
            </button>
          )}
          {rifa.status === 'closed' && (
            <button onClick={() => updateStatus('completed')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
              Completar
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Disponibles', value: available, color: 'text-gray-700' },
          { label: 'Pendientes', value: pending.length, color: 'text-yellow-600' },
          { label: 'Reservados', value: reserved.length, color: 'text-green-600' },
          { label: 'Recaudado', value: `$${(reserved.length * rifa.ticket_price).toLocaleString('es-CL')}`, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {(['numeros', 'premios', 'pendientes', 'reservados'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'pendientes' ? `Pendientes ${pending.length > 0 ? `(${pending.length})` : ''}` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab: Numeros */}
      {tab === 'numeros' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex gap-4 text-xs text-gray-500 mb-4 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-gray-100 inline-block" />Disponible</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300 inline-block" />Pendiente</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-green-100 border border-green-300 inline-block" />Reservado</span>
          </div>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))' }}>
            {tickets.map((t) => (
              <div key={t.id} title={t.buyer_name ? `${t.buyer_name} · ${t.buyer_phone}` : undefined}
                className={`text-xs text-center py-1.5 rounded-lg font-medium ${TICKET_COLOR[t.status]}`}>
                {t.ticket_number}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Premios */}
      {tab === 'premios' && (
        <div className="space-y-3">
          {(rifa.prizes || []).sort((a, b) => a.position - b.position).map((prize) => (
            <div key={prize.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              {prize.image_url
                ? <img src={prize.image_url} alt="" className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                : <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">🏆</div>
              }
              <div className="flex-1">
                <p className="font-medium text-gray-900"><span className="text-gray-400 text-sm mr-1">{prize.position}°</span>{prize.title}</p>
                {prize.description && <p className="text-sm text-gray-500">{prize.description}</p>}
                {prize.product_id && <p className="text-xs text-blue-600 mt-0.5">Del inventario (stock reservado)</p>}
              </div>
              <button onClick={() => removePrize(prize.id)} className="text-red-400 hover:text-red-600 text-xs">Quitar</button>
            </div>
          ))}

          {!showAddPrize ? (
            <button onClick={() => setShowAddPrize(true)}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
              + Agregar premio
            </button>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex gap-2 mb-2">
                <button onClick={() => setPrizeMode('new')} className={`px-3 py-1.5 rounded text-xs font-medium ${prizeMode === 'new' ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-600'}`}>Premio nuevo</button>
                <button onClick={() => setPrizeMode('inventory')} className={`px-3 py-1.5 rounded text-xs font-medium ${prizeMode === 'inventory' ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-600'}`}>Desde inventario</button>
              </div>
              {prizeMode === 'new' && (
                <>
                  <input autoFocus value={newPrizeTitle} onChange={(e) => setNewPrizeTitle(e.target.value)} placeholder="Nombre del premio *" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <textarea value={newPrizeDesc} onChange={(e) => setNewPrizeDesc(e.target.value)} placeholder="Descripción (opcional)" rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <input value={newPrizeImage} onChange={(e) => setNewPrizeImage(e.target.value)} placeholder="URL de la foto (opcional)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <button onClick={addNewPrize} disabled={addingPrize} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50">
                      {addingPrize ? 'Agregando...' : 'Agregar'}
                    </button>
                    <button onClick={() => setShowAddPrize(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancelar</button>
                  </div>
                </>
              )}
              {prizeMode === 'inventory' && (
                <>
                  <input autoFocus value={productSearch} onChange={(e) => { setProductSearch(e.target.value); searchProducts(e.target.value); }} placeholder="Buscar producto..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {productResults.map((p) => (
                      <button key={p.id} onClick={() => addInventoryPrize(p)} disabled={addingPrize}
                        className="w-full flex items-center gap-3 p-2 bg-gray-50 rounded hover:bg-blue-50 text-left">
                        {p.image_url ? <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-gray-200" />}
                        <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{p.name}</p><p className="text-xs text-gray-500">Stock: {(p.stock_ocoa || 0) + (p.stock_local21 || 0)}</p></div>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setShowAddPrize(false); setProductSearch(''); setProductResults([]); }} className="text-xs text-gray-500 hover:text-gray-700">Cancelar</button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Pendientes */}
      {tab === 'pendientes' && (
        <div className="space-y-3">
          {pending.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No hay números pendientes de pago</div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox"
                    checked={selectedPending.size === pending.length && pending.length > 0}
                    onChange={(e) => setSelectedPending(e.target.checked ? new Set(pending.map((t) => t.id)) : new Set())} />
                  Seleccionar todos
                </label>
                {selectedPending.size > 0 && (
                  <button onClick={confirmPayments} disabled={confirming}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                    {confirming ? 'Confirmando...' : `✓ Confirmar pago (${selectedPending.size})`}
                  </button>
                )}
              </div>
              {pending.map((t) => (
                <div key={t.id} className="bg-white rounded-xl border border-yellow-200 p-4 flex items-center gap-3">
                  <input type="checkbox" checked={selectedPending.has(t.id)}
                    onChange={(e) => {
                      const s = new Set(selectedPending);
                      e.target.checked ? s.add(t.id) : s.delete(t.id);
                      setSelectedPending(s);
                    }} />
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center font-bold text-yellow-700 shrink-0">
                    {t.ticket_number}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{t.buyer_name}</p>
                    <p className="text-sm text-gray-500">{t.buyer_phone}</p>
                    {t.reserved_at && <p className="text-xs text-gray-400">{new Date(t.reserved_at).toLocaleString('es-CL')}</p>}
                  </div>
                  <button onClick={() => releaseTickets([t.id])} className="text-xs text-red-400 hover:text-red-600">Liberar</button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Tab: Reservados */}
      {tab === 'reservados' && (
        <div className="space-y-3">
          {reserved.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No hay números reservados aún</div>
          ) : (
            reserved.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-green-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 shrink-0">
                  {t.ticket_number}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{t.buyer_name}</p>
                  <p className="text-sm text-gray-500">{t.buyer_phone}</p>
                  {t.payment_confirmed_at && <p className="text-xs text-gray-400">Pago confirmado: {new Date(t.payment_confirmed_at).toLocaleString('es-CL')}</p>}
                </div>
                <div className="text-sm font-semibold text-green-600">${rifa.ticket_price.toLocaleString('es-CL')}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
