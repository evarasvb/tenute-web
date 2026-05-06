import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildProductImageAudit, saveAuditRows } from '@/lib/product-images/audit';
import {
  fillMissingProductImages,
  getProductsWithoutValidImage,
  parseFillOptionsFromArgv,
  productImageAuditToJson,
} from '@/lib/product-images/fill';
import { ensureProductImagesBucket } from '@/lib/product-images/storage';

async function main() {
  const options = parseFillOptionsFromArgv(process.argv.slice(2));
  const dryRun = Boolean(options.dryRun);
  console.log(`[fill-product-images] dryRun=${dryRun} concurrency=${options.concurrency || 'default(5)'}`);

  const products = await getProductsWithoutValidImage(options.productIds);
  console.log(`[fill-product-images] productos a procesar=${products.length}`);

  if (!dryRun) {
    await ensureProductImagesBucket();
  }

  const result = await fillMissingProductImages(products, options);

  const tmpDir = path.resolve(process.cwd(), 'tmp');
  await mkdir(tmpDir, { recursive: true });

  const reportPath = path.resolve(tmpDir, 'fill-images.json');
  await writeFile(reportPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`[fill-product-images] reporte guardado en ${reportPath}`);
  console.log(
    `[fill-product-images] resumen processed=${result.summary.processed} success=${result.summary.success} failed=${result.summary.failed}`
  );

  const postFillProducts = await getProductsWithoutValidImage();
  const auditResult = await buildProductImageAudit(postFillProducts, {
    concurrency: options.concurrency,
  });
  if (!dryRun) {
    await saveAuditRows(auditResult.issues);
  }
  const auditPath = path.resolve(tmpDir, 'audit-images-after-fill.json');
  await writeFile(auditPath, productImageAuditToJson(auditResult), 'utf8');
  console.log(`[fill-product-images] auditoría post-fill guardada en ${auditPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[fill-product-images] error fatal:', message);
  process.exit(1);
});
