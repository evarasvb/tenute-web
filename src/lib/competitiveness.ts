import { CompetitivenessEmailPayload, CompetitivenessEntry, CompetitivenessPayload } from '@/lib/competitiveness-types';
import { createAdminClient } from '@/lib/supabase';
import { sendEmailViaResend } from '@/lib/resend-client';

type NullableNumber = number | null;

interface PricingReferenceRow {
  id: string | number;
  sku: string | null;
  name: string | null;
  precio_nuestro: NullableNumber;
  costo: NullableNumber;
  precio_min: NullableNumber;
  precio_mediana: NullableNumber;
  precio_max: NullableNumber;
  competidores_con_precio: number | null;
  pct_vs_mediana: NullableNumber;
  clasificacion: string | null;
}

interface ProductStockRow {
  id: string | number;
  stock: number | null;
  stock_ocoa: number | null;
  stock_local21: number | null;
}

interface OrderRow {
  id: string | number;
  status?: string | null;
}

interface OrderItemRow {
  product_id: string | number;
  quantity: number | null;
  subtotal?: number | null;
}

function numOrNull(value: unknown): NullableNumber {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return 0;
}

function normalizeClassification(row: PricingReferenceRow): CompetitivenessEntry['clasificacion'] {
  const raw = (row.clasificacion || '').trim();
  if (raw === 'sobre_mercado' || raw === 'en_mercado' || raw === 'bajo_mercado') {
    return raw;
  }
  if (!row.competidores_con_precio || row.precio_mediana == null) {
    return 'sin_referencia';
  }
  return 'sin_referencia';
}

function computeStockActual(product?: ProductStockRow): number {
  if (!product) return 0;
  const fromWarehouses = toNumber(product.stock_ocoa) + toNumber(product.stock_local21);
  if (fromWarehouses > 0) return fromWarehouses;
  return toNumber(product.stock);
}

function monthRange() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { monthStart, monthEnd };
}

function buildEntry(row: PricingReferenceRow, stockActual: number): CompetitivenessEntry {
  const precioNuestro = numOrNull(row.precio_nuestro);
  const precioMediana = numOrNull(row.precio_mediana);
  const diferenciaAbs =
    precioNuestro != null && precioMediana != null ? precioNuestro - precioMediana : null;
  const diferenciaPct = numOrNull(row.pct_vs_mediana);
  const impactoPotencial =
    precioNuestro != null && precioMediana != null
      ? Math.max(0, precioMediana - precioNuestro) * stockActual
      : null;

  return {
    id: String(row.id),
    sku: row.sku || '-',
    name: row.name || '(Sin nombre)',
    clasificacion: normalizeClassification(row),
    precioNuestro,
    costo: numOrNull(row.costo),
    precioMin: numOrNull(row.precio_min),
    precioMediana,
    precioMax: numOrNull(row.precio_max),
    competidoresConPrecio: toNumber(row.competidores_con_precio),
    diferenciaAbs,
    diferenciaPct,
    stockActual,
    impactoPotencial,
    productoUrl: `/admin/products/${row.id}`,
  };
}

export async function getCompetitivenessData(supabase: any): Promise<CompetitivenessPayload> {
  const { data: viewRows, error: viewError } = await supabase
    .from('v_product_pricing_reference')
    .select(
      'id, sku, name, precio_nuestro, costo, precio_min, precio_mediana, precio_max, competidores_con_precio, pct_vs_mediana, clasificacion'
    );

  if (viewError) {
    throw new Error(`No se pudo cargar competitividad: ${viewError.message}`);
  }

  const { data: productsStockRows } = await supabase
    .from('products')
    .select('id, stock, stock_ocoa, stock_local21');

  const stockByProductId = new Map<string, ProductStockRow>();
  for (const row of (productsStockRows || []) as ProductStockRow[]) {
    stockByProductId.set(String(row.id), row);
  }

  const allEntries = ((viewRows || []) as PricingReferenceRow[]).map((row) =>
    buildEntry(row, computeStockActual(stockByProductId.get(String(row.id))))
  );

  const kpis = {
    sobreMercado: allEntries.filter((row) => row.clasificacion === 'sobre_mercado').length,
    enMercado: allEntries.filter((row) => row.clasificacion === 'en_mercado').length,
    bajoMercado: allEntries.filter((row) => row.clasificacion === 'bajo_mercado').length,
    sinReferencia: allEntries.filter((row) => row.clasificacion === 'sin_referencia').length,
  };

  const sobreMercado = [...allEntries]
    .filter((row) => row.clasificacion === 'sobre_mercado')
    .sort((a, b) => (b.diferenciaPct ?? -Infinity) - (a.diferenciaPct ?? -Infinity))
    .slice(0, 20);

  const bajoMercado = [...allEntries]
    .filter((row) => row.clasificacion === 'bajo_mercado')
    .sort((a, b) => (a.diferenciaPct ?? Infinity) - (b.diferenciaPct ?? Infinity))
    .slice(0, 20);

  const { monthStart, monthEnd } = monthRange();
  const { data: ordersRows } = await supabase
    .from('orders')
    .select('id, status, created_at')
    .gte('created_at', monthStart.toISOString())
    .lt('created_at', monthEnd.toISOString());

  const validOrders = ((ordersRows || []) as OrderRow[]).filter((order) => order.status !== 'cancelled');
  const orderIds = validOrders.map((order) => order.id);

  const soldQtyByProductId = new Map<string, number>();
  const soldRevenueByProductId = new Map<string, number>();
  if (orderIds.length > 0) {
    const { data: orderItemsRows } = await supabase
      .from('order_items')
      .select('product_id, quantity, subtotal')
      .in('order_id', orderIds);

    for (const item of (orderItemsRows || []) as OrderItemRow[]) {
      const key = String(item.product_id);
      soldQtyByProductId.set(key, (soldQtyByProductId.get(key) || 0) + toNumber(item.quantity));
      soldRevenueByProductId.set(key, (soldRevenueByProductId.get(key) || 0) + toNumber(item.subtotal));
    }
  }

  const topSoldIds = Array.from(soldQtyByProductId.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([productId]) => productId);

  const entryById = new Map(allEntries.map((entry) => [entry.id, entry] as const));
  const topVendidos: CompetitivenessEntry[] = topSoldIds
    .map((id, index) => {
      const entry = entryById.get(id);
      if (!entry) return null;
      return {
        ...entry,
        ranking: index + 1,
        unidadesVendidasMes: soldQtyByProductId.get(id) || 0,
        ingresos30d: soldRevenueByProductId.get(id) || 0,
      } as CompetitivenessEntry;
    })
    .filter(Boolean) as CompetitivenessEntry[];

  const ingresosSobreMercado30d = topVendidos
    .filter((row) => row.clasificacion === 'sobre_mercado')
    .reduce((sum, row) => sum + toNumber(row.ingresos30d), 0);

  const ingresosBajoMercado30d = topVendidos
    .filter((row) => row.clasificacion === 'bajo_mercado')
    .reduce((sum, row) => sum + toNumber(row.ingresos30d), 0);

  const { data: profileData } = await supabase
    .from('admin_profiles')
    .select('email')
    .limit(1)
    .maybeSingle();

  const adminEmail =
    (profileData?.email as string | undefined) ||
    process.env.TENUTE_NOTIFICATION_EMAIL ||
    process.env.TENUTE_BILLING_EMAIL ||
    null;

  return {
    generatedAt: new Date().toISOString(),
    adminEmail,
    kpis: {
      ...kpis,
      ingresosSobreMercado30d,
      ingresosBajoMercado30d,
    },
    tables: {
      sobreMercado,
      bajoMercado,
      topVendidos,
    },
  };
}

