import { parseVtexEans, bestEanForName, nameSimilarity } from '@/lib/ean-sources';

const EAN_VALID = '4006381333931'; // checksum válido

describe('parseVtexEans', () => {
  test('extrae name + ean de items VTEX', () => {
    const payload = [
      { productName: 'Lápiz Grafito HB', items: [{ ean: EAN_VALID }] },
      { productName: 'Sin ean', items: [{ ean: '' }] },
      { productName: 'Varios items', items: [{ ean: '111' }, { ean: '222' }] },
    ];
    expect(parseVtexEans(payload)).toEqual([
      { name: 'Lápiz Grafito HB', ean: EAN_VALID },
      { name: 'Varios items', ean: '111' },
      { name: 'Varios items', ean: '222' },
    ]);
  });

  test('payload inválido -> []', () => {
    expect(parseVtexEans(null)).toEqual([]);
    expect(parseVtexEans({})).toEqual([]);
  });
});

describe('nameSimilarity', () => {
  test('nombres iguales ~1, distintos ~0', () => {
    expect(nameSimilarity('Vaso Plástico 200cc', 'Vaso Plástico 200cc')).toBe(1);
    expect(nameSimilarity('Vaso Plástico', 'Corchetera Metálica')).toBe(0);
  });
});

describe('bestEanForName', () => {
  test('elige el EAN válido del candidato con nombre más parecido', () => {
    const candidates = [
      { name: 'Cuchara Plástica Blanca', ean: '0000000000000' }, // checksum inválido
      { name: 'Vaso Plástico Transparente 200 cc', ean: EAN_VALID },
    ];
    const best = bestEanForName('Vaso Plastico Transparente 200cc', candidates);
    expect(best?.ean).toBe(EAN_VALID);
  });

  test('descarta si la similitud no supera el umbral', () => {
    const candidates = [{ name: 'Producto totalmente distinto', ean: EAN_VALID }];
    expect(bestEanForName('Vaso Plastico 200cc', candidates, { threshold: 0.55 })).toBeNull();
  });

  test('descarta EAN con checksum inválido aunque el nombre calce', () => {
    const candidates = [{ name: 'Vaso Plastico 200cc', ean: '1234567890123' }];
    expect(bestEanForName('Vaso Plastico 200cc', candidates)).toBeNull();
  });
});
