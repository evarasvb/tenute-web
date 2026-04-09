#!/usr/bin/env node
/**
 * TENUTE — Importador de catálogo completo a Supabase
 * 
 * Importa 624 productos con imágenes desde el catálogo de
 * Comercializadora MP Chile a la tienda Tenute.
 * 
 * Uso:
 *   1. Configura variables de entorno (o archivo .env.local):
 *      NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
 *      SUPABASE_SERVICE_ROLE_KEY=eyJ...
 * 
 *   2. Coloca product_images/ y tenute_products.json en la raíz del proyecto
 *   3. Ejecuta: node scripts/import-catalog.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// --- Config ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Ejemplo: NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/import-catalog.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Load data ---
const productsPath = path.join(ROOT, 'tenute_products.json');
if (!fs.existsSync(productsPath)) {
  console.error(`❌ No se encontró ${productsPath}`);
  console.error('   Copia tenute_products.json a la raíz del proyecto.');
  process.exit(1);
}
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

// --- Categories ---
const CATEGORIES = {
  'desechables':       { name: 'Insumos desechables',   desc: 'Vasos, platos, cubiertos, bolsas y embalaje.',         sort: 2 },
  'escritura':         { name: 'Escritura y Corrección', desc: 'Lápices, bolígrafos, correctores y marcadores.',       sort: 3 },
  'limpieza':          { name: 'Limpieza',               desc: 'Productos de aseo y limpieza para empresas.',          sort: 5 },
  'muebles-ergonomia': { name: 'Muebles y Ergonomía',   desc: 'Sillas, escritorios, respaldos y mobiliario.',         sort: 9 },
  'oficina':           { name: 'Artículos de oficina',   desc: 'Lapiceros, archivadores, carpetas, clips y más.',      sort: 1 },
  'varios':            { name: 'Varios',                 desc: 'Otros productos y novedades.',                         sort: 6 },
  'papeleria':         { name: 'Papelería',              desc: 'Resmas, papel fotográfico, sobres y artículos varios.',sort: 4 },
  'tecnologia':        { name: 'Tecnología',             desc: 'Accesorios de computación y electrónica básica.',      sort: 10 },
  'alimentos-cocina':  { name: 'Alimentos y Cocina',     desc: 'Café, azúcar, snacks y artículos de cocina.',          sort: 7 },
  'arte-escolar':      { name: 'Arte y Escolar',         desc: 'Témperas, pinturas, materiales artísticos.',           sort: 8 },
};

async function main() {
  console.log(`\n🚀 TENUTE — Importador de catálogo`);
  console.log(`   ${products.length} productos por importar\n`);

  // ---- STEP 1: Alter table (add extra columns) ----
  console.log('🔧 Agregando columnas extra a products...');
  const alterSQL = `
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand text;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit text DEFAULT 'UN';
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS format text;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS content_info text;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price numeric(12,2) DEFAULT 0;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS margin numeric(12,2) DEFAULT 0;
    CREATE UNIQUE INDEX IF NOT EXISTS products_sku_idx ON public.products(sku);
  `;
  const { error: alterErr } = await supabase.rpc('exec_sql', { sql: alterSQL }).catch(() => ({}));
  // If RPC doesn't exist, user needs to run the SQL manually
  if (alterErr) {
    console.log('   ⚠️  Ejecuta tenute_import.sql en SQL Editor primero (agrega columnas sku, brand, etc.)');
  } else {
    console.log('   ✅ Columnas agregadas');
  }

  // ---- STEP 2: Storage bucket ----
  console.log('\n📦 Creando bucket de imágenes...');
  const { error: bucketErr } = await supabase.storage.createBucket('products', {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });
  if (bucketErr && !bucketErr.message?.includes('already exists')) {
    console.warn('   ⚠️  Bucket:', bucketErr.message);
  } else {
    console.log('   ✅ Bucket "products" listo');
  }

  // ---- STEP 3: Categories ----
  console.log('\n📂 Actualizando categorías...');
  for (const [slug, info] of Object.entries(CATEGORIES)) {
    await supabase
      .from('categories')
      .upsert({ slug, name: info.name, description: info.desc, sort_order: info.sort },
              { onConflict: 'slug' });
  }
  const { data: cats } = await supabase.from('categories').select('id, slug');
  const catMap = {};
  for (const c of (cats || [])) catMap[c.slug] = c.id;
  console.log(`   ✅ ${Object.keys(catMap).length} categorías`);

  // ---- STEP 4: Upload images + Insert products ----
  console.log('\n📸 Subiendo imágenes y productos...');
  const BATCH = 20;
  let uploaded = 0, imgFail = 0, inserted = 0, errors = 0;
  const imgDir = path.join(ROOT, 'product_images');

  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    const rows = [];

    for (const p of batch) {
      let imageUrl = null;

      // Upload image if available
      if (p.has_image && fs.existsSync(imgDir)) {
        let imgPath = null;
        for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
          const candidate = path.join(imgDir, `${p.sku}.${ext}`);
          if (fs.existsSync(candidate)) { imgPath = candidate; break; }
        }

        if (imgPath) {
          const fileBuffer = fs.readFileSync(imgPath);
          const ext = path.extname(imgPath).slice(1);
          const storagePath = `catalog/${p.sku}.${ext}`;

          const { error: upErr } = await supabase.storage
            .from('products')
            .upload(storagePath, fileBuffer, {
              contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
              upsert: true,
            });

          if (!upErr) {
            const { data: urlData } = supabase.storage.from('products').getPublicUrl(storagePath);
            imageUrl = urlData.publicUrl;
            uploaded++;
          } else {
            imgFail++;
          }
        }
      }

      rows.push({
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        description: `${p.brand} - ${p.name}`,
        price: p.price,
        wholesale_price: p.wholesale_price,
        minimum_wholesale_qty: 6,
        stock: p.stock,
        image_url: imageUrl,
        category_id: catMap[p.category_slug] || null,
        featured: p.featured,
        active: true,
        brand: p.brand,
        unit: p.unit,
        format: p.format || null,
        content_info: p.content_info || null,
        cost_price: p.cost_price,
        margin: p.margin,
      });
    }

    // Upsert batch
    const { error: insErr } = await supabase
      .from('products')
      .upsert(rows, { onConflict: 'sku', ignoreDuplicates: false });

    if (insErr) {
      console.error(`\n   ❌ Batch ${i+1}-${i+batch.length}: ${insErr.message}`);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }

    process.stdout.write(`\r   📦 ${inserted}/${products.length} productos | 📸 ${uploaded} imágenes subidas`);
  }

  // ---- Summary ----
  console.log(`\n\n${'='.repeat(50)}`);
  console.log(`✅ Importación completada`);
  console.log(`${'='.repeat(50)}`);
  console.log(`   Productos insertados: ${inserted}`);
  console.log(`   Errores:              ${errors}`);
  console.log(`   Imágenes subidas:     ${uploaded}`);
  console.log(`   Imágenes fallidas:    ${imgFail}`);
  console.log(`   Sin imagen:           ${products.length - uploaded - imgFail}`);
  console.log(`   Categorías:           ${Object.keys(catMap).length}`);
  console.log(`\n   URL tienda: ${SUPABASE_URL.replace('.supabase.co', '')}`);
  console.log(`${'='.repeat(50)}\n`);
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
