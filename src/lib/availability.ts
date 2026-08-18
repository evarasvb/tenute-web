/**
 * Estado de disponibilidad de un producto para la tienda.
 * Permite vender productos "bajo pedido" (de proveedor, sin stock propio)
 * en vez de mostrarlos como "Agotado".
 */
export type AvailabilityState = 'in_stock' | 'bajo_pedido' | 'agotado';

export interface AvailabilityInfo {
  state: AvailabilityState;
  label: string;
  buyable: boolean;
  leadDays?: { min: number; max: number };
}

interface HasStock {
  stock?: number | null;
  metadata?: unknown;
}

function readMeta(metadata: unknown): Record<string, any> {
  if (metadata && typeof metadata === 'object') return metadata as Record<string, any>;
  return {};
}

export function getAvailability(product: HasStock): AvailabilityInfo {
  const stock = Number(product.stock) || 0;
  if (stock > 0) {
    return { state: 'in_stock', label: 'En stock', buyable: true };
  }
  const meta = readMeta(product.metadata);
  if (meta.availability === 'bajo_pedido') {
    const min = Number(meta.lead_days_min) || 3;
    const max = Number(meta.lead_days_max) || 5;
    return {
      state: 'bajo_pedido',
      label: `Bajo pedido · ${min}-${max} días`,
      buyable: true,
      leadDays: { min, max },
    };
  }
  return { state: 'agotado', label: 'Agotado', buyable: false };
}
