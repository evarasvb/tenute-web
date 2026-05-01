'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Prize {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  position: number;
}

interface TicketStatus {
  ticket_number: number;
  status: 'available' | 'pending' | 'reserved';
}

interface Rifa {
  id: string;
  title: string;
  description: string | null;
  status: string;
  total_tickets: number;
  ticket_price: number;
  max_per_person: number | null;
  whatsapp_number: string;
  bank_info: string | null;
  draw_date: string | null;
  prizes: Prize[];
}

export default function PublicRifaPage() {
  const { id } = useParams<{ id: string }>();
  const [rifa, setRifa] = useState<Rifa | null>(null);
  const [tickets, setTickets] = useState<TicketStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/rifas/${id}`)
      .then(async (res) => {
        if (!res.ok) { setNotFound(true); setLoading(false); return; }
        const data = await res.json();
        setRifa(data.rifa);
        setTickets(data.tickets || []);
        setLoading(false);
      });
  }, [id]);

  function toggleTicket(num: number) {
    const ticket = tickets.find((t) => t.ticket_number === num);
    if (!ticket || ticket.status !== 'available') return;
    setSelected((prev) => {
      if (prev.includes(num)) return prev.filter((n) => n !== num);
      if (rifa?.max_per_person && prev.length >= rifa.max_per_person) return prev;
      return [...prev, num].sort((a, b) => a - b);
    });
    setError('');
  }

  async function handleReserve() {
    setError('');
    if (selected.length === 0) { setError('Selecciona al menos un número'); return; }
    if (!buyerName.trim()) { setError('Ingresa tu nombre'); return; }
    if (!buyerPhone.trim()) { setError('Ingresa tu teléfono'); return; }
    setSubmitting(true);

    const res = await fetch(`/api/rifas/${id}/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_numbers: selected, buyer_name: buyerName, buyer_phone: buyerPhone }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Error al reservar');
      // Refresh ticket statuses in case some were taken
      const refresh = await fetch(`/api/rifas/${id}`);
      const refreshData = await refresh.json();
      if (refreshData.tickets) {
        setTickets(refreshData.tickets);
        setSelected((prev) => prev.filter((n) => refreshData.tickets.find((t: TicketStatus) => t.ticket_number === n && t.status === 'available')));
      }
      setSubmitting(false);
      return;
    }

    // Mark as pending locally so grid updates immediately
    setTickets((prev) => prev.map((t) =>
      selected.includes(t.ticket_number) ? { ...t, status: 'pending' as const } : t
    ));
    setSuccess(true);
    setSelected([]);
    setSubmitting(false);

    // Open WhatsApp
    const msg = encodeURIComponent(data.whatsapp_message);
    const phone = (data.whatsapp_number || '').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400">Cargando...</div>
    </div>
  );

  if (notFound || !rifa) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🎟️</div>
        <p className="text-gray-500">Esta rifa no existe o ya no está disponible.</p>
      </div>
    </div>
  );

  const available = tickets.filter((t) => t.status === 'available').length;
  const isClosed = rifa.status === 'closed' || rifa.status === 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-blue-600 text-white py-10 px-4 text-center">
        <h1 className="text-3xl font-bold mb-2">{rifa.title}</h1>
        {rifa.description && <p className="text-blue-100 max-w-xl mx-auto text-sm">{rifa.description}</p>}
        {rifa.draw_date && (
          <p className="text-blue-200 text-sm mt-2">
            📅 Sorteo: {new Date(rifa.draw_date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Prizes */}
        {rifa.prizes.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">🏆 Premios</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {rifa.prizes.map((prize) => (
                <div key={prize.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {prize.image_url ? (
                    <img src={prize.image_url} alt={prize.title} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-5xl">🎁</div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">{prize.position}° Premio</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{prize.title}</h3>
                    {prize.description && <p className="text-sm text-gray-500 mt-1">{prize.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ticket info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-1">${(rifa.ticket_price).toLocaleString('es-CL')}</div>
          <div className="text-sm text-gray-500">por número</div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div><span className="font-semibold text-gray-900">{available}</span><br /><span className="text-gray-400">disponibles</span></div>
            <div><span className="font-semibold text-gray-900">{rifa.total_tickets}</span><br /><span className="text-gray-400">total</span></div>
            {rifa.max_per_person && <div><span className="font-semibold text-gray-900">{rifa.max_per_person}</span><br /><span className="text-gray-400">máx. por persona</span></div>}
          </div>
        </div>

        {/* Ticket grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3 text-center">Elige tus números</h2>
          <div className="flex gap-4 justify-center mb-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-gray-100 border border-gray-200 inline-block" />Disponible</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-blue-500 inline-block" />Seleccionado</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-yellow-200 border border-yellow-300 inline-block" />Pendiente</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-red-100 inline-block" />Reservado</span>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))' }}>
              {tickets.map((t) => {
                const isSelected = selected.includes(t.ticket_number);
                let cls = '';
                if (t.status === 'reserved') cls = 'bg-red-100 text-red-400 cursor-not-allowed';
                else if (t.status === 'pending') cls = 'bg-yellow-100 text-yellow-600 cursor-not-allowed';
                else if (isSelected) cls = 'bg-blue-500 text-white font-bold cursor-pointer shadow';
                else cls = 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 cursor-pointer';

                return (
                  <button key={t.ticket_number} onClick={() => !isClosed && toggleTicket(t.ticket_number)}
                    disabled={t.status !== 'available' || isClosed}
                    className={`text-xs text-center py-2 rounded-lg font-medium transition-colors ${cls}`}>
                    {t.ticket_number}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reserve form */}
        {!isClosed && !success && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4">
              Reservar {selected.length > 0 ? `(${selected.length} número${selected.length > 1 ? 's' : ''}: ${selected.join(', ')})` : ''}
            </h2>
            {selected.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-3 mb-4 text-sm text-blue-800 font-medium">
                Total: ${(selected.length * rifa.ticket_price).toLocaleString('es-CL')}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre *</label>
                <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tu teléfono *</label>
                <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="+56 9 1234 5678" type="tel"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            {error && <p className="mt-3 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}
            <button onClick={handleReserve} disabled={submitting || selected.length === 0}
              className="mt-4 w-full py-4 bg-green-500 text-white rounded-2xl font-bold text-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.122 1.526 5.852L0 24l6.337-1.502A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.663-.498-5.193-1.371l-.372-.219-3.762.892.926-3.663-.241-.388A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>
              {submitting ? 'Reservando...' : 'Reservar por WhatsApp'}
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Al hacer clic se abrirá WhatsApp con el mensaje de reserva. Tu número queda pendiente hasta confirmar el pago.
            </p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-bold text-green-800 text-lg mb-2">¡Reserva enviada!</h3>
            <p className="text-green-700 text-sm">Tu solicitud fue enviada por WhatsApp. Una vez que confirmes el pago, tus números quedarán reservados.</p>
            <button onClick={() => setSuccess(false)} className="mt-4 text-sm text-green-600 underline">Reservar más números</button>
          </div>
        )}

        {isClosed && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-2">🔒</div>
            <p className="text-orange-700 font-medium">Esta rifa ya no acepta nuevas reservas.</p>
          </div>
        )}

        {/* Bank info */}
        {rifa.bank_info && !isClosed && (
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Datos para transferencia</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{rifa.bank_info}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
