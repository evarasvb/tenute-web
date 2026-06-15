import { cleanBarcodeForWrite, toEan13, planEanAssignments } from '@/lib/barcode';

// EAN-13 válidos conocidos (checksum correcto)
const EAN_A = '4006381333931';
const EAN_B = '5901234123457';

describe('cleanBarcodeForWrite', () => {
  test('cadena vacía -> null', () => {
    expect(cleanBarcodeForWrite('')).toBeNull();
  });
  test('solo espacios -> null', () => {
    expect(cleanBarcodeForWrite('   ')).toBeNull();
  });
  test('no-string -> null', () => {
    expect(cleanBarcodeForWrite(undefined)).toBeNull();
    expect(cleanBarcodeForWrite(123 as unknown)).toBeNull();
  });
  test('quita espacios internos y conserva el código', () => {
    expect(cleanBarcodeForWrite('  4006 3813 3393 1 ')).toBe(EAN_A);
  });
});

describe('toEan13', () => {
  test('UPC-A de 12 dígitos antepone 0', () => {
    expect(toEan13('012345678905')).toBe('0012345678905');
  });
  test('EAN-13 queda igual (ignora separadores)', () => {
    expect(toEan13('4006-3813-3393-1')).toBe(EAN_A);
  });
});

describe('planEanAssignments', () => {
  test('asigna un EAN válido a un producto sin código', () => {
    const { apply, skipped } = planEanAssignments([{ product_id: 'p1', ean: EAN_A }]);
    expect(apply).toEqual([{ product_id: 'p1', ean: EAN_A }]);
    expect(skipped).toHaveLength(0);
  });

  test('descarta EAN inválido (checksum)', () => {
    const { apply, skipped } = planEanAssignments([{ product_id: 'p1', ean: '4006381333930' }]);
    expect(apply).toHaveLength(0);
    expect(skipped[0].reason).toMatch(/inválido/i);
  });

  test('no pisa un producto que ya tiene EAN válido', () => {
    const { apply, skipped } = planEanAssignments(
      [{ product_id: 'p1', ean: EAN_A }],
      { currentBarcode: () => EAN_B }
    );
    expect(apply).toHaveLength(0);
    expect(skipped[0].reason).toMatch(/ya tiene/i);
  });

  test('descarta EAN que ya pertenece a OTRO producto (sin romper)', () => {
    const taken = new Map<string, string>([[EAN_A, 'otro-producto']]);
    const { apply, skipped } = planEanAssignments(
      [{ product_id: 'p1', ean: EAN_A }],
      { takenByOther: taken }
    );
    expect(apply).toHaveLength(0);
    expect(skipped[0].reason).toMatch(/otro producto/i);
  });

  test('mismo EAN para el MISMO producto en takenByOther sí se permite', () => {
    const taken = new Map<string, string>([[EAN_A, 'p1']]);
    const { apply } = planEanAssignments([{ product_id: 'p1', ean: EAN_A }], { takenByOther: taken });
    expect(apply).toEqual([{ product_id: 'p1', ean: EAN_A }]);
  });

  test('duplicado dentro del lote: solo el primero se aplica', () => {
    const { apply, skipped } = planEanAssignments([
      { product_id: 'p1', ean: EAN_A },
      { product_id: 'p2', ean: EAN_A },
    ]);
    expect(apply).toEqual([{ product_id: 'p1', ean: EAN_A }]);
    expect(skipped).toHaveLength(1);
    expect(skipped[0]).toMatchObject({ product_id: 'p2' });
    expect(skipped[0].reason).toMatch(/duplicado/i);
  });
});
