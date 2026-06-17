/**
 * Fuentes de códigos EAN desde la "matriz" / proveedores (catálogo VTEX de
 * Dimerc, Prisa, etc.). La API pública de catálogo VTEX
 * (`/api/catalog_system/pub/products/search?ft=...`) devuelve, por producto,
 * `items[].ean`. Aquí están las funciones PURAS (parseo + emparejamiento por
 * nombre) para poder testearlas sin red.
 */

import { validateEAN13 } from '@/lib/ean';
import { toEan13 } from '@/lib/barcode';

export interface EanCandidate {
  name: string;
  ean: string;
}

const STOP = new Set([
  'de', 'con', 'sin', 'y', 'para', 'el', 'la', 'un', 'una', 'x', 'cm', 'mm', 'cc',
  'gr', 'grs', 'kg', 'lt', 'ml', 'oz', 'un', 'uds', 'und', 'pqte', 'paquete',
  'bolsa', 'caja', 'cj', 'u', 'set', 'mt', 'm',
]);

function tokens(value: string): Set<string> {
  return new Set(
    (value || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ')
      .split(/\s+/)
      .filter((t) => t && !STOP.has(t))
  );
}

/** Similitud de Jaccard sobre tokens del nombre (0..1). */
export function nameSimilarity(a: string, b: string): number {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

/** Extrae { name, ean } de la respuesta de búsqueda de catálogo VTEX. */
export function parseVtexEans(payload: unknown): EanCandidate[] {
  if (!Array.isArray(payload)) return [];
  const out: EanCandidate[] = [];
  for (const product of payload) {
    if (!product || typeof product !== 'object') continue;
    const name = typeof (product as { productName?: unknown }).productName === 'string'
      ? (product as { productName: string }).productName
      : '';
    const items = (product as { items?: unknown }).items;
    if (!name || !Array.isArray(items)) continue;
    for (const item of items) {
      const ean = item && typeof item === 'object' && typeof (item as { ean?: unknown }).ean === 'string'
        ? (item as { ean: string }).ean
        : '';
      if (ean) out.push({ name, ean });
    }
  }
  return out;
}

/**
 * Elige el mejor EAN para un producto: el candidato cuyo nombre se parece más al
 * nuestro (por sobre `threshold`) y cuyo EAN es un EAN-13 válido (checksum).
 * Conservador a propósito: un EAN equivocado es peor que ninguno.
 */
export function bestEanForName(
  productName: string,
  candidates: EanCandidate[],
  opts: { threshold?: number } = {}
): { ean: string; matchedName: string; score: number } | null {
  const threshold = opts.threshold ?? 0.55;
  let best: { ean: string; matchedName: string; score: number } | null = null;
  for (const c of candidates) {
    const ean = toEan13(c.ean);
    if (!validateEAN13(ean)) continue;
    const score = nameSimilarity(productName, c.name);
    if (!best || score > best.score) best = { ean, matchedName: c.name, score };
  }
  return best && best.score >= threshold ? best : null;
}