function formatCLP(value: NullableNumber): string {
  if (value == null) return '—';
  return value.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });
}

function formatPct(value: NullableNumber): string {
  if (value == null) return '—';
  return `${value.toFixed(2)}%`;
}

function buildRowsHtml(entries: CompetitivenessEntry[]): string {
  return entries
    .map(
      (row) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${row.sku}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${row.name}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCLP(row.precioNuestro)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCLP(row.precioMediana)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCLP(row.diferenciaAbs)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatPct(row.diferenciaPct)}</td>
        </tr>`
    )
    .join('');
}

export async function sendCompetitivenessSummaryEmail(params: {
  to: string;
  payload: CompetitivenessPayload;
}): Promise<CompetitivenessEmailPayload> {
  const from = process.env.RESEND_FROM || 'Tenute <onboarding@resend.dev>';
  const topSobre = params.payload.tables.sobreMercado.slice(0, 10);
  const topBajo = params.payload.tables.bajoMercado.slice(0, 10);

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <h2 style="margin:0 0 8px 0;color:#3f6212;">Resumen de competitividad Tenute</h2>
      <p style="margin:0 0 16px 0;color:#4b5563;">Generado: ${new Date(params.payload.generatedAt).toLocaleString('es-CL')}</p>
      <p style="margin:0 0 8px 0;"><strong>KPIs:</strong> sobre mercado ${params.payload.kpis.sobreMercado}, en mercado ${params.payload.kpis.enMercado}, bajo mercado ${params.payload.kpis.bajoMercado}, sin referencia ${params.payload.kpis.sinReferencia}.</p>
      <h3 style="margin:20px 0 8px 0;color:#991b1b;">Top 10 sobre mercado</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f9fafb;"><th style="text-align:left;padding:8px;">SKU</th><th style="text-align:left;padding:8px;">Producto</th><th style="padding:8px;text-align:right;">Nuestro</th><th style="padding:8px;text-align:right;">Mediana</th><th style="padding:8px;text-align:right;">Dif. $</th><th style="padding:8px;text-align:right;">Dif. %</th></tr></thead>
        <tbody>${buildRowsHtml(topSobre)}</tbody>
      </table>
      <h3 style="margin:20px 0 8px 0;color:#166534;">Top 10 bajo mercado</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f9fafb;"><th style="text-align:left;padding:8px;">SKU</th><th style="text-align:left;padding:8px;">Producto</th><th style="padding:8px;text-align:right;">Nuestro</th><th style="padding:8px;text-align:right;">Mediana</th><th style="padding:8px;text-align:right;">Dif. $</th><th style="padding:8px;text-align:right;">Dif. %</th></tr></thead>
        <tbody>${buildRowsHtml(topBajo)}</tbody>
      </table>
    </div>
  `;

  const result = await sendEmailViaResend({
    from,
    to: params.to,
    subject: 'Tenute · Resumen de competitividad',
    html,
  });

  return {
    sentTo: params.to,
    topSobreCount: topSobre.length,
    topBajoCount: topBajo.length,
    providerId: result.data?.id,
  };
}

export async function getCompetitivenessDataWithAdminClient(): Promise<CompetitivenessPayload> {
  const supabase = createAdminClient();
  return getCompetitivenessData(supabase);
}
