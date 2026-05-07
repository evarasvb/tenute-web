// Chilean phone number validation and formatting
export function validateChileanPhone(phone: string): { valid: boolean; formatted: string } {
  const cleaned = phone.replace(/[\s\-().]/g, '');

  // Match patterns: +569XXXXXXXX, 569XXXXXXXX, 09XXXXXXXX, 9XXXXXXXX
  const match = cleaned.match(/^(?:\+?56)?(?:0?9)(\d{8})$/);
  if (!match) {
    return { valid: false, formatted: phone };
  }

  const digits = match[1];
  const formatted = `+569 ${digits.slice(0, 4)} ${digits.slice(4)}`;
  return { valid: true, formatted };
}

export function formatPhoneOnChange(value: string): string {
  // Remove all non-digit characters except +
  let cleaned = value.replace(/[^\d+]/g, '');

  // If starts with +569, format as +569 XXXX XXXX
  if (cleaned.startsWith('+569') && cleaned.length > 4) {
    const digits = cleaned.slice(4, 12);
    if (digits.length <= 4) {
      return `+569 ${digits}`;
    }
    return `+569 ${digits.slice(0, 4)} ${digits.slice(4)}`;
  }

  return value;
}

// Chilean RUT validation using modulo 11 algorithm
export function validateRUT(rut: string): { valid: boolean; formatted: string } {
  // Remove dots and spaces
  let cleaned = rut.replace(/[.\s]/g, '');

  // Must have a dash
  if (!cleaned.includes('-')) {
    // Try to add dash before last character
    if (cleaned.length >= 2) {
      cleaned = cleaned.slice(0, -1) + '-' + cleaned.slice(-1);
    } else {
      return { valid: false, formatted: rut };
    }
  }

  const parts = cleaned.split('-');
  if (parts.length !== 2) return { valid: false, formatted: rut };

  const body = parts[0].replace(/\D/g, '');
  const dv = parts[1].toUpperCase();

  if (body.length < 6 || body.length > 8) return { valid: false, formatted: rut };
  if (dv.length !== 1 || !/^[0-9K]$/.test(dv)) return { valid: false, formatted: rut };

  // Modulo 11 verification
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  let expectedDV: string;
  if (remainder === 11) expectedDV = '0';
  else if (remainder === 10) expectedDV = 'K';
  else expectedDV = remainder.toString();

  if (dv !== expectedDV) return { valid: false, formatted: rut };

  // Format with dots: XX.XXX.XXX-X
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return { valid: true, formatted: `${formattedBody}-${dv}` };
}

export function formatRUTOnChange(value: string): string {
  // Remove dots
  let cleaned = value.replace(/\./g, '');

  // Extract body and optional DV
  let body: string;
  let dv = '';

  if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    body = parts[0].replace(/\D/g, '');
    dv = parts[1]?.toUpperCase().replace(/[^0-9K]/g, '').slice(0, 1) || '';
  } else {
    body = cleaned.replace(/\D/g, '');
    // If body has 7+ digits, last char might be DV
    if (body.length > 8) {
      dv = body.slice(-1);
      body = body.slice(0, -1);
    }
  }

  body = body.slice(0, 8);

  // Add dots
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (dv) return `${formattedBody}-${dv}`;
  if (cleaned.endsWith('-')) return `${formattedBody}-`;
  return formattedBody;
}

// Email validation
export function validateEmail(email: string): boolean {
  if (!email) return true; // optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function normalizeBarcode(value: string): string {
  return value.replace(/\s+/g, '').trim();
}

function isValidEan8(value: string): boolean {
  if (!/^\d{8}$/.test(value)) return false;
  const base = value.slice(0, 7);
  const check = Number(value[7]);
  let sum = 0;
  for (let i = 0; i < base.length; i++) {
    const digit = Number(base[i]);
    const positionFromLeft = i + 1;
    const weight = positionFromLeft % 2 === 1 ? 3 : 1;
    sum += digit * weight;
  }
  return ((10 - (sum % 10)) % 10) === check;
}

function isValidEan13(value: string): boolean {
  if (!/^\d{13}$/.test(value)) return false;
  const base = value.slice(0, 12);
  const check = Number(value[12]);
  let sum = 0;
  for (let i = 0; i < base.length; i++) {
    const digit = Number(base[i]);
    const positionFromLeft = i + 1;
    const weight = positionFromLeft % 2 === 1 ? 1 : 3;
    sum += digit * weight;
  }
  return ((10 - (sum % 10)) % 10) === check;
}

export function validateBarcode(
  raw: string,
  opts?: { allowCode128Like?: boolean }
): { valid: boolean; normalized: string; format?: 'EAN8' | 'EAN13' | 'OTHER' } {
  const normalized = normalizeBarcode(raw);
  if (!normalized) return { valid: true, normalized: '' };

  if (/^\d+$/.test(normalized)) {
    if (normalized.length === 8) {
      return { valid: isValidEan8(normalized), normalized, format: 'EAN8' };
    }
    if (normalized.length === 13) {
      return { valid: isValidEan13(normalized), normalized, format: 'EAN13' };
    }
    return { valid: false, normalized };
  }

  if (opts?.allowCode128Like) {
    const looksLikeCode128 = /^[\x20-\x7E]{6,32}$/.test(normalized);
    return { valid: looksLikeCode128, normalized, format: 'OTHER' };
  }

  return { valid: false, normalized };
}

export function isUniqueConstraintError(message?: string): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes('duplicate key value') || normalized.includes('unique constraint');
}
