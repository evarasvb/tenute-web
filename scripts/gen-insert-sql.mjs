#!/usr/bin/env node
/* Genera SQL de inserción por lotes desde /tmp/tenute_pdf_products.json.
 * Emite solo datos esenciales; slug y description se calculan en SQL para
 * reducir el tamaño del payload. */
import fs from 'fs';

const products = JSON.parse(fs.readFileSync('/tmp/tenute_pdf_products.json', 'utf-8'));

const CAT_ID = {
  'insumos-desechables': 'd1f8e49a-9a94-4b99-b4ed-bfb82a9922f8',
  'papeleria':           '8aced764-88ce-43eb-9787-962d83c24d68',
  'limpieza':            'ba331d40-956c-4ce5-9de5-9e81ca83691f',
};
const q = (s) => s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`;

function row(p) {
  const meta = {
    origen: 'Catalogo Visual Tenute.pdf', pdf_categoria: p.pdf_categoria,
    empaque: p.empaque, unidad_neto: p.unidad_neto,
    mayor_neto: p.mayor_neto, mayor_iva: p.mayor_iva,
  };
  const metaSql = `'${JSON.stringify(meta).replace(/'/g, "''")}'::jsonb`;
  return `(${q(p.sku)},${q(p.name)},${p.price},${p.cost_price},${p.margin},'${CAT_ID[p.category_slug]}'::uuid,${q(p.empaque)},${metaSql})`;
}

// slug se calcula con translate (acentos + espacios) + sufijo sku (garantiza unicidad)
const SELECT = `
INSERT INTO public.products (sku,name,slug,description,price,cost_price,margin,stock,active,category_id,content_info,unit,metadata)
SELECT v.sku, v.name,
  regexp_replace(
    regexp_replace(lower(translate(v.name,
      'áéíóúüñÁÉÍÓÚÜÑ ./,()',
      'aeiouunAEIOUUN------')), '[^a-z0-9-]', '', 'g'),
    '-+', '-', 'g') || '-' || v.sku AS slug,
  v.name || COALESCE(' · Empaque: ' || v.empaque, '') AS description,
  v.price, v.cost_price, v.margin, 0, true, v.category_id, v.empaque, 'UN', v.metadata
FROM (VALUES`;

const COLS_END = `\n) AS v(sku,name,price,cost_price,margin,category_id,empaque,metadata)\nON CONFLICT (sku) DO NOTHING;`;

const BATCH = 112;
let n = 0;
for (let i = 0; i < products.length; i += BATCH) {
  const slice = products.slice(i, i + BATCH);
  const sql = SELECT + '\n' + slice.map(row).join(',\n') + COLS_END;
  const file = `/tmp/ins_${n}.sql`;
  fs.writeFileSync(file, sql);
  console.log(`${file}: ${slice.length} filas, ${sql.length} bytes`);
  n++;
}
console.log(`Total: ${products.length} en ${n} lotes`);

// mini-lote de prueba: 3 filas
const test = SELECT + '\n' + products.slice(0, 3).map(row).join(',\n') + COLS_END;
fs.writeFileSync('/tmp/ins_test.sql', test);
console.log('mini-lote /tmp/ins_test.sql listo (3 filas)');
