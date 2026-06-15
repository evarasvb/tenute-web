import { parseVtexCandidates } from '@/lib/product-images/search';

describe('parseVtexCandidates (Dimerc / Prisa)', () => {
  test('extrae la primera imagen de cada producto VTEX', () => {
    const payload = [
      {
        productName: 'Lápiz Pasta BIC Cristal Azul',
        items: [{ images: [{ imageUrl: 'https://dimerc.vtexassets.com/arquivos/ids/123/lapiz.jpg' }] }],
      },
      {
        productName: 'Corchetera Metálica',
        items: [{ images: [{ imageUrl: 'http://dimerc.vtexassets.com/arquivos/ids/999/corchetera.png' }] }],
      },
    ];
    const out = parseVtexCandidates(payload, 'dimerc');
    expect(out).toEqual([
      { url: 'https://dimerc.vtexassets.com/arquivos/ids/123/lapiz.jpg', source: 'dimerc', title: 'Lápiz Pasta BIC Cristal Azul' },
      { url: 'https://dimerc.vtexassets.com/arquivos/ids/999/corchetera.png', source: 'dimerc', title: 'Corchetera Metálica' },
    ]);
  });

  test('omite productos sin imagen y normaliza http -> https', () => {
    const payload = [
      { productName: 'Sin imagen', items: [{ images: [] }] },
      { productName: 'Sin items' },
      { productName: 'OK', items: [{ images: [{ imageUrl: 'http://prisa.cl/img/x.jpg' }] }] },
    ];
    const out = parseVtexCandidates(payload, 'prisa');
    expect(out).toEqual([{ url: 'https://prisa.cl/img/x.jpg', source: 'prisa', title: 'OK' }]);
  });

  test('payload inválido -> []', () => {
    expect(parseVtexCandidates(null, 'dimerc')).toEqual([]);
    expect(parseVtexCandidates({}, 'dimerc')).toEqual([]);
    expect(parseVtexCandidates('nope', 'dimerc')).toEqual([]);
  });
});
