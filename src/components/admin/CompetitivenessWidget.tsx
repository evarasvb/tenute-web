'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  CompetitivenessEntry,
  CompetitivenessPayload,
  CompetitivenessClassification,
} from '@/lib/competitiveness-types';

type TabKey = 'sobre' | 'bajo';

function formatCLP(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });
}

function formatPct(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(2)}%`;
}

function classificationBadgeClass(clasificacion: CompetitivenessClassification): string {
  if (clasificacion === 'sobre_mercado') return 'bg-red-100 text-red-700';
  if (clasificacion === 'bajo_mercado') return 'bg-green-100 text-green-700';
  if (clasificacion === 'en_mercado') return 'bg-gray-100 text-gray-700';
  return 'bg-gray-100 text-gray-500';
}

function classificationLabel(clasificacion: CompetitivenessClassification): string {
  if (clasificacion === 'sobre_mercado') return 'Sobre mercado';
  if (clasificacion === 'bajo_mercado') return 'Bajo mercado';
  if (clasificacion === 'en_mercado') return 'En mercado';
  return 'Sin referencia';
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const escapeCell = (value: string | number) => {
    const raw = String(value ?? '');
    if (/[",\n]/.test(raw)) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };
  const csv = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function TabButton(props: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        props.active
          ? 'bg-green-700 text-white'
          : 'bg-green-50 text-green-800 hover:bg-green-100'
      }`}
    >
      {props.children}
    </button>
  );
}

