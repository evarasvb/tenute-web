type NullableNumber = number | null;

export type CompetitivenessClassification =
  | 'sobre_mercado'
  | 'en_mercado'
  | 'bajo_mercado'
  | 'sin_referencia';

export interface CompetitivenessEntry {
  id: string;
  sku: string;
  name: string;
  clasificacion: CompetitivenessClassification;
  precioNuestro: NullableNumber;
  costo: NullableNumber;
  precioMin: NullableNumber;
  precioMediana: NullableNumber;
  precioMax: NullableNumber;
  competidoresConPrecio: number;
  diferenciaAbs: NullableNumber;
  diferenciaPct: NullableNumber;
  stockActual: number;
  impactoPotencial: NullableNumber;
  ranking?: number;
  unidadesVendidasMes?: number;
  ingresos30d?: number;
  productoUrl: string;
}

export interface CompetitivenessPayload {
  generatedAt: string;
  adminEmail: string | null;
  kpis: {
    sobreMercado: number;
    enMercado: number;
    bajoMercado: number;
    sinReferencia: number;
    ingresosSobreMercado30d: number;
    ingresosBajoMercado30d: number;
  };
  tables: {
    sobreMercado: CompetitivenessEntry[];
    bajoMercado: CompetitivenessEntry[];
    topVendidos: CompetitivenessEntry[];
  };
}

export interface CompetitivenessEmailPayload {
  sentTo: string;
  topSobreCount: number;
  topBajoCount: number;
  providerId?: string;
}
