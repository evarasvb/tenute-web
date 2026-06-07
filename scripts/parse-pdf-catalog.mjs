#!/usr/bin/env node
/**
 * TENUTE — Parser del "Catálogo Visual Tenute.pdf"
 *
 * Lee el texto extraído del PDF (Catálogo de Productos y Precios) y produce
 * un dataset estructurado de productos listo para cargar a la tabla `products`.
 *
 * Columnas del PDF (por fila):
 *   Código | Producto | Empaque | Costo(interno) | Utilidad(interna) |
 *   Unidad Neto | Unidad c/IVA | Mayor Neto (−5%) | Mayor c/IVA
 *
 * Mapeo a la tienda (decisiones confirmadas por el usuario):
 *   price        = Unidad c/IVA   (precio final que ve el cliente)
 *   compare_price= null
 *   cost_price   = Costo
 *   margin       = Utilidad
 *   stock        = 0  (el PDF no trae stock)
 *   active       = true (visibles, marcados sin stock)
 *   metadata     = { empaque, unidad_neto, mayor_neto, mayor_iva, pdf_categoria }
 *
 * Uso: node scripts/parse-pdf-catalog.mjs <archivo-texto-extraido.txt>
 */

import fs from 'fs';

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(SRC)) {
  console.error('❌ Pasa la ruta del archivo de texto extraído del PDF.');
  process.exit(1);
}

// El archivo es la respuesta JSON {"fileContent":"..."} del lector de Drive.
const raw = fs.readFileSync(SRC, 'utf-8');
let text;
try {
  text = JSON.parse(raw).fileContent;
} catch {
  text = raw; // por si ya viene como texto plano
}

// --- Mapeo de categorías del PDF a slugs de la tienda en vivo ---
const CAT_MAP = {
  'ENVASES DE ALUMINIO':            'insumos-desechables',
  'BANDEJAS, BLONDAS Y ACCESORIOS': 'insumos-desechables',
  'BLONDAS DE PAPEL':               'insumos-desechables',
  'CÁPSULAS DE PAPEL':              'insumos-desechables',
  'BOLSAS Y SACOS DE PAPEL':        'insumos-desechables',
  'BOLSAS PLÁSTICAS':               'insumos-desechables',
  'CAJAS DE CARTÓN MICROCORRUGADO': 'insumos-desechables',
  'CAJAS REPOSTERÍA, PIZZA Y MOLDES':'insumos-desechables',
  'COCKTAIL':                       'insumos-desechables',
  'CUBIERTOS':                      'insumos-desechables',
  'ENVASES BIODEGRADABLES':         'insumos-desechables',
  'ENVASES DE CARTÓN IMPERMEABLES': 'insumos-desechables',
  'ENVASES PLÁSTICOS Y PLUMAVIT':   'insumos-desechables',
  'FILM PVC':                       'insumos-desechables',
  'FOIL ALUMINIO':                  'insumos-desechables',
  'MANIPULACIÓN DE ALIMENTOS':      'insumos-desechables',
  'PALITOS Y BROCHETAS':            'insumos-desechables',
  'VASOS, POTES, COPAS Y ACCESORIOS':'insumos-desechables',
  'RESMAS, ROLLOS Y CORTES DE PAPEL':'papeleria',
  'ASEO E HIGIENE':                 'limpieza',
};

