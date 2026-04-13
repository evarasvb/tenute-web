import crypto from 'crypto';

const FLOW_SANDBOX_URL = 'https://sandbox.flow.cl/api';
const FLOW_PRODUCTION_URL = 'https://www.flow.cl/api';

function getFlowUrl(): string {
  return process.env.FLOW_SANDBOX === 'true' ? FLOW_SANDBOX_URL : FLOW_PRODUCTION_URL;
}

function getApiKey(): string {
  const key = process.env.FLOW_API_KEY;
  if (!key) throw new Error('FLOW_API_KEY is not set');
  return key;
}

function getSecretKey(): string {
  const key = process.env.FLOW_SECRET_KEY;
  if (!key) throw new Error('FLOW_SECRET_KEY is not set');
  return key;
}

/**
 * Sign Flow.cl API parameters.
 * All params are sorted alphabetically by key, concatenated as key=value,
 * then signed with HMAC-SHA256 using the secret key.
 */
export function signParams(params: Record<string, string>): string {
  const sorted = Object.keys(params).sort();
  const toSign = sorted.map(k => `${k}${params[k]}`).join('');
  return crypto.createHmac('sha256', getSecretKey()).update(toSign).digest('hex');
}

/**
 * Create a Flow.cl payment order.
 */
export async function createFlowPayment(opts: {
  commerceOrder: string;
  subject: string;
  amount: number;
  email: string;
  urlConfirmation: string;
  urlReturn: string;
  optional?: Record<string, string>;
}): Promise<{ url: string; token: string; flowOrder: number }> {
  const params: Record<string, string> = {
    apiKey: getApiKey(),
    commerceOrder: opts.commerceOrder,
    subject: opts.subject,
    currency: 'CLP',
    amount: Math.round(opts.amount).toString(),
    email: opts.email,
    urlConfirmation: opts.urlConfirmation,
    urlReturn: opts.urlReturn,
    ...opts.optional,
  };

  const s = signParams(params);
  params.s = s;

  const baseUrl = getFlowUrl();
  const res = await fetch(`${baseUrl}/payment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Flow API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  // Flow returns { url, token, flowOrder }
  return {
    url: data.url + '?token=' + data.token,
    token: data.token,
    flowOrder: data.flowOrder,
  };
}

/**
 * Get Flow.cl payment status.
 */
export async function getFlowPaymentStatus(token: string): Promise<{
  flowOrder: number;
  commerceOrder: string;
  status: number; // 1=pending, 2=paid, 3=rejected, 4=cancelled
  amount: number;
  paymentData?: Record<string, unknown>;
}> {
  const params: Record<string, string> = {
    apiKey: getApiKey(),
    token,
  };

  const s = signParams(params);
  params.s = s;

  const baseUrl = getFlowUrl();
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`${baseUrl}/payment/getStatus?${queryString}`, {
    method: 'GET',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Flow API error: ${res.status} ${text}`);
  }

  return res.json();
}

export function isFlowEnabled(): boolean {
  return !!(process.env.FLOW_API_KEY && process.env.FLOW_SECRET_KEY);
}
