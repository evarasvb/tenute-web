/**
 * Tests UI render and key interactions of CompetitivenessWidget.
 * Run with: npx jest --testPathPattern=competitiveness-widget.test
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CompetitivenessWidget from '@/components/admin/CompetitivenessWidget';
import { CompetitivenessPayload } from '@/lib/competitiveness-types';

const payload: CompetitivenessPayload = {
  generatedAt: '2026-05-04T00:00:00.000Z',
  adminEmail: 'admin@tenute.cl',
  kpis: {
    sobreMercado: 1,
    enMercado: 2,
    bajoMercado: 3,
    sinReferencia: 4,
    ingresosSobreMercado30d: 150000,
    ingresosBajoMercado30d: 90000,
  },
  tables: {
    sobreMercado: [
      {
        id: '1',
        sku: 'SKU-001',
        name: 'Producto sobre',
        clasificacion: 'sobre_mercado',
        precioNuestro: 12000,
        costo: 8000,
        precioMin: 9000,
        precioMediana: 10000,
        precioMax: 13000,
        competidoresConPrecio: 3,
        diferenciaAbs: 2000,
        diferenciaPct: 20,
        stockActual: 5,
        impactoPotencial: 0,
        productoUrl: '/admin/products/1',
      },
    ],
    bajoMercado: [
      {
        id: '2',
        sku: 'SKU-002',
        name: 'Producto bajo',
        clasificacion: 'bajo_mercado',
        precioNuestro: 7000,
        costo: 5000,
        precioMin: 8000,
        precioMediana: 9000,
        precioMax: 11000,
        competidoresConPrecio: 4,
        diferenciaAbs: -2000,
        diferenciaPct: -22.22,
        stockActual: 6,
        impactoPotencial: 12000,
        productoUrl: '/admin/products/2',
      },
    ],
    topVendidos: [
      {
        id: '2',
        sku: 'SKU-002',
        name: 'Producto bajo',
        clasificacion: 'bajo_mercado',
        precioNuestro: 7000,
        costo: 5000,
        precioMin: 8000,
        precioMediana: 9000,
        precioMax: 11000,
        competidoresConPrecio: 4,
        diferenciaAbs: -2000,
        diferenciaPct: -22.22,
        stockActual: 6,
        impactoPotencial: 12000,
        ranking: 1,
        unidadesVendidasMes: 10,
        ingresos30d: 70000,
        productoUrl: '/admin/products/2',
      },
    ],
  },
};

describe('CompetitivenessWidget', () => {
  test('muestra KPIs y tabla por defecto', () => {
    const html = renderToStaticMarkup(<CompetitivenessWidget payload={payload} />);

    expect(html).toContain('Competitividad');
    expect(html).toContain('Sobre mercado');
    expect(html).toContain('Competitividad vs Más Vendidos');
    expect(html).toContain('Producto bajo');
    expect(html).toContain('Ingresos 30d en sobre mercado');
    expect(html).toContain('Enviar resumen por email');
  });

  test('incluye los controles de tabs y exportacion', () => {
    const html = renderToStaticMarkup(<CompetitivenessWidget payload={payload} />);

    expect(html).toContain('Oportunidades de subir precio');
    expect(html).toContain('Mayores diferencias hacia arriba');
    expect(html).toContain('Exportar CSV');
  });
});
