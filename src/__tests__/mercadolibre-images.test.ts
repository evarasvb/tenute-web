import { parseMercadoLibreCandidates } from '@/lib/product-images/mercadolibre';

describe('parseMercadoLibreCandidates', () => {
  test('extrae thumbnails y normaliza http a https', () => {
    const payload = {
      results: [
        {
          id: 'MLC1',
          title: 'Producto 1',
          thumbnail: 'http://http2.mlstatic.com/D_123.jpg',
        },
        {
          id: 'MLC2',
          title: 'Producto 2',
          thumbnail: 'https://http2.mlstatic.com/D_456.jpg',
        },
      ],
    };

    const parsed = parseMercadoLibreCandidates(payload);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({
      url: 'https://http2.mlstatic.com/D_123.jpg',
      source: 'mercadolibre',
      title: 'Producto 1',
    });
    expect(parsed[1]).toEqual({
      url: 'https://http2.mlstatic.com/D_456.jpg',
      source: 'mercadolibre',
      title: 'Producto 2',
    });
  });

  test('elimina duplicados y entradas inválidas', () => {
    const payload = {
      results: [
        { title: 'A', thumbnail: 'http://http2.mlstatic.com/D_A.jpg' },
        { title: 'A repetido', thumbnail: 'https://http2.mlstatic.com/D_A.jpg' },
        { title: 'Sin thumb' },
        { title: 'Thumb vacío', thumbnail: '' },
      ],
    };

    const parsed = parseMercadoLibreCandidates(payload);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].url).toBe('https://http2.mlstatic.com/D_A.jpg');
  });

  test('retorna arreglo vacío cuando payload es inválido', () => {
    expect(parseMercadoLibreCandidates(null)).toEqual([]);
    expect(parseMercadoLibreCandidates({})).toEqual([]);
    expect(parseMercadoLibreCandidates('texto')).toEqual([]);
  });
});
