'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Rifa {
  id: string;
  title: string;
  status: 'draft' | 'active' | 'closed' | 'completed';
  total_tickets: number;
  ticket_price: number;
  draw_date: string | null;
  prize_count: number;
  tickets_available: number;
  tickets_pending: number;
  tickets_reserved: number;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activa',
  closed: 'Cerrada',
  completed: 'Completada',
};
const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-orange-100 text-orange-700',
  completed: 'bg-blue-100 text-blue-700',
};

export default function RifasPage() {
  const [rifas, setRifas] = useState<Rifa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/rifas')
      .then((r) => r.json())
      .then((d) => { setRifas(d.rifas || []); setLoading(false); });
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Eliminar la rifa "${title}"? Se eliminarán todos sus tickets y premios.`)) return;
    await fetch(`/api/admin/rifas/${id}`, { method: 'DELETE' });
    setRifas((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rifas</h1>
        <Link href="/admin/rifas/nueva"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Rifa
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : rifas.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎟️</div>
          <p className="text-gray-500 mb-4">No hay rifas creadas aún</p>
          <Link href="/admin/rifas/nueva" className="text-blue-600 hover:underline text-sm">
            Crear la primera rifa →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rifas.map((rifa) => (
            <div key={rifa.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold text-gray-900 truncate">{rifa.title}</h2>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[rifa.status]}`}>
                    {STATUS_LABEL[rifa.status]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span>🎟️ {rifa.total_tickets} números · ${(rifa.ticket_price || 0).toLocaleString('es-CL')} c/u</span>
                  <span>🏆 {rifa.prize_count} premios</span>
                  {rifa.draw_date && <span>📅 {new Date(rifa.draw_date + 'T12:00:00').toLocaleDateString('es-CL')}</span>}
                </div>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-gray-400">{rifa.tickets_available} disponibles</span>
                  <span className="text-yellow-600 font-medium">{rifa.tickets_pending} pendientes</span>
                  <span className="text-green-600 font-medium">{rifa.tickets_reserved} reservados</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href={`/rifas/${rifa.id}`} target="_blank"
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                  Ver pública
                </Link>
                <Link href={`/admin/rifas/${rifa.id}`}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                  Gestionar
                </Link>
                <button onClick={() => handleDelete(rifa.id, rifa.title)}
                  className="px-3 py-1.5 border border-red-200 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
