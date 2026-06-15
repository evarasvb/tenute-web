/**
 * Utilidades puras para manejo de códigos de barra / EAN.
 *
 * Centraliza dos reglas que antes estaban dispersas y causaban el error
 * "Ese barcode ya está asignado a otro producto" / "producto ya existente":
 *
 *  1. Un código vacío o con solo espacios DEBE guardarse como NULL (nunca '').
 *     El índice único parcial `... WHERE barcode IS NOT NULL` trata '' como un
 *     valor real, así que dos productos con '' chocan. Guardar NULL lo evita.
 *
 *  2. Al asignar EAN en lote, hay que descartar duplicados (dentro del lote y
 *     contra códigos ya usados por otro producto) ANTES de escribir, en vez de
 *     dejar que la base de datos lance un error de constraint confuso.
 */

import { normalizeBarcodeDigits, validateEAN13 } from './ean';

/** Normaliza un código para escritura: '' / solo espacios -> null. */
export function cleanBarcodeForWrite(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/\s+/g, '').trim();
  return cleaned.length > 0 ? cleaned : null;
}

/** Convierte un código a EAN-13 (UPC-A de 12 dígitos -> antepone 0). */
export function toEan13(raw: string): string {
  const digits = normalizeBarcodeDigits(raw);
  return digits.length === 12 ? `0${digits}` : digits;
}

function isValidEan(raw: string | null | undefined): boolean {
  if (!raw) return false;
  return validateEAN13(toEan13(raw));
}

export interface EanAssignmentInput {
  product_id: string;
  ean: string;
}
export interface PlannedAssignment {
  product_id: string;
  ean: string;
}
export interface SkippedAssignment {
  product_id: string;
  reason: string;
}

/**
 * Decide qué asignaciones de EAN aplicar, evitando colisiones del índice único:
 *   - EAN inválido (checksum)            -> se descarta
 *   - el producto ya tiene un EAN válido -> se descarta (no se pisa)
 *   - el EAN ya lo tiene OTRO producto    -> se descarta con motivo claro
 *   - el mismo EAN aparece dos veces en el lote -> solo el primero se aplica
 *
 * Devuelve las asignaciones seguras (`apply`) y las omitidas (`skipped`) con su
 * motivo, para que la herramienta "no se rompa" y muestre un mensaje entendible.
 */
export function planEanAssignments(
  assignments: EanAssignmentInput[],
  opts: {
    /** Código actual del producto (para no pisar uno ya válido). */
    currentBarcode?: (productId: string) => string | null | undefined;
    /** EAN -> id del producto que YA lo tiene en la base (otro producto). */
    takenByOther?: Map<string, string>;
  } = {}
): { apply: PlannedAssignment[]; skipped: SkippedAssignment[] } {
  const apply: PlannedAssignment[] = [];
  const skipped: SkippedAssignment[] = [];
  const assignedInBatch = new Map<string, string>(); // ean -> product_id
  const taken = opts.takenByOther ?? new Map<string, string>();

  for (const a of assignments) {
    const ean = toEan13(a.ean);

    if (!validateEAN13(ean)) {
      skipped.push({ product_id: a.product_id, reason: `EAN inválido: ${a.ean}` });
      continue;
    }
    if (isValidEan(opts.currentBarcode?.(a.product_id))) {
      skipped.push({ product_id: a.product_id, reason: 'Ya tiene EAN válido' });
      continue;
    }
    const ownerOther = taken.get(ean);
    if (ownerOther && ownerOther !== a.product_id) {
      skipped.push({ product_id: a.product_id, reason: 'Ese EAN ya está asignado a otro producto' });
      continue;
    }
    const inBatch = assignedInBatch.get(ean);
    if (inBatch && inBatch !== a.product_id) {
      skipped.push({ product_id: a.product_id, reason: 'EAN duplicado dentro del lote' });
      continue;
    }
    assignedInBatch.set(ean, a.product_id);
    apply.push({ product_id: a.product_id, ean });
  }

  return { apply, skipped };
}
