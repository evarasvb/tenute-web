#!/usr/bin/env node
/**
 * TENUTE — Buscador de fotos de productos en proveedores (Vanni, etc.)
 *
 * POR QUÉ ESTE SCRIPT:
 *   El entorno de Claude Code en la web tiene la red de salida restringida
 *   (lista blanca) y NO puede acceder a los sitios de los proveedores
 *   (vannichile.cl, dpschile.cl, foodpack.cl). Este script está pensado para
 *   ejecutarse en un computador normal CON internet.
 *
 * QUÉ HACE:
 *   1. Lee el catálogo de productos (scripts/tenute_pdf_products.json).
 *   2. Recorre el sitemap de Vanni y baja cada ficha de producto.
 *   3. Extrae la imagen principal (og:image) y el nombre de cada producto Vanni.
 *   4. Empareja cada producto de Tenute con el producto Vanni más parecido
 *      (por nombre normalizado) y le asigna la URL de la imagen.
 *   5. Escribe:
 *        - vanni-images.csv   (sku,image_url,matched_name,score)  -> para revisar
 *        - vanni-images.json  (mismo contenido en JSON)
 *
 * CÓMO USARLO (en tu computador, con Node 18+):
 *   1. Descarga este repo (o solo este archivo + scripts/tenute_pdf_products.json).
 *   2. node scripts/fetch-supplier-images.mjs
 *   3. Abre vanni-images.csv y revisa los emparejamientos (columna score: 1 = exacto).
 *   4. Sube vanni-images.csv a tu Google Drive y avísame: yo aplico las fotos
 *      a la base de datos (UPDATE products SET image_url ... WHERE sku ...).
 *
 * Nota: no requiere instalar dependencias (usa fetch nativo de Node 18+).
 *       Si algún emparejamiento queda malo, se corrige fácil editando el CSV.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const SLEEP_MS = 350;           // pausa entre requests (cortesía con el servidor)
const MATCH_THRESHOLD = 0.45;   // mínimo de similitud para aceptar un emparejamiento

const VANNI_SITEMAP = 'https://www.vannichile.cl/sitemap_index.xml';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function get(url) {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,application/xml' } });
      if (res.ok) return await res.text();
      if (res.status === 404) return null;
      // 403/429/5xx -> reintentar con backoff
    } catch { /* red: reintentar */ }
    await sleep(800 * (i + 1));
  }
  return null;
}

// --- Normalización de nombres para emparejar ---
const STOP = new Set(['de','con','sin','y','para','el','la','un','una','x','cm','mm','cc','gr','grs','kg','lt','ml','oz','un','uds','und','c','s','pqte','paquete','bolsa','caja','cj','bo','u','set','mt','m']);
function norm(s) {
  return (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(t => t && !STOP.has(t))
    .join(' ')
    .trim();
}
function tokens(s) { return new Set(norm(s).split(' ').filter(Boolean)); }
function score(a, b) {              // Jaccard sobre tokens
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

function extractOgImage(html) {
  const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  return m ? m[1] : null;
}
function extractTitle(html) {
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1) return h1[1].trim();
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (og) return og[1].replace(/\s*[-–|].*$/, '').trim();
  const t = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return t ? t[1].replace(/\s*[-–|].*$/, '').trim() : '';
}

async function collectVanniProducts() {
  console.log('Leyendo sitemap de Vanni...');
  const index = await get(VANNI_SITEMAP);
  if (!index) { console.error('No se pudo leer el sitemap de Vanni.'); return []; }
  const subSitemaps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
    .filter(u => /product|producto|sitemap/i.test(u));

  // URLs de fichas de producto
  const productUrls = new Set();
  for (const sm of subSitemaps) {
    const xml = await get(sm); await sleep(SLEEP_MS);
    if (!xml) continue;
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      if (/\/producto\//i.test(m[1])) productUrls.add(m[1]);
    }
  }
  const urls = [...productUrls];
  console.log(`Fichas de producto Vanni encontradas: ${urls.length}`);

  const out = [];
  let i = 0;
  for (const url of urls) {
    i++;
    const html = await get(url); await sleep(SLEEP_MS);
    if (!html) continue;
    const img = extractOgImage(html);
    const name = extractTitle(html);
    if (img && name) out.push({ name, url, image: img });
    if (i % 25 === 0) console.log(`  ${i}/${urls.length} fichas procesadas`);
  }
  console.log(`Productos Vanni con imagen: ${out.length}`);
  return out;
}

async function main() {
  const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'tenute_pdf_products.json'), 'utf-8'));
  const vanni = await collectVanniProducts();
  if (!vanni.length) { console.error('Sin datos de Vanni; abortando.'); process.exit(1); }

  const rows = [];
  for (const p of products) {
    let best = null, bestScore = 0;
    for (const v of vanni) {
      const sc = score(p.name, v.name);
      if (sc > bestScore) { bestScore = sc; best = v; }
    }
    rows.push({
      sku: p.sku,
      name: p.name,
      image_url: bestScore >= MATCH_THRESHOLD ? best.image : '',
      matched_name: bestScore >= MATCH_THRESHOLD ? best.name : '',
      score: bestScore.toFixed(2),
    });
  }

  const matched = rows.filter(r => r.image_url).length;
  const csv = 'sku,image_url,matched_name,score\n' + rows.map(r =>
    [r.sku, r.image_url, `"${r.matched_name.replace(/"/g, '""')}"`, r.score].join(',')
  ).join('\n');
  fs.writeFileSync(path.join(ROOT, 'vanni-images.csv'), csv);
  fs.writeFileSync(path.join(ROOT, 'vanni-images.json'), JSON.stringify(rows, null, 2));

  console.log(`\n✅ Listo. ${matched}/${rows.length} productos emparejados con foto.`);
  console.log('   Revisa vanni-images.csv y súbelo a Drive para aplicarlo a la tienda.');
}

main().catch(e => { console.error(e); process.exit(1); });
