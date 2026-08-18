'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Ticket {
  id: string;
  ticket_number: number;
  buyer_name: string | null;
  buyer_phone: string | null;
  status: string;
  reserved_at: string | null;
  payment_confirmed_at: string | null;
}

interface Rifa {
  id: string;
  title: string;
  status: string;
  total_tickets: number;
  ticket_price: number;
  whatsapp_number: string;
}

interface BuyerGroup {
  buyer_name: string;
  buyer_phone: string;
  tickets: Ticket[];
}

export default function GestionarRifaPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [rifa, setRifa] = useState<Rifa | null>(null);
  const [pending, setPending] = useState<Ticket[]>([]);
  const [reserved, setReserved] = useState<Ticket[]>([]);
  const [counts, setCounts] = useState({ available: 0, pending: 0, reserved: 0 });
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [tab, setTab] = useState<'pending' | 'reserved'>('pending');
  const [working, setWorking] = useState<string | null>(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);

  const load = useCallback(async () => {
    if (!token) { setUnauthorized(true); setLoading(false); return; }
    const res = await fetch(`/api/rifas/${id}/gestionar?token=${token}`);
    if (res.status === 401) { setUnauthorized(true); setLoading(false); return; }
    const data = await res.json();
    setRifa(data.rifa);
    setPending(data.pending || []);
    setReserved(data.reserved || []);
    setCounts(data.counts || {});
    setLoading(false);
  }, [id, token]);

  useEffect(() => { load(); }, [load]);

  async function doAction(action: string, ticket_ids?: string[]) {
    const key = ticket_ids ? ticket_ids[0] : action;
    setWorking(key);
    await fetch(`/api/rifas/${id}/gestionar?token=${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ticket_ids }),
    });
    await load();
    setWorking(null);
  }

  function copy(text: string, setCopied: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/rifas/${id}` : '';
  const adminUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Group pending tickets by buyer
  const pendingGroups: BuyerGroup[] = Object.values(
    pending.reduce<Record<string, BuyerGroup>>((acc, t) => {
      const key = `${t.buyer_name}|${t.buyer_phone}`;
      if (!acc[key]) acc[key] = { buyer_name: t.buyer_name || '', buyer_phone: t.buyer_phone || '', tickets: [] };
      acc[key].tickets.push(t);
      return acc;
    }, {})
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-400">Cargando...</div>
    </div>
  );

  if (unauthorized) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Acceso no autorizado</h1>
        <p className="text-gray-500 text-sm">El link secreto no es válido o expiró.</p>
        <Link href="/rifas" className="mt-4 inline-block text-blue-600 hover:underline text-sm">Ir a rifas</Link>
      </div>
    </div>
  );

  if (!rifa) return null;

  const isClosed = rifa.status === 'closed' || rifa.status === 'completed';
  const total = counts.reserved * (rifa.ticket_price || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/rifas" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-gray-900 truncate">{rifa.title}</h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${rifa.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {rifa.status === 'active' ? 'Activa' : rifa.status === 'closed' ? 'Cerrada' : 'Completada'}
              </span>
            </div>
            {rifa.status === 'active' && (
              <button onClick={() => doAction('close')} disabled={working === 'close'}
                className="px-3 py-1.5 border border-orange-200 text-orange-600 rounded-lg text-xs hover:bg-orange-50 transition-colors">
                {working === 'close' ? '...' : 'Cerrar rifa'}
              </button>
            )}
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => copy(publicUrl, setCopiedPublic)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 hover:bg-blue-100 transition-colors">
              🔗 {copiedPublic ? '¡Copiado!' : 'Copiar link público'}
            </button>
            <button onClick={() => copy(adminUrl, setCopiedAdmin)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700 hover:bg-orange-100 transition-colors">
              🔐 {copiedAdmin ? '¡Copiado!' : 'Copiar link secreto'}
            </button>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors">
              Ver rifa pública ↗
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Disponibles', value: counts.available, color: 'text-gray-700' },
            { label: 'Pendientes', value: counts.pending, color: 'text-yellow-600' },
            { label: 'Confirmados', value: counts.reserved, color: 'text-green-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {counts.reserved > 0 && rifa.ticket_price > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 font-medium">
            💰 Total recaudado: ${total.toLocaleString('es-CL')}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {(['pending', 'reserved'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                {t === 'pending' ? `Pendientes (${counts.pending})` : `Confirmados (${counts.reserved})`}
              </button>
            ))}
          </div>

          <div className="p-4">
            {tab === 'pending' && (
              pendingGroups.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No hay reservas pendientes de pago.</p>
              ) : (
                <div className="space-y-3">
                  {pendingGroups.map((group, i) => {
                    const ids = group.tickets.map((t) => t.id);
                    const numbers = group.tickets.map((t) => t.ticket_number).sort((a, b) => a - b).join(', ');
                    const subtotal = group.tickets.length * (rifa.ticket_price || 0);
                    return (
                      <div key={i} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{group.buyer_name}</p>
                            <p className="text-xs text-gray-500">{group.buyer_phone}</p>
                          </div>
                          {rifa.ticket_price > 0 && (
                            <span className="text-sm font-bold text-gray-900">${subtotal.toLocaleString('es-CL')}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          Números: <span className="font-medium text-gray-700">{numbers}</span>
                          {' '}({group.tickets.length} número{group.tickets.length > 1 ? 's' : ''})
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => doAction('confirm', ids)}
                            disabled={!!working || isClosed}
                            className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 disabled:opacity-50 transition-colors">
                            {working === ids[0] ? '...' : '✓ Confirmar pago'}
                          </button>
                          <button
                            onClick={() => doAction('release', ids)}
                            disabled={!!working}
                            className="px-4 py-2 border border-red-200 text-red-500 rounded-lg text-xs hover:bg-red-50 transition-colors">
                            Liberar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {tab === 'reserved' && (
              reserved.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Aún no hay pagos confirmados.</p>
              ) : (
                <div className="space-y-2">
                  {Object.values(
                    reserved.reduce<Record<string, BuyerGroup>>((acc, t) => {
                      const key = `${t.buyer_name}|${t.buyer_phone}`;
                      if (!acc[key]) acc[key] = { buyer_name: t.buyer_name || '', buyer_phone: t.buyer_phone || '', tickets: [] };
                      acc[key].tickets.push(t);
                      return acc;
                    }, {})
                  ).map((group, i) => {
                    const numbers = group.tickets.map((t) => t.ticket_number).sort((a, b) => a - b).join(', ');
                    const subtotal = group.tickets.length * (rifa.ticket_price || 0);
                    return (
                      <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{group.buyer_name}</p>
                          <p className="text-xs text-gray-500">Nros: {numbers}</p>
                        </div>
                        {rifa.ticket_price > 0 && (
                          <span className="text-sm font-bold text-green-700">${subtotal.toLocaleString('es-CL')}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
