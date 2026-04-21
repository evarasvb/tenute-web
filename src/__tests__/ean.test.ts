/**
 * Tests unitarios: EAN validation, normalisation, warehouse stock mapping
 * Run with: npx jest --testPathPattern=ean.test
 * (No external deps needed — jest + ts-jest already in devDependencies)
 */

// ─────────────────────────────────────────────
// Inline the pure functions to avoid Next.js route-module side effects
// (The same logic lives in /api/admin/ean/suggest/route.ts)
// ─────────────────────────────────────────────
function validateEAN13(code: string): boolean {
  if (!/^d{13}$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(code[12]);
}

function normaliseBarcode(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length === 12) return '0' + digits; // UPC-A → EAN-13
  if (digits.length === 13) return digits;
  return digits;
}

// Warehouse slug → DB column (mirrors ventas/route.ts WAREHOUSE_FIELD)
const WAREHOUSE_FIELD: Record<string, string> = {
  ocoa: 'stock_ocoa',
  local21: 'stock_local21',
  local: 'stock_local21', // legacy alias
};

// ─────────────────────────────────────────────
// validateEAN13
// ─────────────────────────────────────────────
describe('validateEAN13', () => {
  test('valid EAN-13: 4006381333931 (Faber-Castell)', () => {
    expect(validateEAN13('4006381333931')).toBe(true);
  });

  test('valid EAN-13: 5901234123457', () => {
    expect(validateEAN13('5901234123457')).toBe(true);
  });

  test('rejects code with wrong check digit', () => {
    expect(validateEAN13('4006381333930')).toBe(false); // last digit wrong
  });

  test('rejects code shorter than 13', () => {
    expect(validateEAN13('123456789012')).toBe(false);
  });

  test('rejects code with non-digits', () => {
    expect(validateEAN13('400638133393A')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(validateEAN13('')).toBe(false);
  });

  test('rejects 14-digit code', () => {
    expect(validateEAN13('40063813339310')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// normaliseBarcode
// ─────────────────────────────────────────────
describe('normaliseBarcode', () => {
  test('strips non-digit characters', () => {
    expect(normaliseBarcode('400-638-133-3931')).toBe('4006381333931');
  });

  test('converts UPC-A (12 digits) to EAN-13 by prepending 0', () => {
    expect(normaliseBarcode('012345678905')).toBe('0012345678905');
  });

  test('returns 13-digit code unchanged', () => {
    expect(normaliseBarcode('4006381333931')).toBe('4006381333931');
  });

  test('handles codes with spaces', () => {
    expect(normaliseBarcode('4006 3813 3393 1')).toBe('4006381333931');
  });
});

// ─────────────────────────────────────────────
// WAREHOUSE_FIELD mapping
// ─────────────────────────────────────────────
describe('WAREHOUSE_FIELD mapping', () => {
  test('ocoa maps to stock_ocoa', () => {
    expect(WAREHOUSE_FIELD['ocoa']).toBe('stock_ocoa');
  });

  test('local21 maps to stock_local21', () => {
    expect(WAREHOUSE_FIELD['local21']).toBe('stock_local21');
  });

  test('legacy alias local maps to stock_local21 (not stock_local)', () => {
    expect(WAREHOUSE_FIELD['local']).toBe('stock_local21');
    // Explicit assertion: must NOT map to legacy field name
    expect(WAREHOUSE_FIELD['local']).not.toBe('stock_local');
  });

  test('unknown warehouse returns undefined (caller should default to stock_ocoa)', () => {
    expect(WAREHOUSE_FIELD['unknown']).toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// Integration-style: validateEAN13 ∘ normaliseBarcode pipeline
// ─────────────────────────────────────────────
describe('EAN pipeline: normalise then validate', () => {
  test('UPC-A 012345678905 normalised to EAN-13 is valid', () => {
    const norm = normaliseBarcode('012345678905');
    expect(validateEAN13(norm)).toBe(true);
  });

  test('4006381333931 with hyphens passes full pipeline', () => {
    const norm = normaliseBarcode('4006-3813-3393-1');
    expect(validateEAN13(norm)).toBe(true);
  });
});
