import { fetchJsonWithTimeout, normalizeImageUrl } from '@/lib/product-images/http';

/**
 * Importador de catálogo de proveedores (Dimerc, Prisa) vía su API pública VTEX.
 * Trae productos completos (nombre, marca, EAN, imagen, precio, categoría) para
 * venderlos "bajo pedido" con precio calculado por margen. Funciones puras y
 * testeables separadas del fetch.
 */

export interface SupplierProduct {
  supplierSku: string;
  name: string;
  brand: string | null;
  ean: string | null;
  description: string | null;
  imageUrl: string | null;
  cost: number;            // precio del proveedor en CLP (entero)
  url: string | null;
  category: string | null;
}

export const SUPPLIERS: Record<string, { label: string; host: string }> = {
  dimerc: { label: 'Dimerc', host: 'www.dimerc.cl' },
  prisa: { label: 'Prisa', host: 'www.prisa.cl' },
};

function firstCategory(categories: unknown): string | null {
  if (!Array.isArray(categories) || categories.length === 0) return null;
  const raw = String(categories[0] || '');
  const parts = raw.split('/').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : null;
}

/** Mapea la respuesta cruda de la API VTEX a productos normalizados. Pura. */
export function mapVtexProducts(payload: unknown): SupplierProduct[] {
  if (!Array.isArray(payload)) return [];
  const out: SupplierProduct[] = [];

  for (const product of payload) {
    if (!product || typeof product !== 'object') continue;
    const p = product as Record<string, any>;

    const items = Array.isArray(p.items) ? p.items : [];
    const item = items[0] as Record<string, any> | undefined;
    if (!item) continue;

    // Precio: primer seller con oferta comercial.
    let cost = 0;
    const sellers = Array.isArray(item.sellers) ? item.sellers : [];
    for (const s of sellers) {
      const offer = s?.commertialOffer || s?.commercialOffer;
      const price = Number(offer?.Price ?? offer?.price ?? 0);
      if (price > 0) { cost = Math.round(price); break; }
    }
    if (cost <= 0) continue; // sin precio no sirve para tarificar

    const images = Array.isArray(item.images) ? item.images : [];
    const imageUrl = images[0]?.imageUrl ? normalizeImageUrl(String(images[0].imageUrl)) : null;

    const name = String(p.productName || item.nameComplete || item.name || '').trim();
    if (!name) continue;

    out.push({
      supplierSku: String(item.itemId || p.productId || p.productReference || ''),
      name,
      brand: p.brand ? String(p.brand).trim() : null,
      ean: item.ean ? String(item.ean).trim() : null,
      description:
        typeof p.description === 'string' && p.description.trim()
          ? p.description.trim().slice(0, 1200)
          : null,
      imageUrl,
      cost,
      url: p.link ? String(p.link) : (p.linkText ? `https://${p.linkText}/p` : null),
      category: firstCategory(p.categories),
    });
  }

  return out;
}

/** Consulta la API VTEX de un proveedor por término de búsqueda. */
export async function fetchSupplierProducts(
  supplierKey: string,
  query: string,
  limit = 20
): Promise<SupplierProduct[]> {
  const supplier = SUPPLIERS[supplierKey];
  if (!supplier) throw new Error(`Proveedor no soportado: ${supplierKey}`);
  const to = Math.max(0, Math.min(49, limit - 1));
  const url = `https://${supplier.host}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=${to}`;
  const payload = await fetchJsonWithTimeout<unknown>(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TenuteBot/1.0)' },
    timeoutMs: 15000,
  });
  return mapVtexProducts(payload).slice(0, limit);
}
