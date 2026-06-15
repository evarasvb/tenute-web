/**
 * Relleno de fotos para CI (GitHub Actions).
 *
 * Igual que `fill:images` pero SIN el paso de auditoría que escribe en la tabla
 * `product_image_audit` (que puede no existir) — así el job no falla "después"
 * de haber cargado las fotos. Reporta el resumen y los primeros fallos.
 *
 * Env requeridas: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *                 SUPABASE_SERVICE_ROLE_KEY (+ opcional PRODUCT_IMAGES_BUCKET, BING_API_KEY).
 */
import {
  fillMissingProductImages,
  getProductsWithoutValidImage,
  parseFillOptionsFromArgv,
} from '@/lib/product-images/fill';
import { ensureProductImagesBucket } from '@/lib/product-images/storage';

async function main() {
  const options = parseFillOptionsFromArgv(process.argv.slice(2));
  const dryRun = Boolean(options.dryRun);
  console.log(`[fill-ci] dryRun=${dryRun} concurrency=${options.concurrency || 'default(5)'}`);

  const products = await getProductsWithoutValidImage(options.productIds);
  console.log(`[fill-ci] productos sin imagen válida: ${products.length}`);
  if (products.length === 0) {
    console.log('[fill-ci] No hay nada que rellenar. 🎉');
    return;
  }

  if (!dryRun) {
    await ensureProductImagesBucket();
  }

  const result = await fillMissingProductImages(products, options);
  const { processed, success, failed } = result.summary;
  console.log(`[fill-ci] RESUMEN -> procesados=${processed} con_foto=${success} sin_foto=${failed} (dryRun=${dryRun})`);

  // Diagnóstico: primeros productos que quedaron sin foto y por qué.
  const fails = result.results.filter((r) => !r.success).slice(0, 25);
  for (const f of fails) {
    console.log(`[fill-ci] sin foto: ${f.sku ?? f.productId} — ${f.name} — ${f.error ?? 'sin candidatas'}`);
  }
}

main().catch((error) => {
  console.error('[fill-ci] error fatal:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
