import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runProductImageAudit } from '@/lib/product-images/audit';

interface CliOptions {
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  return {
    dryRun: argv.includes('--dry-run'),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runProductImageAudit({
    persistTable: !options.dryRun,
    exportJsonPath: path.join(process.cwd(), 'tmp', 'audit-images.json'),
  });

  const tmpDir = path.join(process.cwd(), 'tmp');
  await mkdir(tmpDir, { recursive: true });
  const outputFile = path.join(tmpDir, 'audit-images.json');
  await writeFile(outputFile, JSON.stringify(result, null, 2), 'utf8');

  console.log(
    JSON.stringify(
      {
        dryRun: options.dryRun,
        generatedAt: result.generatedAt,
        summary: result.summary,
        issueCount: result.issues.length,
        outputFile,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[audit-product-images] ${message}`);
  process.exit(1);
});
