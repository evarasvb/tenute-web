import { parseGenericPrice } from '@/lib/scrapers/parser-generic';
import { parsePriceForUrl } from '@/lib/scrapers/parser-domain';
import { normalizePriceToNumber } from '@/lib/scrapers/utils';
import { readFileSync } from 'fs';
import { join } from 'path';

function loadFixture(name: string) {
  return readFileSync(join(process.cwd(), 'src/__tests__/fixtures/competitors', name), 'utf8');
}

describe('normalizePriceToNumber', () => {
  test('normaliza miles CLP con punto', () => {
    expect(normalizePriceToNumber('$ 12.990')).toBe(12990);
  });

  test('normaliza valor con coma decimal', () => {
    expect(normalizePriceToNumber('12.990,00')).toBe(12990);
  });

  test('retorna null en input inválido', () => {
    expect(normalizePriceToNumber('sin precio')).toBeNull();
  });
});

describe('parseGenericPrice', () => {
  test('extrae desde meta itemprop price', () => {
    const html = loadFixture('dimerc.html');
    const result = parseGenericPrice({
      url: 'https://www.dimerc.cl/producto/test',
      html,
      selector: 'meta[itemprop=price]',
    });
    expect(result.price).toBe(12990);
    expect(result.source).toBe('selector');
    expect(result.inStock).toBe(true);
  });

  test('extrae desde json-ld offers', () => {
    const html = loadFixture('officemax.html');
    const result = parseGenericPrice({
      url: 'https://www.officemax.cl/producto/test',
      html,
    });
    expect(result.price).toBe(5590);
    expect(result.source).toBe('meta');
  });

  test('extrae desde regex fallback', () => {
    const html = '<html><body><p>Oferta especial $ 8.990 por tiempo limitado</p><span>Agotado</span></body></html>';
    const result = parseGenericPrice({
      url: 'https://example.com/item',
      html,
    });
    expect(result.price).toBe(8990);
    expect(result.source).toBe('regex');
    expect(result.inStock).toBe(false);
  });
});

describe('domain parser', () => {
  test('dimerc parser funciona', () => {
    const html = loadFixture('dimerc.html');
    const result = parsePriceForUrl({
      url: 'https://www.dimerc.cl/producto/test',
      html,
    });
    expect(result.price).toBe(12990);
  });

  test('officemax parser funciona', () => {
    const html = loadFixture('officemax.html');
    const result = parsePriceForUrl({
      url: 'https://www.officemax.cl/producto/test',
      html,
    });
    expect(result.price).toBe(5590);
  });

  test('pcfactory parser funciona', () => {
    const html = loadFixture('pcfactory.html');
    const result = parsePriceForUrl({
      url: 'https://www.pcfactory.cl/producto/test',
      html,
    });
    expect(result.price).toBe(52990);
  });

  test('sodimac parser funciona', () => {
    const html = loadFixture('sodimac.html');
    const result = parsePriceForUrl({
      url: 'https://www.sodimac.cl/sodimac-cl/producto/test',
      html,
    });
    expect(result.price).toBe(14990);
  });

  test('mercadolibre parser funciona', () => {
    const html = loadFixture('mercadolibre.html');
    const result = parsePriceForUrl({
      url: 'https://www.mercadolibre.cl/test',
      html,
    });
    expect(result.price).toBe(84990);
  });

  test('falabella parser funciona', () => {
    const html = loadFixture('falabella.html');
    const result = parsePriceForUrl({
      url: 'https://www.falabella.com/falabella-cl/product/test',
      html,
    });
    expect(result.price).toBe(58990);
  });
});
