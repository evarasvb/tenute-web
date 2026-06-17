/**
 * Nutre el catálogo con códigos de barra (EAN) desde la "matriz"/proveedores
 * (catálogo VTEX de Dimerc, Prisa). Empareja por nombre, valida el EAN-13 y
 * deduplica antes de escribir (evita el choque del índice único de barcode).
 *
 * Pensado para correr en GitHub Actions (con internet). Env requeridas:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso: tsx scripts/fill-eans-ci.ts [--dry-run]
 */
import pLimit from 'p-limit';
import { createAdminClient } from '@/lib/supabase';
import { validateEAN13 } from '@/lib/ean';
import { toEan13, planEanAssignments, type EanAssignmentInput } from '@/lib/barcode';
import { parseVtexEans, bestEanForName } from '@/lib/ean-sources';

const UA = 'Mozilla/5.0 (compatible; TenuteBot/1.0)';
const TIMEOUT_MS = 8000;
const HOSTS = ['www.dimerc.cl', 'www.prisa.cl'];

async function fetchJson(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function findEanForProduct(name: string): Promise<string | null> {
  for (const host of HOSTS) {
    const payload = await fetchJson(
      `https://${host}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(name)}&_from=0&_to=4`
    );
    const best = bestEanForName(name, parseVtexEans(payload));
    if (best) return best.ean;
  }
  return null;
}

const hasValidEan = (barcode: string | null) => !!barcode && validateEAN13(toEan13(barcode));

interface ProductRow { id: string; name: string; barcode: string | null }

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const supabase = createAdminClient();

  // Traer todos los productos (paginado).
  const products: ProductRow[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('products')
      .select('id,name,barcode')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as ProductRow[];
    products.push(...rows);
    if (rows.length < pageSize) break;
  }

  const pending = products.filter((p) => !hasValidEan(p.barcode));
  console.log(`[ean-ci] dryRun=${dryRun} | productos=${products.length} | sin EAN válido=${pending.length}`);
  if (pending.length === 0) {
    console.log('[ean-ci] Nada que nutrir. 🎉');
    return;
  }

  const limit = pLimit(5);
  const found: EanAssignmentInput[] = [];
  let processed = 0;
  await Promise.all(
    pending.map((p) =>
      limit(async () => {
        const ean = await findEanForProduct(p.name);
        processed++;
        if (ean) found.push({ product_id: p.id, ean });
        if (processed % 50 === 0) {
          console.log(`[ean-ci] ${processed}/${pending.length} (con EAN: ${found.length})`);
        }
      })
    )
  );
  console.log(`[ean-ci] candidatos con EAN encontrado: ${found.length}`);

  // EANs ya usados por productos con EAN válido (para no chocar).
  const takenByOther = new Map<string, string>();
  for (const p of products) {
    if (hasValidEan(p.barcode)) takenByOther.set(toEan13(p.barcode), p.id);
  }

  const plan = planEanAssignments(found, { takenByOther });
  console.log(`[ean-ci] a aplicar=${plan.apply.length} | omitidos(dup/conflicto)=${plan.skipped.length}`);

  if (dryRun) {
    console.log('[ean-ci] dry-run: no se escribe nada.');
    return;
  }

  let applied = 0;
  let failed = 0;
  for (const a of plan.apply) {
    const { error } = await supabase
      .from('products')
      .update({ barcode: a.ean, updated_at: new Date().toISOString() })
      .eq('id', a.product_id);
    if (error) failed++;
    else applied++;
  }
  console.log(`[ean-ci] RESUMEN -> aplicados=${applied} fallidos=${failed}`);
}

main().catch((error) => {
  console.error('[ean-ci] error fatal:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
