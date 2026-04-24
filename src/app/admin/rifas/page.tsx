'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type RaffleStatus = 'draft' | 'published' | 'closed';
type DrawMethod = 'random_seed' | 'manual' | 'external';

interface AdminRaffleListRow {
  id: string;
  title: string;
  slug: string;
  status: RaffleStatus;
  draw_method: DrawMethod;
  draw_date: string | null;
  prizes_count: number;
  media_count: number;
  entries_count: number;
}

const STATUS_LABELS: Record<RaffleStatus, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  closed: 'Cerrado',
};

const DRAW_LABELS: Record<DrawMethod, string> = {
  random_seed: 'Random seed',
  manual: 'Manual',
  external: 'Externo',
};

function formatDate(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('es-CL');
}

function statusClass(status: RaffleStatus) {
  if (status === 'published') return 'bg-green-100 text-green-700';
  if (status === 'closed') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
}

export default function AdminRifasPage() {
  const [raffles, setRaffles] = useState<AdminRaffleListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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

  async function createDraftRaffle() {
    setWorkingId('new');
    setError('');
    setMessage('');

    const timestamp = Date.now();
    const payload = {
      title: `Nueva rifa ${new Date(timestamp).toLocaleDateString('es-CL')}`,
      slug: `rifa-${timestamp}`,
      status: 'draft',
      draw_method: 'random_seed',
      min_sold_to_draw: 0,
    };

    const res = await fetch('/api/admin/rifas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'No se pudo crear la rifa');
      setWorkingId(null);
      return;
    }

    window.location.href = `/admin/rifas/${data.id}`;
  }

  async function togglePublish(row: AdminRaffleListRow) {
    setWorkingId(row.id);
    setError('');
    setMessage('');

    const nextStatus: RaffleStatus = row.status === 'published' ? 'draft' : 'published';
    const res = await fetch(`/api/admin/rifas/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'No se pudo actualizar estado');
      setWorkingId(null);
      return;
    }

    setMessage(nextStatus === 'published' ? 'Rifa publicada' : 'Rifa despublicada');
    await loadRaffles();
    setWorkingId(null);
  }

  async function deleteRaffle(id: string) {
    if (!confirm('¿Eliminar esta rifa? También se eliminarán premios y media relacionados.')) return;

    setWorkingId(id);
    setError('');
    setMessage('');

    const res = await fetch(`/api/admin/rifas/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudo eliminar la rifa');
      setWorkingId(null);
      return;
    }

    setMessage('Rifa eliminada');
    await loadRaffles();
    setWorkingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rifas v2</h2>
          <p className="text-sm text-gray-500">Listado de rifas según nuevo esquema de Supabase.</p>
        </div>
        <button
          type="button"
          onClick={createDraftRaffle}
          disabled={workingId === 'new'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {workingId === 'new' ? 'Creando...' : 'Nueva rifa'}
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Título</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Draw method</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Draw date</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">#Premios</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">#Media</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">#Entries</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    Cargando rifas...
                  </td>
                </tr>
              ) : raffles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    No hay rifas registradas
                  </td>
                </tr>
              ) : (
                raffles.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.title}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">/{row.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(row.status)}`}>
                        {STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{DRAW_LABELS[row.draw_method]}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(row.draw_date)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.prizes_count}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.media_count}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.entries_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/rifas/${row.id}`}
                          className="px-2.5 py-1 text-xs border border-blue-200 text-blue-700 rounded hover:bg-blue-50"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => togglePublish(row)}
                          disabled={workingId === row.id}
                          className="px-2.5 py-1 text-xs border border-emerald-200 text-emerald-700 rounded hover:bg-emerald-50 disabled:opacity-60"
                        >
                          {row.status === 'published' ? 'Despublicar' : 'Publicar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRaffle(row.id)}
                          disabled={workingId === row.id}
                          className="px-2.5 py-1 text-xs border border-red-200 text-red-700 rounded hover:bg-red-50 disabled:opacity-60"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
