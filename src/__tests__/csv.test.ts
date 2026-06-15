import { parseCsv, csvToObjects, toCsv } from '@/lib/csv';

describe('parseCsv', () => {
  test('parsea filas y columnas simples', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
  });

  test('respeta comas y saltos dentro de comillas', () => {
    const csv = 'name,desc\n"Pote, 225cc","línea1\nlínea2"';
    expect(parseCsv(csv)).toEqual([
      ['name', 'desc'],
      ['Pote, 225cc', 'línea1\nlínea2'],
    ]);
  });

  test('soporta comillas escapadas ("")', () => {
    expect(parseCsv('a\n"dice ""hola"""')).toEqual([['a'], ['dice "hola"']]);
  });

  test('ignora filas totalmente vacías', () => {
    expect(parseCsv('a,b\n1,2\n\n')).toEqual([['a', 'b'], ['1', '2']]);
  });
});

describe('csvToObjects', () => {
  test('usa la cabecera como claves y recorta espacios', () => {
    const rows = csvToObjects('name, sku ,price\nPote,FOP1, 44 ');
    expect(rows).toEqual([{ name: 'Pote', sku: 'FOP1', price: '44' }]);
  });

  test('archivo sin filas de datos -> []', () => {
    expect(csvToObjects('name,sku,price')).toEqual([]);
  });
});

describe('toCsv', () => {
  test('escapa comas, comillas y saltos; round-trip con parseCsv', () => {
    const headers = ['name', 'desc'];
    const rows = [['Pote, "A"', 'l1\nl2'], ['Vaso', '']];
    const csv = toCsv(headers, rows);
    const parsed = parseCsv(csv);
    expect(parsed[0]).toEqual(headers);
    expect(parsed[1]).toEqual(['Pote, "A"', 'l1\nl2']);
    expect(parsed[2]).toEqual(['Vaso', '']);
  });

  test('null/undefined se serializan como vacío', () => {
    expect(toCsv(['a', 'b'], [[null, undefined]])).toBe('a,b\n,');
  });
});
