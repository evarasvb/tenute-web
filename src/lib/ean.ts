/**
 * GTIN / EAN-13 check digit validation (digits only, length 13).
 * Use from API routes or utilities — do not export helpers from route.ts files.
 */
export function validateEAN13(code: string): boolean {
  const digits = String(code).replace(/\D/g, '');
  if (!/^\d{13}$/.test(digits)) return false;
  const arr = digits.split('').map(Number);
  const check = arr[12];
  const sum = arr.slice(0, 12).reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/** Accept 8–14 digit codes; only EAN-13 is strictly validated. */
export function normalizeBarcodeDigits(raw: string): string {
  return String(raw).replace(/\D/g, '');
}

export function isValidGtinDigits(digits: string): boolean {
  if (!/^\d{8,14}$/.test(digits)) return false;
  if (digits.length === 13) return validateEAN13(digits);
  return true;
}
