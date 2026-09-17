/**
 * Cálculo de precio de venta a partir del costo del proveedor y un margen.
 * Redondeo "psicológico" hacia arriba para dejar precios limpios.
 */
export function computeSalePrice(cost: number, marginPct: number): number {
  const c = Math.max(0, Math.round(cost));
  if (c === 0) return 0;
  const raw = c * (1 + marginPct / 100);
  // Redondeo hacia arriba: a la decena bajo $10.000, a la centena sobre eso.
  const step = raw >= 10000 ? 100 : 10;
  const rounded = Math.ceil(raw / step) * step;
  return Math.max(rounded, c); // nunca vender bajo el costo
}

const ACCENTS: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', ñ: 'n' };

/** Genera un slug estable a partir del nombre + sku del proveedor. */
export function makeSlug(name: string, sku: string): string {
  const base = name
    .toLowerCase()
    .replace(/[áéíóúüñ]/g, (m) => ACCENTS[m] || m)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  const suffix = String(sku || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(-6);
  return suffix ? `${base}-${suffix}` : base;
}