function TableContainer(props: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onExportCsv: () => void;
}) {
  return (
    <div className="rounded-xl border border-green-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-green-100 px-4 py-3">
        <div>
          <h4 className="text-sm font-semibold text-green-900">{props.title}</h4>
          <p className="text-xs text-gray-500">{props.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={props.onExportCsv}
          className="rounded-lg border border-green-300 px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-50"
        >
          Exportar CSV
        </button>
      </div>
      <div className="overflow-x-auto">{props.children}</div>
    </div>
  );
}

function RowsTable(props: {
  rows: CompetitivenessEntry[];
  includeImpact?: boolean;
  includeUnits?: boolean;
  includeRanking?: boolean;
  includeRevenue?: boolean;
  highlightTopVsMarket?: boolean;
}) {
  if (props.rows.length === 0) {
    return <div className="px-4 py-10 text-center text-sm text-gray-500">Sin resultados.</div>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-green-50 text-left text-xs uppercase tracking-wide text-green-900">
          {props.includeRanking && <th className="px-3 py-2 text-right">#</th>}
          <th className="px-3 py-2">SKU</th>
          <th className="px-3 py-2">Producto</th>
          {props.includeUnits && <th className="px-3 py-2 text-right">Unidades 30d</th>}
          {props.includeRevenue && <th className="px-3 py-2 text-right">Ingresos 30d</th>}
          <th className="px-3 py-2 text-right">Precio nuestro</th>
          <th className="px-3 py-2 text-right">Mediana mercado</th>
          <th className="px-3 py-2 text-right">Dif. $</th>
          <th className="px-3 py-2 text-right">Dif. %</th>
          {props.includeImpact && <th className="px-3 py-2 text-right">Impacto potencial</th>}
          <th className="px-3 py-2">Estado</th>
          <th className="px-3 py-2">Acción</th>
        </tr>
      </thead>
      <tbody>
        {props.rows.map((row) => {
          const pct = row.diferenciaPct ?? 0;
          const isHighRisk = props.highlightTopVsMarket && pct > 10;
          const isOpportunity = props.highlightTopVsMarket && pct < -10;
          return (
          <tr
            key={row.id}
            className={`border-t border-gray-100 ${
              isHighRisk ? 'bg-red-50/60' : isOpportunity ? 'bg-green-50/60' : ''
            }`}
          >
            {props.includeRanking && (
              <td className="px-3 py-2 text-right font-semibold text-gray-700">{row.ranking || '—'}</td>
            )}
            <td className="px-3 py-2 font-mono text-xs text-gray-700">{row.sku}</td>
            <td className="px-3 py-2 text-gray-900">{row.name}</td>
            {props.includeUnits && (
              <td className="px-3 py-2 text-right font-semibold text-gray-900">{row.unidadesVendidasMes || 0}</td>
            )}
            {props.includeRevenue && (
              <td className="px-3 py-2 text-right">{formatCLP(row.ingresos30d ?? null)}</td>
            )}
            <td className="px-3 py-2 text-right">{formatCLP(row.precioNuestro)}</td>
            <td className="px-3 py-2 text-right">{formatCLP(row.precioMediana)}</td>
            <td className="px-3 py-2 text-right">{formatCLP(row.diferenciaAbs)}</td>
            <td className={`px-3 py-2 text-right ${isHighRisk ? 'text-red-700 font-semibold' : isOpportunity ? 'text-green-700 font-semibold' : ''}`}>
              {formatPct(row.diferenciaPct)}
            </td>
            {props.includeImpact && (
              <td className="px-3 py-2 text-right">{formatCLP(row.impactoPotencial)}</td>
            )}
            <td className="px-3 py-2">
              <div className="flex items-center gap-1">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${classificationBadgeClass(row.clasificacion)}`}
                >
                  {classificationLabel(row.clasificacion)}
                </span>
                {isOpportunity && <span className="text-sm" title="Oportunidad de subir precio">💰</span>}
              </div>
            </td>
            <td className="px-3 py-2">
              <Link
                className="text-xs font-medium text-green-700 hover:text-green-900 hover:underline"
                href={row.productoUrl}
              >
                Ver producto
              </Link>
            </td>
          </tr>
        )})}
      </tbody>
    </table>
  );
}

export default function CompetitivenessWidget(props: { payload: CompetitivenessPayload }) {
  const [activeTab, setActiveTab] = useState<TabKey>('sobre');
  const [emailing, setEmailing] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState(props.payload.adminEmail || '');

  const tables = props.payload.tables;
  const generatedAt = useMemo(
    () => new Date(props.payload.generatedAt).toLocaleString('es-CL'),
    [props.payload.generatedAt]
  );

  const exportSobre = () => {
    downloadCsv(
      'competitividad_sobre_mercado.csv',
      ['sku', 'nombre', 'precio_nuestro', 'precio_mediana', 'diferencia_abs', 'diferencia_pct'],
      tables.sobreMercado.map((row) => [
        row.sku,
        row.name,
        row.precioNuestro ?? '',
        row.precioMediana ?? '',
        row.diferenciaAbs ?? '',
        row.diferenciaPct ?? '',
      ])
    );
  };

  const exportBajo = () => {
    downloadCsv(
      'competitividad_bajo_mercado.csv',
      [
        'sku',
        'nombre',
        'precio_nuestro',
        'precio_mediana',
        'diferencia_abs',
        'diferencia_pct',
        'stock_actual',
        'impacto_potencial',
      ],
      tables.bajoMercado.map((row) => [
        row.sku,
        row.name,
        row.precioNuestro ?? '',
        row.precioMediana ?? '',
        row.diferenciaAbs ?? '',
        row.diferenciaPct ?? '',
        row.stockActual,
        row.impactoPotencial ?? '',
      ])
    );
  };

  const exportTop = () => {
    downloadCsv(
      'competitividad_top_vendidos_mes.csv',
      [
        'ranking',
        'sku',
        'nombre',
        'unidades_vendidas_mes',
        'ingresos_30d',
        'precio_nuestro',
        'precio_mediana',
        'diferencia_abs',
        'diferencia_pct',
      ],
      tables.topVendidos.map((row) => [
        row.ranking || '',
        row.sku,
        row.name,
        row.unidadesVendidasMes || 0,
        row.ingresos30d ?? '',
        row.precioNuestro ?? '',
        row.precioMediana ?? '',
        row.diferenciaAbs ?? '',
        row.diferenciaPct ?? '',
      ])
    );
  };

  const sendSummaryEmail = async () => {
    setEmailing(true);
    setEmailError(null);
    setEmailMessage(null);
    try {
      const response = await fetch('/api/admin/competitiveness/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTo || undefined }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error || 'No se pudo enviar el resumen');
      }
      setEmailMessage(`Resumen enviado a ${body.sentTo}`);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Error enviando email');
    } finally {
      setEmailing(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-green-200 bg-green-50/30 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-green-900">Competitividad</h3>
          <p className="text-xs text-gray-600">Referencia de precios vs mercado · actualizado {generatedAt}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="email"
            value={emailTo}
            onChange={(event) => setEmailTo(event.target.value)}
            placeholder="Email admin"
            className="rounded-lg border border-green-200 bg-white px-3 py-2 text-sm text-gray-700"
          />
          <button
            type="button"
            onClick={() => void sendSummaryEmail()}
            disabled={emailing}
            className="rounded-lg bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
          >
            {emailing ? 'Enviando...' : 'Enviar resumen por email'}
          </button>
        </div>
      </div>

      {emailMessage && <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">{emailMessage}</p>}
      {emailError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{emailError}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-red-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-red-600">Sobre mercado</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{props.payload.kpis.sobreMercado}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-600">En mercado</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{props.payload.kpis.enMercado}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-green-700">Bajo mercado</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{props.payload.kpis.bajoMercado}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Sin referencia</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{props.payload.kpis.sinReferencia}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-red-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-red-600">Ingresos 30d en sobre mercado</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{formatCLP(props.payload.kpis.ingresosSobreMercado30d)}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-green-700">Ingresos 30d en bajo mercado</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{formatCLP(props.payload.kpis.ingresosBajoMercado30d)}</p>
        </div>
      </div>

      <TableContainer
        title="Competitividad vs Más Vendidos"
        subtitle="Top 20 productos por unidades vendidas en los últimos 30 días"
        onExportCsv={exportTop}
      >
        <RowsTable
          rows={tables.topVendidos}
          includeRanking
          includeUnits
          includeRevenue
          highlightTopVsMarket
        />
      </TableContainer>

      <div className="flex flex-wrap gap-2">
        <TabButton active={activeTab === 'sobre'} onClick={() => setActiveTab('sobre')}>
          Mayores diferencias hacia arriba
        </TabButton>
        <TabButton active={activeTab === 'bajo'} onClick={() => setActiveTab('bajo')}>
          Oportunidades de subir precio
        </TabButton>
      </div>

      {activeTab === 'sobre' && (
        <TableContainer
          title="Mayores diferencias hacia arriba"
          subtitle="Productos sobre mercado ordenados por diferencia porcentual"
          onExportCsv={exportSobre}
        >
          <RowsTable rows={tables.sobreMercado} />
        </TableContainer>
      )}

      {activeTab === 'bajo' && (
        <TableContainer
          title="Oportunidades de subir precio"
          subtitle="Productos bajo mercado ordenados por diferencia porcentual (ascendente)"
          onExportCsv={exportBajo}
        >
          <RowsTable rows={tables.bajoMercado} includeImpact />
        </TableContainer>
      )}

    </section>
  );
}
