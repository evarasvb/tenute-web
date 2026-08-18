import { mapVtexProducts } from '@/lib/suppliers/catalog';
import { computeSalePrice, makeSlug } from '@/lib/suppliers/pricing';

describe('mapVtexProducts', () => {
  test('mapea nombre, marca, ean, imagen, precio y categoría', () => {
    const payload = [
      {
        productId: '111',
        productName: 'Lápiz Pasta BIC Cristal Azul',
        brand: 'BIC',
        link: 'https://www.dimerc.cl/lapiz/p',
        categories: ['/Escritorio/Lápices/'],
        items: [
          {
            itemId: '222',
            ean: '7891234567890',
            images: [{ imageUrl: 'http://dimerc.vtexassets.com/ids/1/lapiz.jpg' }],
            sellers: [{ commertialOffer: { Price: 390, AvailableQuantity: 100 } }],
          },
        ],
      },
    ];
    const out = mapVtexProducts(payload);
    expect(out).toEqual([
      {
        supplierSku: '222',
        name: 'Lápiz Pasta BIC Cristal Azul',
        brand: 'BIC',
        ean: '7891234567890',
        description: null,
        imageUrl: 'https://dimerc.vtexassets.com/ids/1/lapiz.jpg',
        cost: 390,
        url: 'https://www.dimerc.cl/lapiz/p',
        category: 'Lápices',
      },
    ]);
  });

  test('omite productos sin precio', () => {
    const payload = [
      { productName: 'Sin precio', items: [{ itemId: '1', sellers: [{ commertialOffer: { Price: 0 } }] }] },
    ];
    expect(mapVtexProducts(payload)).toEqual([]);
  });

  test('payload inválido -> []', () => {
    expect(mapVtexProducts(null)).toEqual([]);
    expect(mapVtexProducts({})).toEqual([]);
  });
});

describe('computeSalePrice', () => {
  test('aplica margen 40% y redondea a la decena hacia arriba', () => {
    // 390 * 1.4 = 546 -> decena arriba = 550
    expect(computeSalePrice(390, 40)).toBe(550);
  });
  test('sobre $10.000 redondea a la centena', () => {
    // 12000 * 1.4 = 16800 -> ya es centena
    expect(computeSalePrice(12000, 40)).toBe(16800);
    // 12345 * 1.4 = 17283 -> centena arriba = 17300
    expect(computeSalePrice(12345, 40)).toBe(17300);
  });
  test('nunca bajo el costo y costo 0 -> 0', () => {
    expect(computeSalePrice(0, 40)).toBe(0);
    expect(computeSalePrice(100, 0)).toBeGreaterThanOrEqual(100);
  });
});

describe('makeSlug', () => {
  test('normaliza acentos y agrega sufijo del sku', () => {
    expect(makeSlug('Lápiz Pasta BIC Cristal Azul', '222333')).toBe('lapiz-pasta-bic-cristal-azul-222333');
  });
  test('limpia caracteres y espacios', () => {
    expect(makeSlug('Corchetera Metálica 24/6!!', 'ABC')).toBe('corchetera-metalica-24-6-abc');
  });
});
