#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

type GenericRow = Record<string, unknown>;

function loadDotEnv() {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta variable de entorno requerida: ${name}`);
  }
  return value;
}

function getSupabaseUrlFromEnv(): string {
  const direct = process.env.SUPABASE_URL;
  if (direct) return direct;
  const legacy = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (legacy) return legacy;
  throw new Error('Falta variable de entorno requerida: SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL como fallback)');
}

function normalizeClassification(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatCLP(value: unknown): string {
  const n = asNumber(value);
  if (n === null) return '—';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

function formatPct(value: unknown): string {
  const n = asNumber(value);
  if (n === null) return '—';
  return `${n.toFixed(2)}%`;
}

function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getByCandidates<T = unknown>(row: GenericRow, candidates: string[]): T | undefined {
  for (const key of candidates) {
    if (key in row) return row[key] as T;
  }
  return undefined;
}

function productLabel(row: GenericRow): string {
  const sku = getByCandidates<string>(row, ['sku', 'product_sku', 'codigo', 'codigo_producto']);
  const name = getByCandidates<string>(row, ['name', 'product_name', 'nombre', 'nombre_producto']);
  if (sku && name) return `${sku} - ${name}`;
  if (name) return String(name);
  if (sku) return String(sku);
  return 'Producto sin nombre';
}

function pctValue(row: GenericRow): number {
  const value = asNumber(getByCandidates(row, ['pct_vs_mediana', 'pct_vs_median', 'pct_delta']));
  return value ?? Number.NEGATIVE_INFINITY;
}

function buildTable(title: string, rows: GenericRow[]): string {
  const body = rows
    .map((row) => {
      const price = getByCandidates(row, ['price', 'precio_tenute', 'precio', 'precio_producto']);
      const mediana = getByCandidates(row, ['mediana_mercado', 'median_market_price', 'precio_mediana', 'mediana']);
      const pct = getByCandidates(row, ['pct_vs_mediana', 'pct_vs_median', 'pct_delta']);
      const clasificacion = getByCandidates(row, ['clasificacion', 'classification']) ?? 'sin_clasificacion';

      return `<tr>
  <td style="border:1px solid #ddd;padding:8px;">${escapeHtml(productLabel(row))}</td>
  <td style="border:1px solid #ddd;padding:8px;">${escapeHtml(clasificacion)}</td>
  <td style="border:1px solid #ddd;padding:8px;text-align:right;">${escapeHtml(formatCLP(price))}</td>
  <td style="border:1px solid #ddd;padding:8px;text-align:right;">${escapeHtml(formatCLP(mediana))}</td>
  <td style="border:1px solid #ddd;padding:8px;text-align:right;">${escapeHtml(formatPct(pct))}</td>
</tr>`;
    })
    .join('\n');

  return `
<h2 style="font-size:18px;margin:24px 0 10px;color:#111827;">${escapeHtml(title)}</h2>
<table style="border-collapse:collapse;width:100%;font-size:14px;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="border:1px solid #ddd;padding:8px;text-align:left;">Producto</th>
      <th style="border:1px solid #ddd;padding:8px;text-align:left;">Clasificación</th>
      <th style="border:1px solid #ddd;padding:8px;text-align:right;">Precio Tenute</th>
      <th style="border:1px solid #ddd;padding:8px;text-align:right;">Mediana mercado</th>
      <th style="border:1px solid #ddd;padding:8px;text-align:right;">% vs mediana</th>
    </tr>
  </thead>
  <tbody>
    ${body || '<tr><td colspan="5" style="border:1px solid #ddd;padding:8px;">Sin datos disponibles</td></tr>'}
  </tbody>
</table>`;
}

async function sendWithResend(params: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  const text = await response.text();
  let body: Record<string, unknown> = {};
  try {
    body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    body = { raw: text };
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

function isSenderVerificationError(response: { status: number; body: Record<string, unknown> }): boolean {
  const msg = `${response.body.message ?? ''} ${response.body.name ?? ''}`.toLowerCase();
  return response.status === 403 || msg.includes('verify') || msg.includes('verification') || msg.includes('domain');
}

async function main() {
  loadDotEnv();

  const supabaseUrl = getSupabaseUrlFromEnv();
  const supabaseServiceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const resendApiKey = requireEnv('RESEND_API_KEY');

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const today = new Date();
  const dateLabel = today.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const subject = `📊 Reporte de competitividad Tenute - ${dateLabel}`;

  console.log('🔎 Consultando vista v_product_pricing_reference...');
  const { data: allRows, error: allError } = await supabase.from('v_product_pricing_reference').select('*');
  if (allError) {
    throw new Error(`Error consultando vista principal: ${allError.message}`);
  }

  const { data: overRows, error: overError } = await supabase
    .from('v_product_pricing_reference')
    .select('*')
    .eq('clasificacion', 'sobre_mercado')
    .order('pct_vs_mediana', { ascending: false })
    .limit(10);
  if (overError) {
    throw new Error(`Error obteniendo top sobre_mercado: ${overError.message}`);
  }

  const { data: underRows, error: underError } = await supabase
    .from('v_product_pricing_reference')
    .select('*')
    .eq('clasificacion', 'bajo_mercado')
    .order('pct_vs_mediana', { ascending: true })
    .limit(10);
  if (underError) {
    throw new Error(`Error obteniendo top bajo_mercado: ${underError.message}`);
  }

  const rows = (allRows ?? []) as GenericRow[];
  const normalizedOver = (overRows ?? []) as GenericRow[];
  const normalizedUnder = (underRows ?? []) as GenericRow[];

  const totalProducts = rows.length;
  const withReference = rows.filter((row) => asNumber(getByCandidates(row, ['pct_vs_mediana', 'pct_vs_median', 'pct_delta'])) !== null).length;
  const withoutReference = totalProducts - withReference;

  const classificationCount = new Map<string, number>();
  for (const row of rows) {
    const rawValue = getByCandidates<string>(row, ['clasificacion', 'classification']) ?? 'sin_clasificacion';
    const key = String(rawValue || 'sin_clasificacion');
    classificationCount.set(key, (classificationCount.get(key) ?? 0) + 1);
  }

  const sortedDistribution = Array.from(classificationCount.entries()).sort((a, b) => b[1] - a[1]);
  const distributionHtml = sortedDistribution
    .map(([key, count]) => `<li><strong>${escapeHtml(key)}:</strong> ${count}</li>`)
    .join('');

  const fallbackOver = rows
    .filter((row) => normalizeClassification(getByCandidates(row, ['clasificacion', 'classification'])) === 'sobre_mercado')
    .sort((a, b) => pctValue(b) - pctValue(a))
    .slice(0, 10);

  const fallbackUnder = rows
    .filter((row) => normalizeClassification(getByCandidates(row, ['clasificacion', 'classification'])) === 'bajo_mercado')
    .sort((a, b) => pctValue(a) - pctValue(b))
    .slice(0, 10);

  const finalOver = normalizedOver.length > 0 ? normalizedOver : fallbackOver;
  const finalUnder = normalizedUnder.length > 0 ? normalizedUnder : fallbackUnder;

  const html = `
<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.45;max-width:900px;margin:0 auto;">
  <h1 style="font-size:24px;margin-bottom:12px;">📊 Reporte de competitividad Tenute</h1>
  <p style="margin:0 0 18px 0;">Fecha: <strong>${escapeHtml(dateLabel)}</strong></p>

  <h2 style="font-size:18px;margin:10px 0;color:#111827;">Resumen</h2>
  <ul style="margin:0 0 14px 20px;padding:0;">
    <li><strong>Total productos evaluados:</strong> ${totalProducts}</li>
    <li><strong>Con referencia de mercado:</strong> ${withReference}</li>
    <li><strong>Sin referencia de mercado:</strong> ${withoutReference}</li>
  </ul>

  <h3 style="font-size:16px;margin:8px 0;">Distribución por clasificación</h3>
  <ul style="margin:0 0 18px 20px;padding:0;">
    ${distributionHtml || '<li>Sin clasificaciones disponibles</li>'}
  </ul>

  ${buildTable('Estamos más caros que el mercado', finalOver)}
  ${buildTable('Estamos más baratos (oportunidad de subir)', finalUnder)}

  <p style="margin-top:28px;color:#6b7280;font-size:13px;">
    Próximamente disponible en /admin &gt; Competitividad
  </p>
</div>`;

  const recipient = 'evaras@firmavb.cl';
  const preferredSender = 'Tenute <reportes@tenute.cl>';
  const fallbackSender = 'Tenute <onboarding@resend.dev>';

  console.log('📨 Enviando reporte con sender principal...');
  let sendResult = await sendWithResend({
    apiKey: resendApiKey,
    from: preferredSender,
    to: recipient,
    subject,
    html,
  });

  let usedSender = preferredSender;
  if (!sendResult.ok && isSenderVerificationError(sendResult)) {
    console.warn('⚠️ Sender no verificado o rechazado. Reintentando con onboarding@resend.dev...');
    sendResult = await sendWithResend({
      apiKey: resendApiKey,
      from: fallbackSender,
      to: recipient,
      subject,
      html,
    });
    usedSender = fallbackSender;
  }

  if (!sendResult.ok) {
    throw new Error(
      `Resend error (status ${sendResult.status}): ${JSON.stringify(sendResult.body)}`
    );
  }

  console.log('✅ Email enviado correctamente');
  console.log(`   From: ${usedSender}`);
  console.log(`   To: ${recipient}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Resend ID: ${String(sendResult.body.id ?? 'sin-id')}`);
  console.log(`   Totales -> productos: ${totalProducts}, con referencia: ${withReference}, sin referencia: ${withoutReference}`);
}

main().catch((error) => {
  console.error('❌ Falló el envío del reporte de competitividad');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