function cleanName(s) {
  return s
    .replace(/N[âa]º/g, 'N°')
    .replace(/N■/g, 'N°')
    .replace(/Nâ€º?/g, 'N°')
    .replace(/\\\*/g, '')      // \* artefactos
    .replace(/\*/g, '')        // * sueltos
    .replace(/â€"|â€"|â/g, '') // restos de codificación
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(s) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function money(tok) {
  // "$1.482" -> 1482 ; "$24" -> 24
  return parseInt(tok.replace(/[$.]/g, ''), 10);
}

const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

let currentCat = null;
const products = [];
const seen = new Set();
const skipped = [];

const headerRe = /^TENUTE · (.+?) www\.tenute\.cl/;
const prodRe = /^(\d{6,7})\s+(.*)$/;

for (const line of lines) {
  const h = line.match(headerRe);
  if (h) { currentCat = h[1].trim(); continue; }

  const m = line.match(prodRe);
  if (!m) continue;

  const code = m[1];
  let rest = m[2];

  // Tomar los ÚLTIMOS 6 tokens monetarios ($...) como las 6 columnas de precio.
  const tokens = rest.split(/\s+/);
  const moneyIdx = [];
  for (let i = 0; i < tokens.length; i++) {
    if (/^\$[\d.]+$/.test(tokens[i])) moneyIdx.push(i);
  }
  if (moneyIdx.length < 4) { skipped.push({ code, line, reason: 'pocos precios' }); continue; }

  const last6 = moneyIdx.slice(-6);
  const vals = last6.map(i => money(tokens[i]));
  // Si hay 6: [costo, utilidad, uNeto, uIVA, mNeto, mIVA]
  // Si hay menos, asumimos que faltan al inicio (raro); alineamos por la derecha.
  let costo, utilidad, uNeto, uIVA, mNeto, mIVA;
  if (vals.length === 6) {
    [costo, utilidad, uNeto, uIVA, mNeto, mIVA] = vals;
  } else {
    // alinear por la derecha: los últimos 4 suelen ser uNeto,uIVA,mNeto,mIVA
    [uNeto, uIVA, mNeto, mIVA] = vals.slice(-4);
    const head = vals.slice(0, -4);
    costo = head[0] ?? null;
    utilidad = head[1] ?? null;
  }

  // El texto de nombre+empaque es lo anterior al primer token del bloque de 6.
  const nameEnd = last6[0];
  const nameTokens = tokens.slice(0, nameEnd);

  // Separar empaque (último grupo) del nombre.
  let empaque = null;
  if (nameTokens.length) {
    const lastTok = nameTokens[nameTokens.length - 1];
    const prevTok = nameTokens[nameTokens.length - 2];
    if (/^(un|u)$/i.test(lastTok) && prevTok && /^[\d.]+$/.test(prevTok)) {
      empaque = `${prevTok} ${lastTok}`;
      nameTokens.splice(-2, 2);
    } else if (/^\d+\/(caja|pqte|cj)$/i.test(lastTok)) {
      empaque = lastTok;
      nameTokens.pop();
    } else if (/^(rollo|par|—)$/i.test(lastTok)) {
      empaque = lastTok === '—' ? null : lastTok;
      nameTokens.pop();
    }
  }

  const name = cleanName(nameTokens.join(' '));
  if (!name || uIVA == null || isNaN(uIVA)) { skipped.push({ code, line, reason: 'sin nombre/precio' }); continue; }
  if (seen.has(code)) { skipped.push({ code, line, reason: 'codigo duplicado' }); continue; }
  seen.add(code);

  const catSlug = CAT_MAP[currentCat] || 'insumos-desechables';

  products.push({
    sku: code,
    name,
    slug: `${slugify(name)}-${code}`,
    description: name + (empaque ? ` · Empaque: ${empaque}` : ''),
    price: uIVA,                 // Unidad c/IVA
    cost_price: costo ?? 0,
    margin: utilidad ?? 0,
    stock: 0,
    active: true,
    category_slug: catSlug,
    pdf_categoria: currentCat,
    empaque: empaque,
    unidad_neto: uNeto ?? null,
    mayor_neto: mNeto ?? null,
    mayor_iva: mIVA ?? null,
  });
}

fs.writeFileSync('/tmp/tenute_pdf_products.json', JSON.stringify(products, null, 2));

// Resumen
const byCat = {};
for (const p of products) byCat[p.category_slug] = (byCat[p.category_slug] || 0) + 1;
console.log(`✅ Productos parseados: ${products.length}`);
console.log(`⏭️  Filas saltadas:     ${skipped.length}`);
console.log('📂 Por categoría tienda:', byCat);
console.log('\n🔎 Muestra (primeros 5):');
console.log(JSON.stringify(products.slice(0, 5), null, 2));
console.log('\n🔎 Muestra (últimos 3):');
console.log(JSON.stringify(products.slice(-3), null, 2));
if (skipped.length) {
  console.log('\n⚠️ Ejemplos saltados:');
  console.log(skipped.slice(0, 8));
}
