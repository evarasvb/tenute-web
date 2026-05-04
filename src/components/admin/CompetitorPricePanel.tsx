'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CompetitorLink,
  CompetitorPriceItem,
  useCompetitorPrices,
} from '@/hooks/useCompetitorPrices';

interface CompetitorPricePanelProps {
  productId: string;
  productName: string;
  ourPrice: number;
  onLocalPriceUpdated?: (price: number) => void;
}

function formatCLP(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });
}

function formatPercent(value: number | null) {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(2)}%`;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function statusBadgeClass(diff: number | null) {
  if (diff == null) return 'bg-gray-100 text-gray-600';
  if (diff <= 0) return 'bg-green-100 text-green-700';
  return 'bg-red-100 text-red-700';
}

function MiniHistory({ item }: { item: CompetitorPriceItem }) {
  if (!item.history.length) {
    return <span className="text-xs text-gray-400">Sin histórico</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {item.history.slice(0, 5).map((point) => (
        <span
          key={point.id}
          className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700"
          title={formatDate(point.scrapedAt)}
        >
          {formatCLP(point.price)}
        </span>
      ))}
    </div>
  );
}

interface LinkModalState {
  open: boolean;
  editing?: CompetitorLink | null;
}

export default function CompetitorPricePanel(props: CompetitorPricePanelProps) {
  const { productId, productName, ourPrice: initialOurPrice, onLocalPriceUpdated } = props;
  const {
    loading,
    refreshing,
    savingPrice,
    error,
    summary,
    links,
    competitors,
    ourPrice,
    setOurPrice,
    refresh,
    upsertLink,
    toggleLink,
    removeLink,
    saveOurPrice,
  } = useCompetitorPrices(productId, initialOurPrice);

  const [draftPrice, setDraftPrice] = useState<number>(initialOurPrice || 0);
  const [modal, setModal] = useState<LinkModalState>({ open: false, editing: null });
  const [savingLink, setSavingLink] = useState(false);
  const [linkForm, setLinkForm] = useState({
    competitorId: '',
    url: '',
    selector: '',
    sku_competidor: '',
    active: true,
  });

  const linksById = useMemo(() => {
    return new Map(links.map((link) => [link.id, link] as const));
  }, [links]);
  const minCompetitorPrice = summary?.minimumCompetitorPrice ?? null;
  const suggestedPrice = summary?.suggestedPrice ?? null;

  const tableRows = useMemo(() => {
    const rows = summary?.items || [];
    return rows.map((row) => {
      const diff = row.latestPrice != null ? ourPrice - row.latestPrice : null;
      const diffPercent = row.latestPrice ? (diff! / row.latestPrice) * 100 : null;
      return { ...row, diff, diffPercent };
    });
  }, [summary, ourPrice]);

  const handleSaveOurPrice = async () => {
    await saveOurPrice(draftPrice);
    onLocalPriceUpdated?.(draftPrice);
  };

  useEffect(() => {
    setDraftPrice(ourPrice);
  }, [ourPrice]);

  const openAddModal = () => {
    setLinkForm({
      competitorId: competitors[0]?.id || '',
      url: '',
      selector: '',
      sku_competidor: '',
      active: true,
    });
    setModal({ open: true, editing: null });
  };

  const openEditModal = (link: CompetitorLink) => {
    setLinkForm({
      competitorId: link.competitor_id,
      url: link.url,
      selector: link.selector || '',
      sku_competidor: link.sku_competidor || '',
      active: link.active,
    });
    setModal({ open: true, editing: link });
  };

  const closeModal = () => {
    setModal({ open: false, editing: null });
  };

  const onSubmitLink = async () => {
    if (!linkForm.competitorId || !linkForm.url.trim()) return;
    setSavingLink(true);
    try {
      await upsertLink({
        id: modal.editing?.id,
        competitorId: linkForm.competitorId,
        url: linkForm.url.trim(),
        selector: linkForm.selector.trim() || undefined,
        sku_competidor: linkForm.sku_competidor.trim() || undefined,
        active: linkForm.active,
      });
      closeModal();
    } finally {
      setSavingLink(false);
    }
  };

  const applySuggested = async () => {
    if (suggestedPrice == null) return;
    setDraftPrice(suggestedPrice);
    setOurPrice(suggestedPrice);
    await saveOurPrice(suggestedPrice);
    onLocalPriceUpdated?.(suggestedPrice);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Comparativa de precios</h3>
          <p className="text-sm text-gray-500">Producto: {productName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openAddModal}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Agregar enlace
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {refreshing ? 'Refrescando...' : 'Refrescar todos'}
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-600">Nuestro precio</p>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              className="w-full rounded border border-blue-200 bg-white px-2 py-1.5 text-sm"
              value={draftPrice}
              onChange={(e) => setDraftPrice(Number(e.target.value) || 0)}
            />
            <button
              type="button"
              onClick={() => void handleSaveOurPrice()}
              disabled={savingPrice}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-600">Competidor más barato</p>
          <p className="mt-2 text-sm font-medium text-gray-800">{formatCLP(minCompetitorPrice)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-600">
            Precio sugerido (5% bajo mínimo)
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">{formatCLP(suggestedPrice)}</p>
            <button
              type="button"
              onClick={() => void applySuggested()}
              disabled={suggestedPrice == null || savingPrice}
              className="rounded border border-blue-300 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>

      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-2 py-2">Competidor</th>
              <th className="px-2 py-2">URL</th>
              <th className="px-2 py-2 text-right">Último precio</th>
              <th className="px-2 py-2 text-right">Nuestro precio</th>
              <th className="px-2 py-2 text-right">Dif. $</th>
              <th className="px-2 py-2 text-right">Dif. %</th>
              <th className="px-2 py-2">Última actualización</th>
              <th className="px-2 py-2">Histórico</th>
              <th className="px-2 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-2 py-8 text-center text-gray-400">
                  Cargando comparativa...
                </td>
              </tr>
            ) : tableRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-2 py-8 text-center text-gray-400">
                  No hay enlaces de competidores para este producto.
                </td>
              </tr>
            ) : (
              tableRows.map((row) => {
                const link = linksById.get(row.linkId);
                return (
                  <tr key={`${row.competitorId}-${row.sourceUrl}`} className="border-b border-gray-100">
                    <td className="px-2 py-2">
                      <span className="font-medium text-gray-900">{row.competitorName}</span>
                    </td>
                    <td className="max-w-[280px] px-2 py-2">
                      <a href={row.sourceUrl} target="_blank" rel="noreferrer" className="truncate text-blue-600 hover:underline">
                        {row.sourceUrl}
                      </a>
                    </td>
                    <td className="px-2 py-2 text-right font-medium text-gray-900">{formatCLP(row.latestPrice)}</td>
                    <td className="px-2 py-2 text-right">{formatCLP(ourPrice)}</td>
                    <td className="px-2 py-2 text-right">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(row.diff)}`}>
                        {formatCLP(row.diff)}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right text-gray-700">{formatPercent(row.diffPercent)}</td>
                    <td className="px-2 py-2 text-gray-600">{formatDate(row.scrapedAt)}</td>
                    <td className="px-2 py-2">
                      <MiniHistory item={row} />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => void refresh()}
                          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          Refrescar
                        </button>
                        {link && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(link)}
                              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                            >
                              Editar URL
                            </button>
                            <button
                              type="button"
                              onClick={() => void toggleLink(link.id, !link.active)}
                              className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50"
                            >
                              {link.active ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeLink(link.id)}
                              className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5">
            <h4 className="text-lg font-semibold text-gray-900">
              {modal.editing ? 'Editar enlace de competidor' : 'Agregar enlace de competidor'}
            </h4>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm text-gray-600">Competidor</label>
                <select
                  value={linkForm.competitorId}
                  onChange={(e) => setLinkForm((prev) => ({ ...prev, competitorId: e.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar competidor</option>
                  {competitors.map((competitor) => (
                    <option key={competitor.id} value={competitor.id}>
                      {competitor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">URL</label>
                <input
                  type="url"
                  value={linkForm.url}
                  onChange={(e) => setLinkForm((prev) => ({ ...prev, url: e.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">Selector CSS (opcional)</label>
                <input
                  type="text"
                  value={linkForm.selector}
                  onChange={(e) => setLinkForm((prev) => ({ ...prev, selector: e.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  placeholder=".price"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">SKU competidor (opcional)</label>
                <input
                  type="text"
                  value={linkForm.sku_competidor}
                  onChange={(e) => setLinkForm((prev) => ({ ...prev, sku_competidor: e.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void onSubmitLink()}
                disabled={savingLink}
                className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingLink ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
